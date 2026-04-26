require('dotenv').config();
const dns = require('dns');

// Render and similar platforms may not have reliable IPv6 egress; prefer IPv4 when both records exist.
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (err) {
  console.warn('Could not set DNS result order to ipv4first:', err.message);
}

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { CohereClient } = require('cohere-ai');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';
const PORT = process.env.PORT || 5000;
const DATABASE_URL = process.env.DATABASE_URL;

if (!JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set. JWT operations may fail.');
}
if (!process.env.COHERE_API_KEY) {
  console.warn('Warning: COHERE_API_KEY is not set. AI extraction endpoint will not work.');
}
if (!DATABASE_URL) {
  console.error('Database configuration error: DATABASE_URL must be set.');
  process.exit(1);
}

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY
});

const useSsl = process.env.NODE_ENV === 'production' || DATABASE_URL.includes('supabase.co');
const forcePgIpv4 = process.env.PG_FORCE_IPV4 !== 'false';
const dbPoolConfig = {
  connectionString: DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false
};

if (forcePgIpv4) {
  // Prevent ENETUNREACH on hosts where outbound IPv6 is not available.
  dbPoolConfig.family = 4;
}

if (process.env.PGHOSTADDR) {
  // Optional hard override when DNS is unstable or returns unreachable addresses.
  dbPoolConfig.host = process.env.PGHOSTADDR;
}

let db = new Pool(dbPoolConfig);

async function resolveDatabaseIpv4Host() {
  try {
    const parsed = new URL(DATABASE_URL);
    const hostname = parsed.hostname;
    if (!hostname) {
      return null;
    }

    const resolved = await dns.promises.lookup(hostname, { family: 4 });
    return resolved && resolved.address ? resolved.address : null;
  } catch (err) {
    console.warn('Could not resolve database IPv4 host:', err.message);
    return null;
  }
}

async function switchDbPoolHost(host) {
  const previousDb = db;
  const nextConfig = { ...dbPoolConfig, host };
  db = new Pool(nextConfig);

  try {
    await previousDb.end();
  } catch (err) {
    console.warn('Could not cleanly close previous DB pool during host switch:', err.message);
  }
}

const app = express();

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id', 'user-email', 'user-name'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static frontend files from the project root
const frontendPath = path.join(__dirname, '..');
app.use(express.static(frontendPath));

app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

let haramIngredientsArr = [];
try {
  const haramData = fs.readFileSync(path.join(__dirname, './ingredients.json'), 'utf8');
  const parsed = JSON.parse(haramData);
  haramIngredientsArr = parsed.ingredients || [];
} catch (error) {
  console.error('Error loading haram ingredients:', error);
}

function strongNormalize(str) {
  return str
    .replace(/[()]/g, '')
    .replace(/\d+[.,]?\d*\s*%/g, '')
    .replace(/\d+[.,]?\d*\s*g\b/gi, '')
    .replace(/\d+[%]?/g, '')
    .replace(/[^a-zA-Z\s]/g, '')
    .replace(/\b(powdered|concentrated|artificial|natural|modified|autolyzed|hydrogenated|partially|refined|unrefined|organic|non\-dairy|dehydrated|reconstituted|emulsified|raw|cooked|roasted|toasted|ground)\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/s\b/g, '')
    .trim()
    .toLowerCase();
}

function isSectionHeader(str) {
  return /^[A-Z\s]+:?$/.test(str.trim()) || /^(noodles|seasoning|powder|oil|sauce|shallot|contains|produced|products|that|peanuts|crustacean|egg|dairy|fish)$/i.test(str.trim());
}

const OCR_INGREDIENT_INDICATORS = [
  'ingredient', 'ingredients', 'contains', 'bahan', 'komposisi', 'material'
];

const OCR_INGREDIENT_KEYWORDS = [
  'salt', 'sugar', 'oil', 'flour', 'starch', 'protein', 'extract', 'spice',
  'seasoning', 'acid', 'gum', 'lecithin', 'yeast', 'enzyme', 'whey', 'milk',
  'egg', 'soy', 'corn', 'wheat', 'gluten', 'dextrose', 'maltodextrin',
  'glucose', 'fructose', 'syrup', 'vinegar', 'cocoa', 'chocolate', 'caramel',
  'citrate', 'phosphate', 'benzoate', 'sorbate', 'carbonate', 'carrageenan',
  'xanthan', 'pectin', 'casein', 'powder', 'onion', 'garlic', 'pepper',
  'flavor', 'flavour', 'preservative', 'emulsifier', 'colour', 'color'
];

function hasUsableOcrSignal(text) {
  if (!text || typeof text !== 'string') return false;

  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length < 12) return false;

  const alphaTokens = normalized.toLowerCase().match(/[a-z]{2,}/g) || [];
  if (alphaTokens.length < 3) return false;

  const uniqueTokenRatio = new Set(alphaTokens).size / alphaTokens.length;
  if (alphaTokens.length >= 6 && uniqueTokenRatio < 0.28) return false;

  return true;
}

function isLikelyIngredientOcrText(text) {
  if (!hasUsableOcrSignal(text)) return false;

  const normalized = String(text || '').toLowerCase();
  const firstLines = normalized.split(/\n|\r/).slice(0, 5).join(' ');

  const hasIndicator = OCR_INGREDIENT_INDICATORS.some(indicator => firstLines.includes(indicator));
  const keywordCount = OCR_INGREDIENT_KEYWORDS.reduce((count, keyword) => (
    count + (normalized.includes(keyword) ? 1 : 0)
  ), 0);
  const separatorCount = (normalized.match(/[,;]|\band\b/gi) || []).length;
  const eNumberCount = (normalized.match(/\be\d{3}[a-z]?\b/gi) || []).length;
  const hasQuantityIndicators = /(\d+%|\d+\s*(g|mg|ml|oz|kg|l)\b)/i.test(normalized);

  if (hasIndicator) return true;
  if (keywordCount >= 2 && separatorCount >= 1) return true;
  if (keywordCount >= 3) return true;
  if (eNumberCount >= 2) return true;
  if (eNumberCount >= 1 && (separatorCount >= 1 || keywordCount >= 1)) return true;
  if (hasQuantityIndicators && keywordCount >= 2) return true;

  return false;
}

