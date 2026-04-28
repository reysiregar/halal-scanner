const fs = require('fs');
const path = require('path');

function normalizeLookupKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9\s\-/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateOcrVariants(text) {
  if (!text || typeof text !== 'string') return [];
  const normalized = text.toLowerCase().trim();
  const variants = new Set([normalized]);
  variants.add(normalized.replace(/0/g, 'o'));
  variants.add(normalized.replace(/1/g, 'l'));
  variants.add(normalized.replace(/5/g, 's'));
  variants.add(normalized.replace(/4/g, 'a'));
  variants.add(normalized.replace(/i/g, 'l'));
  variants.add(normalized.replace(/l/g, 'i'));
  variants.add(normalized.replace(/rn/g, 'm'));
  variants.add(normalized.replace(/vv/g, 'w'));
  variants.add(normalized.replace(/cl/g, 'd'));
  Array.from(variants).forEach(v => {
    variants.add(v.replace(/1/g, 'l'));
    variants.add(v.replace(/i/g, 'l'));
    variants.add(v.replace(/0/g, 'o'));
  });
  return Array.from(variants);
}

const dataPath = path.join(__dirname, '..', 'backend', 'ingredients.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const lookup = { byExactName: new Map(), byAlias: new Map() };

data.ingredients.forEach(entry => {
  const exactNames = [entry.item_name, entry.name]
    .map(n => String(n || '').trim())
    .filter(Boolean);
  exactNames.forEach(name => {
    const key = normalizeLookupKey(name);
    if (!key) return;
    if (!lookup.byExactName.has(key)) lookup.byExactName.set(key, []);
    lookup.byExactName.get(key).push({ entry, name, key });
  });
  (entry.aliases || []).forEach(alias => {
    const name = String(alias || '').trim();
    const key = normalizeLookupKey(name);
    if (!key) return;
    if (!lookup.byAlias.has(key)) lookup.byAlias.set(key, []);
    lookup.byAlias.get(key).push({ entry, name, key });
  });
});

function resolveByOcr(ing) {
  const variants = generateOcrVariants(ing);
  for (const v of variants) {
    const key = normalizeLookupKey(v);
    if (!key) continue;
    const exact = lookup.byExactName.get(key) || [];
    if (exact.length) return { match: 'exact', name: exact[0].entry.item_name };
    const alias = lookup.byAlias.get(key) || [];
    if (alias.length) return { match: 'alias', name: alias[0].entry.item_name };
  }
  return null;
}

const tests = ['sait', 'sa1t', '5alt', 'sai1', 'salt'];
for (const t of tests) {
  const r = resolveByOcr(t);
  console.log(t, '->', r ? `${r.match} -> ${r.name}` : 'no match');
}