function isPlausibleIngredientListText(ingredientText) {
  if (!ingredientText || typeof ingredientText !== 'string') return false;

  const items = ingredientText
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

  if (items.length >= 2) return true;
  if (items.length === 1) return items[0].split(/\s+/).length >= 2;
  return false;
}

function splitIngredientItems(value) {
  return String(value || '')
    .split(/[,;\n\r]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeIngredientForSimilarity(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/0/g, 'o')
    .replace(/1/g, 'l')
    .replace(/3/g, 'e')
    .replace(/5/g, 's')
    .replace(/8/g, 'b')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function computeTokenOverlapScore(a, b) {
  const aTokens = normalizeIngredientForSimilarity(a).split(/\s+/).filter(Boolean);
  const bTokens = normalizeIngredientForSimilarity(b).split(/\s+/).filter(Boolean);
  if (!aTokens.length || !bTokens.length) return 0;

  const bSet = new Set(bTokens);
  const overlap = aTokens.filter(token => bSet.has(token)).length;
  return overlap / aTokens.length;
}

function getBestOcrCandidateMatch(aiItem, ocrCandidates) {
  const aiNorm = normalizeIngredientForSimilarity(aiItem);
  let best = { score: 0, candidate: '' };

  ocrCandidates.forEach(candidate => {
    const candidateNorm = normalizeIngredientForSimilarity(candidate);
    if (!candidateNorm) return;

    let score = compareTwoStrings(aiNorm, candidateNorm);
    if (candidateNorm.includes(aiNorm) || aiNorm.includes(candidateNorm)) {
      score = Math.max(score, 0.76);
    }

    const tokenOverlap = computeTokenOverlapScore(aiNorm, candidateNorm);
    score = Math.max(score, tokenOverlap * 0.86);

    if (score > best.score) {
      best = { score, candidate };
    }
  });

  return best;
}

function groundAiIngredientListToOcr(aiIngredientList, ocrText) {
  const aiItems = splitIngredientItems(aiIngredientList);
  if (!aiItems.length) return '';

  const ocrCandidates = splitIngredientItems(ocrText);
  const normalizedOcrText = normalizeIngredientForSimilarity(ocrText);
  const grounded = [];
  const seen = new Set();

  aiItems.forEach(aiItem => {
    const aiNorm = normalizeIngredientForSimilarity(aiItem);
    if (!aiNorm) return;

    const directEvidence = normalizedOcrText.includes(aiNorm);
    const bestMatch = getBestOcrCandidateMatch(aiItem, ocrCandidates);
    const hasGrounding = directEvidence || bestMatch.score >= 0.58;
    if (!hasGrounding) return;

    const canonical = aiItem.replace(/\s+/g, ' ').trim();
    const canonicalKey = canonical.toLowerCase();
    if (!canonical || seen.has(canonicalKey)) return;

    seen.add(canonicalKey);
    grounded.push(canonical);
  });

  return grounded.join(', ');
}

function noIngredientDetectedPayload() {
  return {
    success: true,
    ingredients: '',
    code: 'NO_INGREDIENT_LIST_DETECTED',
    warning: 'No ingredient list detected in OCR text'
  };
}

// Uses Dice coefficient over bigrams, matching the behavior previously used from string-similarity.
function compareTwoStrings(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const first = new Map();
  for (let i = 0; i < a.length - 1; i += 1) {
    const bigram = a.slice(i, i + 2);
    first.set(bigram, (first.get(bigram) || 0) + 1);
  }

  let intersectionSize = 0;
  for (let i = 0; i < b.length - 1; i += 1) {
    const bigram = b.slice(i, i + 2);
    const count = first.get(bigram) || 0;
    if (count > 0) {
      first.set(bigram, count - 1);
      intersectionSize += 1;
    }
  }

  return (2 * intersectionSize) / (a.length + b.length - 2);
}

const SOURCE_SIGNAL_PATTERNS = [
  { key: 'pork', patterns: [/\bpork\b/i, /\bporcine\b/i, /\bswine\b/i, /\bpig\b/i, /\blard\b/i, /\bbacon\b/i] },
  { key: 'beef', patterns: [/\bbeef\b/i, /\bbovine\b/i, /\bcattle\b/i, /\bcow\b/i, /\bcalf\b/i, /\bveal\b/i] },
  { key: 'fish', patterns: [/\bfish\b/i, /\bseafood\b/i, /\bmarine\b/i, /\bshrimp\b/i, /\bprawn\b/i, /\bcrab\b/i, /\blobster\b/i, /\bclam\b/i, /\bmussel\b/i, /\boyster\b/i, /\bsquid\b/i, /\bcuttlefish\b/i] },
  { key: 'plant', patterns: [/\bplant\b/i, /\bvegetable\b/i, /\bbotanical\b/i, /\bvegetal\b/i, /\bsoy\b/i, /\bsunflower\b/i, /\bpalm\b/i, /\bcoconut\b/i, /\bcanola\b/i, /\bcorn\b/i, /\bwheat\b/i, /\brice\b/i, /\bcassava\b/i, /\btapioca\b/i, /\boat\b/i] },
  { key: 'dairy', patterns: [/\bmilk\b/i, /\bwhey\b/i, /\bcasein\b/i, /\bcaseinate\b/i, /\bcheese\b/i, /\brennet\b/i] },
  { key: 'microbial', patterns: [/\bmicrobial\b/i, /\bferment/i, /\bbacterial\b/i, /\bfungal\b/i, /\byeast\b/i] },
  { key: 'synthetic', patterns: [/\bsynthetic\b/i, /\bartificial\b/i, /\blab\b/i, /\bchemical\b/i, /\bsolvent\b/i] },
  { key: 'animal', patterns: [/\banimal\b/i] }
];

function detectSourceSignals(text) {
  const signals = new Set();
  const normalizedText = String(text || '').toLowerCase();

  SOURCE_SIGNAL_PATTERNS.forEach(group => {
    if (group.patterns.some(pattern => pattern.test(normalizedText))) {
      signals.add(group.key);
    }
  });

  return signals;
}

function getSourceWeight(signal) {
  switch (signal) {
    case 'pork':
    case 'beef':
    case 'fish':
      return 0.18;
    case 'plant':
    case 'dairy':
    case 'microbial':
      return 0.14;
    case 'synthetic':
      return 0.12;
    case 'animal':
      return 0.08;
    default:
      return 0;
  }
}

function computeSourceAlignmentScore(inputSignals, candidateSignals) {
  if (!inputSignals.size && !candidateSignals.size) return 0;

  let score = 0;
  let matches = 0;
  let conflicts = 0;

  inputSignals.forEach(signal => {
    if (candidateSignals.has(signal)) {
      score += getSourceWeight(signal);
      matches += 1;
      return;
    }

    const conflictingSpecificSignals = (signal === 'plant' || signal === 'dairy' || signal === 'microbial' || signal === 'synthetic')
      ? ['pork', 'beef', 'fish', 'animal']
      : (signal === 'animal' ? ['plant', 'dairy', 'microbial', 'synthetic'] : []);

    if (conflictingSpecificSignals.some(conflict => candidateSignals.has(conflict))) {
      score -= 0.09;
      conflicts += 1;
    }
  });

  if (inputSignals.size > 0 && matches === 0 && candidateSignals.size === 0) {
    score -= 0.05;
  }

  if (inputSignals.size > 0 && candidateSignals.size > 0 && matches === 0 && conflicts === 0) {
    score -= 0.03;
  }

  return score;
}

function getEntrySourceSignals(dbEntry, name) {
  const signals = detectSourceSignals(`${name || ''} ${dbEntry.source || ''} ${dbEntry.category || ''}`);
  const itemName = String(dbEntry.item_name || '').toLowerCase();

  if (/\be\d{3,4}\b/i.test(itemName)) {
    // E-numbers often need the descriptive name more than the code, so keep the name-derived signals.
  }

  return signals;
}

const MASHBOOH_STATUS_REGEX = /mushbooh|mashbooh|doubtful|uncertain|syubhat|shubha/i;
const HALAL_STATUS_REGEX = /halal/i;
const HARAM_STATUS_REGEX = /haram/i;

const RULE_CONDITION_STOPWORDS = new Set([
  'and', 'or', 'with', 'without', 'from', 'of', 'source', 'sources', 'explicit',
  'unspecified', 'unknown', 'default', 'use', 'using', 'contains', 'contain'
]);

const SOURCE_SPECIFIC_TERMS = ['plant', 'vegetable', 'microbial', 'fish', 'beef', 'chicken', 'halal certified', 'porcine', 'pork'];
const CAUTIONARY_GENERIC_TERMS = ['flavor', 'flavour', 'enzyme', 'emulsifier'];
const HARAM_PORK_TERMS = ['pork', 'porcine', 'swine', 'lard', 'bacon', 'ham'];
const HARAM_INTOXICANT_ALCOHOL_TERMS = ['ethanol', 'wine', 'beer', 'khamr', 'rum', 'vodka', 'whiskey', 'whisky'];
const NON_INTOXICANT_ALCOHOL_EXCEPTIONS = ['cetyl alcohol', 'stearyl alcohol', 'cetearyl alcohol', 'benzyl alcohol', 'fatty alcohol'];

let ingredientLookupCache = null;

function normalizeIngredientStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (HARAM_STATUS_REGEX.test(normalized)) return 'HARAM';
  if (MASHBOOH_STATUS_REGEX.test(normalized)) return 'MUSHBOOH';
  if (HALAL_STATUS_REGEX.test(normalized)) return 'HALAL';
  return 'MUSHBOOH';
}

function normalizeLookupKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9\s\-/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeConditionTerms(value) {
  return normalizeLookupKey(value)
    .split(/\s+/)
    .map(token => token.trim())
    .filter(token => token && token.length >= 3 && !RULE_CONDITION_STOPWORDS.has(token));
}

function splitConditionVariants(condition) {
  return String(condition || '')
    .split(/\bor\b|\//i)
    .map(part => part.trim())
    .filter(Boolean);
}

function conditionVariantMatches(variant, ingredientKey) {
  const terms = tokenizeConditionTerms(variant);
  if (!terms.length) {
    const normalizedVariant = normalizeLookupKey(variant);
    return normalizedVariant ? ingredientKey.includes(normalizedVariant) : false;
  }

  return terms.every(term => ingredientKey.includes(term));
}

function ruleConditionMatchesIngredient(condition, ingredientKey) {
  const normalizedCondition = normalizeLookupKey(condition);
  if (!normalizedCondition) return false;

  const variants = splitConditionVariants(normalizedCondition);
  if (!variants.length) return conditionVariantMatches(normalizedCondition, ingredientKey);

  return variants.some(variant => conditionVariantMatches(variant, ingredientKey));
}

function splitInputIngredients(ingredientsList) {
  return String(ingredientsList || '')
    .split(/[,;\.\n\r]/)
    .map(value => value.trim())
    .filter(value => value.length > 0 && !isSectionHeader(value));
}

function buildIngredientLookup() {
  if (ingredientLookupCache) return ingredientLookupCache;

  const byExactName = new Map();
  const byAlias = new Map();
  const byECode = new Map();

  haramIngredientsArr.forEach((entry) => {
    const exactNames = [entry.item_name, entry.name]
      .map(name => String(name || '').trim())
      .filter(Boolean);

    exactNames.forEach((name) => {
      const key = normalizeLookupKey(name);
      if (!key) return;
      if (!byExactName.has(key)) byExactName.set(key, []);
      byExactName.get(key).push({ entry, name, key });

      const eMatches = key.match(/\be\d{3,4}[a-z]?\b/gi) || [];
      eMatches.forEach((eCode) => {
        const normalizedECode = eCode.toLowerCase();
        if (!byECode.has(normalizedECode)) byECode.set(normalizedECode, []);
        byECode.get(normalizedECode).push({ entry, name, key });
      });
    });

    (entry.aliases || []).forEach((alias) => {
      const name = String(alias || '').trim();
      const key = normalizeLookupKey(name);
      if (!key) return;

      if (!byAlias.has(key)) byAlias.set(key, []);
      byAlias.get(key).push({ entry, name, key });

      const eMatches = key.match(/\be\d{3,4}[a-z]?\b/gi) || [];
      eMatches.forEach((eCode) => {
        const normalizedECode = eCode.toLowerCase();
        if (!byECode.has(normalizedECode)) byECode.set(normalizedECode, []);
        byECode.get(normalizedECode).push({ entry, name, key });
      });
    });
  });

  ingredientLookupCache = { byExactName, byAlias, byECode };
  return ingredientLookupCache;
}

function getRuleBasedStatus(entry, ingredientName) {
  const ingredientKey = normalizeLookupKey(ingredientName);
  const rules = Array.isArray(entry.rules) ? entry.rules : [];

  for (const rule of rules) {
    const condition = normalizeLookupKey(rule.condition || '');
    if (!condition) continue;
    if (condition === 'any source') {
      return normalizeIngredientStatus(rule.status);
    }
    if (condition !== 'unknown source' && ruleConditionMatchesIngredient(condition, ingredientKey)) {
      return normalizeIngredientStatus(rule.status);
    }
  }

  const unknownRule = rules.find(rule => normalizeLookupKey(rule.condition || '') === 'unknown source');
  if (unknownRule) return normalizeIngredientStatus(unknownRule.status);

  if (entry.default_status) return normalizeIngredientStatus(entry.default_status);
  return normalizeIngredientStatus(entry.status);
}

function resolveCandidatesDeterministically(candidates, ingredientName, matchMode) {
  const resolved = candidates.map(({ entry, name }) => ({
    entry,
    name,
    status: getRuleBasedStatus(entry, ingredientName)
  }));

  const uniqueStatuses = Array.from(new Set(resolved.map(item => item.status)));
  if (uniqueStatuses.length > 1) {
    return {
      status: 'MUSHBOOH',
      reason: `Database has multiple conditional outcomes for this ingredient (${uniqueStatuses.join('/')}); conservative ruling is MUSHBOOH.`,
      confidence_score: 0.68,
      matched_name: resolved.map(item => item.name).slice(0, 3).join(' / '),
      category: resolved[0].entry.category
    };
  }

  const primary = resolved[0];
  const modeReason = matchMode === 'exact'
    ? 'Exact database name match.'
    : (matchMode === 'alias'
      ? 'Alias database match.'
      : (matchMode === 'fuzzy' ? 'Fuzzy database match with strong lexical/source alignment.' : 'E-number database match.'));
  const baseReason = primary.entry.reason || 'Classified by verified database entry.';
  const confidence_score = matchMode === 'exact'
    ? 0.98
    : (matchMode === 'alias' ? 0.9 : (matchMode === 'fuzzy' ? 0.82 : 0.86));

  return {
    status: primary.status,
    reason: `${modeReason} ${baseReason}`,
    confidence_score,
    matched_name: primary.name,
    category: primary.entry.category
  };
}

function hasAnyTerm(text, terms) {
  const normalized = String(text || '').toLowerCase();
  return terms.some(term => normalized.includes(term));
}

function isIntoxicantAlcoholIngredient(text) {
  const normalized = String(text || '').toLowerCase();
  if (!normalized.includes('alcohol') && !hasAnyTerm(normalized, HARAM_INTOXICANT_ALCOHOL_TERMS)) {
    return false;
  }
  if (hasAnyTerm(normalized, NON_INTOXICANT_ALCOHOL_EXCEPTIONS)) {
    return false;
  }
  return true;
}

function classifyFromHardRules(ingredientName) {
  if (hasAnyTerm(ingredientName, HARAM_PORK_TERMS)) {
    return {
      status: 'HARAM',
      reason: 'Contains pork-derived term, which is categorically haram.',
      confidence_score: 1
    };
  }

  if (isIntoxicantAlcoholIngredient(ingredientName)) {
    return {
      status: 'HARAM',
      reason: 'Contains intoxicant alcohol indication, which is categorically haram.',
      confidence_score: 1
    };
  }

  const lowered = String(ingredientName || '').toLowerCase();
  const hasCautionaryTerm = CAUTIONARY_GENERIC_TERMS.some(term => lowered.includes(term));
  const hasSourceSpecific = SOURCE_SPECIFIC_TERMS.some(term => lowered.includes(term));
  if (hasCautionaryTerm && !hasSourceSpecific) {
    return {
      status: 'MUSHBOOH',
      reason: 'Generic functional ingredient without explicit source; conservative ruling is mushbooh.',
      confidence_score: 0.74
    };
  }

  return null;
}

function flattenLookupCandidates(lookup) {
  const seen = new Set();
  const candidates = [];

  const addCandidate = (candidate) => {
    if (!candidate || !candidate.entry) return;
    const entryName = String(candidate.entry.item_name || candidate.entry.name || '').toLowerCase();
    const candidateName = String(candidate.name || '').toLowerCase();
    const dedupeKey = `${entryName}::${candidateName}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    candidates.push(candidate);
  };

  lookup.byExactName.forEach(group => group.forEach(addCandidate));
  lookup.byAlias.forEach(group => group.forEach(addCandidate));
  return candidates;
}

function scoreFuzzyCandidate(ingredientName, candidate) {
  const ingredientNorm = normalizeIngredientForSimilarity(ingredientName);
  const candidateNorm = normalizeIngredientForSimilarity(candidate.name);
  if (!ingredientNorm || !candidateNorm) return 0;

  let lexicalScore = compareTwoStrings(ingredientNorm, candidateNorm);
  if (ingredientNorm.includes(candidateNorm) || candidateNorm.includes(ingredientNorm)) {
    lexicalScore = Math.max(lexicalScore, 0.76);
  }

  const tokenOverlap = computeTokenOverlapScore(ingredientName, candidate.name);
  lexicalScore = Math.max(lexicalScore, tokenOverlap * 0.9);

  const ingredientSignals = detectSourceSignals(ingredientName);
  const candidateSignals = getEntrySourceSignals(candidate.entry, candidate.name);
  const sourceAlignment = computeSourceAlignmentScore(ingredientSignals, candidateSignals);

  return lexicalScore + sourceAlignment;
}

function findBestFuzzyDatabaseMatch(ingredientName, lookup) {
  const candidates = flattenLookupCandidates(lookup);
  if (!candidates.length) return null;

  const scored = candidates
    .map(candidate => ({
      candidate,
      score: scoreFuzzyCandidate(ingredientName, candidate),
      status: getRuleBasedStatus(candidate.entry, ingredientName)
    }))
    .filter(item => item.score >= 0.72)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;

  const best = scored[0];
  const second = scored[1];
  if (second && Math.abs(best.score - second.score) <= 0.04 && best.status !== second.status) {
    return {
      ambiguous: true,
      best,
      second
    };
  }

  return {
    ambiguous: false,
    best
  };
}

function classifyFromDatabase(ingredientName) {
  const lookup = buildIngredientLookup();
  const original = String(ingredientName || '');
  const key = normalizeLookupKey(original);
  const eMatch = key.match(/\be\d{3,4}[a-z]?\b/i);

  const exactCandidates = lookup.byExactName.get(key) || [];
  if (exactCandidates.length) {
    return resolveCandidatesDeterministically(exactCandidates, ingredientName, 'exact');
  }

  const aliasCandidates = lookup.byAlias.get(key) || [];
  if (aliasCandidates.length) {
    return resolveCandidatesDeterministically(aliasCandidates, ingredientName, 'alias');
  }

  if (eMatch) {
    const eCode = eMatch[0].toLowerCase();
    const eCandidates = lookup.byECode.get(eCode) || [];
    if (eCandidates.length) {
      return resolveCandidatesDeterministically(eCandidates, ingredientName, 'e-number');
    }

    const fuzzyECodeFallback = findBestFuzzyDatabaseMatch(ingredientName, lookup);
    if (fuzzyECodeFallback && !fuzzyECodeFallback.ambiguous) {
      return resolveCandidatesDeterministically([fuzzyECodeFallback.best.candidate], ingredientName, 'fuzzy');
    }

    if (fuzzyECodeFallback && fuzzyECodeFallback.ambiguous) {
      return {
        status: 'MUSHBOOH',
        reason: `Ingredient is ambiguous between ${fuzzyECodeFallback.best.candidate.name} and ${fuzzyECodeFallback.second.candidate.name}; conservative ruling is MUSHBOOH.`,
        confidence_score: 0.64,
        matched_name: `${fuzzyECodeFallback.best.candidate.name} / ${fuzzyECodeFallback.second.candidate.name}`,
        category: fuzzyECodeFallback.best.candidate.entry.category
      };
    }

    return {
      status: 'MUSHBOOH',
      reason: `E-number ${eCode.toUpperCase()} is not found in verified database; conservative ruling is MUSHBOOH.`,
      confidence_score: 0.5
    };
  }

  const fuzzyFallback = findBestFuzzyDatabaseMatch(ingredientName, lookup);
  if (fuzzyFallback && !fuzzyFallback.ambiguous) {
    return resolveCandidatesDeterministically([fuzzyFallback.best.candidate], ingredientName, 'fuzzy');
  }

  if (fuzzyFallback && fuzzyFallback.ambiguous) {
    return {
      status: 'MUSHBOOH',
      reason: `Ingredient is ambiguous between ${fuzzyFallback.best.candidate.name} and ${fuzzyFallback.second.candidate.name}; conservative ruling is MUSHBOOH.`,
      confidence_score: 0.64,
      matched_name: `${fuzzyFallback.best.candidate.name} / ${fuzzyFallback.second.candidate.name}`,
      category: fuzzyFallback.best.candidate.entry.category
    };
  }

  return {
    status: 'MUSHBOOH',
    reason: 'Ingredient not found in verified database; conservative ruling is MUSHBOOH.',
    confidence_score: 0.45
  };
}

function getOverallConfidenceLabel(status, ingredientsAnalysis) {
  if (!ingredientsAnalysis.length) return 'LOW';
  if (ingredientsAnalysis.some(item => item.confidence_score < 0.6)) return 'LOW';
  if (status === 'MUSHBOOH') return 'MEDIUM';
  return 'HIGH';
}

function getFinalDeterministicStatus(ingredientsAnalysis) {
  if (ingredientsAnalysis.some(item => item.status === 'HARAM')) return 'HARAM';
  if (ingredientsAnalysis.some(item => item.status === 'MUSHBOOH')) return 'MUSHBOOH';
  return 'HALAL';
}

function buildSummaryReason(status, ingredientsAnalysis) {
  if (status === 'HARAM') {
    const haramCount = ingredientsAnalysis.filter(item => item.status === 'HARAM').length;
    return `${haramCount} ingredient(s) are classified as HARAM; final result is HARAM.`;
  }
  if (status === 'MUSHBOOH') {
    const mushboohCount = ingredientsAnalysis.filter(item => item.status === 'MUSHBOOH').length;
    return `No HARAM ingredient found, but ${mushboohCount} ingredient(s) are MUSHBOOH; final result is MUSHBOOH.`;
  }
  return 'All identified ingredients are clearly HALAL in verified database; final result is HALAL.';
}

function analyzeIngredientsDeterministic(ingredientsList) {
  const seen = new Set();
  const ingredientsAnalysis = [];
  const ingredients = splitInputIngredients(ingredientsList);

  ingredients.forEach((ingredient) => {
    const dedupeKey = normalizeLookupKey(ingredient);
    if (!dedupeKey || seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    const hardRule = classifyFromHardRules(ingredient);
    const result = hardRule || classifyFromDatabase(ingredient);

    ingredientsAnalysis.push({
      name: ingredient,
      status: result.status,
      reason: result.reason,
      confidence_score: result.confidence_score,
      matched_name: result.matched_name || null,
      category: result.category || null
    });
  });

  const status = ingredientsAnalysis.length ? getFinalDeterministicStatus(ingredientsAnalysis) : 'MUSHBOOH';
  const summary_reason = ingredientsAnalysis.length
    ? buildSummaryReason(status, ingredientsAnalysis)
    : 'No valid ingredients could be parsed; conservative ruling is MUSHBOOH.';
  const confidence = getOverallConfidenceLabel(status, ingredientsAnalysis);

  return {
    status,
    confidence,
    ingredients_analysis: ingredientsAnalysis,
    summary_reason,
    reasoning: summary_reason
  };
}

function toLegacyAnalysis(strictAnalysis) {
  const analysis = {
    halal: [],
    haram: [],
    mashbooh: [],
    unknown: [],
    overallStatus: String(strictAnalysis.status || 'MUSHBOOH').toLowerCase()
  };

  strictAnalysis.ingredients_analysis.forEach((item) => {
    const payload = {
      ingredient: item.name,
      status: item.status,
      matched_name: item.matched_name || undefined,
      category: item.category || undefined,
      explanation: `${item.reason} Confidence: ${(item.confidence_score * 100).toFixed(1)}%.`
    };

    if (item.status === 'HALAL') analysis.halal.push(payload);
    else if (item.status === 'HARAM') analysis.haram.push(payload);
    else analysis.mashbooh.push(payload);
  });

  return analysis;
}

function authenticateJWT(requireAdmin = false) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token missing' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      if (requireAdmin && !user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      req.user = user;
      next();
    });
  };
}

function parseResultData(value) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (err) {
      return value;
    }
  }
  return value;
}

function normalizeSavedResult(row) {
  return {
    _id: row.id,
    id: row.id,
    user: row.user_name || row.user_email ? { id: row.user_id, name: row.user_name, email: row.user_email } : row.user_id,
    user_id: row.user_id,
    result_data: parseResultData(row.result_data),
    createdAt: row.created_at,
    created_at: row.created_at,
    __v: 0
  };
}

function normalizeReport(row) {
  return {
    _id: row.id,
    id: row.id,
    user: row.user_id,
    user_id: row.user_id,
    user_name: row.user_name || null,
    user_email: row.user_email || null,
    item_name: row.item_name,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
    created_at: row.created_at,
    admin_note: row.admin_note,
    __v: 0
  };
}

function sanitizeUser(user) {
  return {
    id: user.id,
    _id: user.id,
    name: user.name,
    email: user.email,
    is_admin: user.is_admin
  };
}

function isMissingTableError(err) {
  return err && err.code === '42P01';
}

function isDbConnectionError(err) {
  return !!(err && (
    err.code === 'ECONNREFUSED' ||
    err.code === 'ENETUNREACH' ||
    err.code === 'ENOTFOUND' ||
    err.code === '57P01' ||
    err.code === '08001' ||
    err.code === '08006'
  ));
}

function dbErrorResponse(operation, err) {
  if (isMissingTableError(err)) {
    return {
      status: 503,
      body: {
        error: `${operation} failed: database schema is not initialized on Render. Run backend migration (npm run db:push) against the Render DATABASE_URL.`
      }
    };
  }

  if (isDbConnectionError(err)) {
    return {
      status: 503,
      body: {
        error: `${operation} failed: database connection error. Check Render DATABASE_URL and DB allowlist/network settings.`
      }
    };
  }

  return {
    status: 500,
    body: { error: `${operation} failed due to an internal server error.` }
  };
}

app.post('/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const inserted = await db.query(
      'INSERT INTO users (name, email, password, is_admin) VALUES ($1, $2, $3, false) RETURNING id, name, email, is_admin',
      [name, email, hashed]
    );

    res.json({ success: true, user: sanitizeUser(inserted.rows[0]) });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to register user.' });
  }
});

app.get('/api/saved-results', authenticateJWT(), async (req, res) => {
  try {
    const userId = req.user.id;
    let rows;

    if (req.user.is_admin) {
      const result = await db.query(
        `SELECT sr.id, sr.user_id, sr.result_data, sr.created_at, u.name AS user_name, u.email AS user_email
         FROM saved_results sr
         LEFT JOIN users u ON u.id = sr.user_id
         ORDER BY sr.created_at DESC`
      );
      rows = result.rows;
    } else {
      const result = await db.query(
        `SELECT sr.id, sr.user_id, sr.result_data, sr.created_at
         FROM saved_results sr
         WHERE sr.user_id = $1
         ORDER BY sr.created_at DESC`,
        [userId]
      );
      rows = result.rows;
    }

    const results = rows.map(normalizeSavedResult);
    res.json({ saved_results: results });
  } catch (error) {
    console.error('Error fetching saved results:', error);
    res.status(500).json({ error: 'Failed to fetch saved results' });
  }
});

app.get('/api/user/reports', authenticateJWT(), async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT id, user_id, item_name, reason, status, admin_note, created_at
       FROM reports
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const reports = result.rows.map(normalizeReport);
    res.json({ reports });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ error: 'Failed to fetch user reports' });
  }
});

app.post('/auth/signin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const userResult = await db.query(
      'SELECT id, name, email, password, is_admin FROM users WHERE email = $1 LIMIT 1',
      [email]
    );

    if (userResult.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = userResult.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      is_admin: user.is_admin
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ success: true, token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Signin error:', err);
    const mapped = dbErrorResponse('Login', err);
    res.status(mapped.status).json(mapped.body);
  }
});

app.post(['/api/testimonials', '/testimonials'], async (req, res) => {
  const { name, rating, testimony } = req.body;
  if (!name || !rating || !testimony) {
    return res.status(400).json({ error: 'Name, rating, and testimony are required.' });
  }

  try {
    const result = await db.query(
      'INSERT INTO testimonials (name, rating, testimony) VALUES ($1, $2, $3) RETURNING id',
      [name, rating, testimony]
    );

    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Create testimonial error:', err);
    const mapped = dbErrorResponse('Saving testimonial', err);
    res.status(mapped.status).json(mapped.body);
  }
});

app.get(['/api/testimonials', '/testimonials'], async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM testimonials ORDER BY created_at DESC');

    const testimonials = result.rows.map(row => ({ ...row, _id: row.id }));
    res.json(testimonials);
  } catch (err) {
    console.error('Fetch testimonials error:', err);
    if (isMissingTableError(err)) {
      // Keep homepage usable when testimonials table has not been migrated yet.
      return res.json([]);
    }
    const mapped = dbErrorResponse('Fetching testimonials', err);
    res.status(mapped.status).json(mapped.body);
  }
});

app.post('/analyze-ingredients', (req, res) => {
  try {
    const { ingredients } = req.body;

    if (!ingredients || typeof ingredients !== 'string') {
      return res.status(400).json({ error: 'Ingredients list is required' });
    }

    const strictAnalysis = analyzeIngredientsDeterministic(ingredients);
    const analysis = toLegacyAnalysis(strictAnalysis);

    res.json({
      success: true,
      status: strictAnalysis.status,
      confidence: strictAnalysis.confidence,
      ingredients_analysis: strictAnalysis.ingredients_analysis.map(item => ({
        name: item.name,
        status: item.status,
        reason: item.reason
      })),
      summary_reason: strictAnalysis.summary_reason,
      reasoning: strictAnalysis.reasoning,
      analysis
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Internal server error during analysis' });
  }
});

app.post('/extract-ingredients-ai', async (req, res) => {
  try {
    const { ocrText } = req.body;
    if (!ocrText || typeof ocrText !== 'string') {
      return res.status(400).json({ error: 'OCR text is required' });
    }

    const normalizedOcrText = ocrText.trim();
    if (!normalizedOcrText) {
      return res.status(400).json({ error: 'OCR text is required' });
    }

    if (!isLikelyIngredientOcrText(normalizedOcrText)) {
      return res.json(noIngredientDetectedPayload());
    }

    const prompt = `Extract and correct the list of food ingredients from the following text. Return a comma-separated list, with each ingredient clearly separated. Ignore non-ingredient text (e.g., contains milk, gluten-free, and, or, with, from, of, the, a, an, etc.). If an ingredient contains parentheses, include the content but remove the parentheses symbols from the output. Remove all symbols except dash. Text: ${normalizedOcrText}`;

    const response = await cohere.chat({
      model: 'command-r-08-2024',
      message: prompt,
      maxTokens: 500,
      temperature: 0.2
    });

    let cleaned = (response.text || '').trim();
    cleaned = cleaned
      .replace(/[()]/g, '')
      .replace(/(^|[\s,/\\-])((and|or|with|from|of|the|a|an|may contain|contains|produced|allergen|products that|and\/or|and-or|or\/and|andor|orand))[\s,/\\-]+/gi, '$1')
      .replace(/([\s,/\\-])((and|or|with|from|of|the|a|an|may contain|contains|produced|allergen|products that|and\/or|and-or|or\/and|andor|orand))$/gi, '')
      .replace(/\b(and|or|with|from|of|the|a|an|may contain|contains|produced|allergen|products that|and\/or|and-or|or\/and|andor|orand)\b/gi, '')
      .replace(/[^a-zA-Z0-9,\-\s]/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/,+/g, ',')
      .replace(/\-+/g, '-')
      .split(',')
      .map(i => i.trim().replace(/^[-\s]+|[-\s]+$/g, ''))
      .filter(i => i.length > 0)
      .join(', ');

    cleaned = groundAiIngredientListToOcr(cleaned, normalizedOcrText);

    if (!isPlausibleIngredientListText(cleaned)) {
      return res.json(noIngredientDetectedPayload());
    }

    res.json({ success: true, ingredients: cleaned });
  } catch (error) {
    console.error('AI extraction error:', error);
    res.status(500).json({ error: 'Failed to extract ingredients' });
  }
});

app.post('/submit-report', authenticateJWT(), async (req, res) => {
  const user = req.user;
  const { item_name, reason } = req.body;

  if (!item_name || !reason) {
    return res.status(400).json({ error: 'Item name and reason are required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO reports (user_id, item_name, reason, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [user.id, item_name, reason, 'pending']
    );

    res.json({ message: 'Report submitted successfully', report_id: result.rows[0].id });
  } catch (err) {
    console.error('Submit report error:', err);
    res.status(400).json({ error: err.message });
  }
});

app.get('/user-reports', authenticateJWT(), async (req, res) => {
  const user = req.user;

  try {
    const result = await db.query(
      `SELECT id, user_id, item_name, reason, status, admin_note, created_at
       FROM reports
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user.id]
    );

    const reports = result.rows.map(normalizeReport);
    res.json({ reports });
  } catch (err) {
    console.error('User reports error:', err);
    res.status(400).json({ error: err.message });
  }
});

app.get('/admin/reports', authenticateJWT(true), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.id, r.user_id, r.item_name, r.reason, r.status, r.admin_note, r.created_at,
              u.name AS user_name, u.email AS user_email
       FROM reports r
       LEFT JOIN users u ON u.id = r.user_id
       ORDER BY r.created_at DESC`
    );

    const reports = result.rows.map(normalizeReport);
    res.json({ reports });
  } catch (err) {
    console.error('Admin reports error:', err);
    res.status(400).json({ error: err.message });
  }
});

app.put('/admin/reports/:id', authenticateJWT(true), async (req, res) => {
  const { id } = req.params;
  const { status, admin_note } = req.body;

  if (!status || !['pending', 'solved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Valid status required' });
  }

  try {
    // Fetch current report to check its status
    const currentReportResult = await db.query(
      'SELECT status FROM reports WHERE id = $1 LIMIT 1',
      [id]
    );

    if (currentReportResult.rowCount === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const currentStatus = currentReportResult.rows[0].status;

    // Prevent status changes for finalized (non-pending) reports
    if (currentStatus !== 'pending' && status !== currentStatus) {
      return res.status(400).json({ 
        error: 'Cannot change status of a finalized report. Reports with status "solved" or "rejected" are permanent.' 
      });
    }

    // Update with the current or new status
    const updateResult = await db.query(
      'UPDATE reports SET status = $1, admin_note = $2 WHERE id = $3 RETURNING id',
      [status, admin_note || null, id]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report status updated successfully' });
  } catch (err) {
    console.error('Update report error:', err);
    res.status(400).json({ error: err.message });
  }
});

app.post('/save-results', authenticateJWT(), async (req, res) => {
  const user = req.user;
  const { result_data } = req.body;

  if (!result_data) {
    return res.status(400).json({ error: 'Result data is required' });
  }

  try {
    const normalizedData = typeof result_data === 'string' ? parseResultData(result_data) : result_data;
    const result = await db.query(
      'INSERT INTO saved_results (user_id, result_data) VALUES ($1, $2::jsonb) RETURNING id',
      [user.id, JSON.stringify(normalizedData)]
    );

    res.json({ message: 'Results saved successfully', saved_id: result.rows[0].id });
  } catch (err) {
    console.error('Save result error:', err);
    res.status(400).json({ error: err.message });
  }
});

app.get('/user-saved-results', authenticateJWT(), async (req, res) => {
  const user = req.user;

  try {
    const result = await db.query(
      `SELECT id, user_id, result_data, created_at
       FROM saved_results
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user.id]
    );

    const results = result.rows.map(normalizeSavedResult);
    res.json({ saved_results: results });
  } catch (err) {
    console.error('User saved results error:', err);
    res.status(400).json({ error: err.message });
  }
});

app.delete('/saved-results/:id', authenticateJWT(), async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM saved_results WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Saved result not found' });
    }

    res.json({ message: 'Saved result deleted successfully' });
  } catch (err) {
    console.error('Delete saved result error:', err);
    res.status(400).json({ error: err.message });
  }
});

app.delete('/reports/:id', authenticateJWT(), async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  try {
    const reportResult = await db.query(
      'SELECT id, user_id, status FROM reports WHERE id = $1 LIMIT 1',
      [id]
    );

    if (reportResult.rowCount === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reportResult.rows[0];

    if (user.is_admin) {
      if (report.status === 'pending') {
        return res.status(400).json({ error: 'Admin must review the report before deleting.' });
      }
      await db.query('DELETE FROM reports WHERE id = $1', [id]);
      return res.json({ message: 'Report deleted by admin.' });
    }

    if (report.user_id !== user.id) {
      return res.status(403).json({ error: 'You can only delete your own report.' });
    }

    await db.query('DELETE FROM reports WHERE id = $1 AND user_id = $2', [id, user.id]);
    return res.json({ message: 'Report deleted.' });
  } catch (err) {
    console.error('Delete report error:', err);
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, async () => {
  try {
    await db.query('SELECT 1');
    console.log(`Server is running on port ${PORT}`);
    console.log(`PostgreSQL connection configured (force IPv4: ${forcePgIpv4 ? 'enabled' : 'disabled'}).`);
  } catch (err) {
    if (err.code === 'ENETUNREACH' && !process.env.PGHOSTADDR) {
      const fallbackHost = await resolveDatabaseIpv4Host();

      if (fallbackHost) {
        try {
          await switchDbPoolHost(fallbackHost);
          await db.query('SELECT 1');
          console.log(`Server is running on port ${PORT}`);
          console.log(`PostgreSQL connection configured via startup IPv4 host fallback: ${fallbackHost}`);
          return;
        } catch (retryErr) {
          console.error('PostgreSQL startup fallback retry failed:', {
            message: retryErr.message,
            code: retryErr.code,
            address: retryErr.address,
            port: retryErr.port,
            attemptedHost: fallbackHost
          });
        }
      }
    }

    console.error('Failed to verify PostgreSQL connection on startup:', {
      message: err.message,
      code: err.code,
      address: err.address,
      port: err.port
    });
  }
});
