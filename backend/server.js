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

function analyzeIngredients(ingredientsList) {
  const results = {
    halal: [],
    haram: [],
    mashbooh: [],
    unknown: [],
    overallStatus: 'halal'
  };
  const seen = new Set();

  const ingredients = ingredientsList
    .split(/[,;\.\n\r]/)
    .map(ingredient => ingredient.trim())
    .filter(ingredient => ingredient.length > 0 && !isSectionHeader(ingredient));

  ingredients.forEach(ingredient => {
    const cleaned = strongNormalize(ingredient);
    if (!cleaned || seen.has(cleaned)) return;
    seen.add(cleaned);

    let bestScore = 0;
    let bestMatch = null;
    let bestDbEntry = null;
    let partialMatch = null;
    let partialDbEntry = null;

    haramIngredientsArr.forEach(dbEntry => {
      const dbNames = [dbEntry.item_name, ...(dbEntry.aliases || [])];
      dbNames.forEach(name => {
        const dbCleaned = strongNormalize(name);
        const score = compareTwoStrings(cleaned, dbCleaned);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = name;
          bestDbEntry = dbEntry;
        }
        if ((dbCleaned && cleaned && (dbCleaned.includes(cleaned) || cleaned.includes(dbCleaned))) && (!partialMatch || dbCleaned.length < partialMatch.length)) {
          partialMatch = name;
          partialDbEntry = dbEntry;
        }
      });
    });

    // Substring (partial) matches are usually more reliable than mid-range fuzzy matches.
    // Only let a fuzzy match outrank a substring match when it is very confident.
    if (partialDbEntry && bestScore < 0.7) {
      const entry = {
        ingredient: ingredient,
        matched_name: partialMatch,
        status: partialDbEntry.status,
        category: partialDbEntry.category
      };
      if (/haram/i.test(partialDbEntry.status)) {
        results.haram.push(entry);
      } else if (/mushbooh|mashbooh/i.test(partialDbEntry.status)) {
        results.mashbooh.push(entry);
      } else if (/halal/i.test(partialDbEntry.status)) {
        results.halal.push(entry);
      } else {
        results.unknown.push(entry);
      }
      return;
    }

    if (bestScore >= 0.4 && bestDbEntry) {
      const entry = {
        ingredient: ingredient,
        matched_name: bestMatch,
        status: bestDbEntry.status,
        category: bestDbEntry.category
      };
      if (/haram/i.test(bestDbEntry.status)) {
        results.haram.push(entry);
      } else if (/mushbooh|mashbooh/i.test(bestDbEntry.status)) {
        results.mashbooh.push(entry);
      } else if (/halal/i.test(bestDbEntry.status)) {
        results.halal.push(entry);
      } else {
        results.unknown.push(entry);
      }
    } else if (partialDbEntry) {
      const entry = {
        ingredient: ingredient,
        matched_name: partialMatch,
        status: partialDbEntry.status,
        category: partialDbEntry.category
      };
      if (/haram/i.test(partialDbEntry.status)) {
        results.haram.push(entry);
      } else if (/mushbooh|mashbooh/i.test(partialDbEntry.status)) {
        results.mashbooh.push(entry);
      } else if (/halal/i.test(partialDbEntry.status)) {
        results.halal.push(entry);
      } else {
        results.unknown.push(entry);
      }
    } else if (bestScore >= 0.3 && bestDbEntry && /haram|mushbooh|mashbooh/i.test(bestDbEntry.status)) {
      // Lower-confidence match to a Haram/Mashbooh ingredient — flag as Mashbooh (caution) rather than swallow it as Unknown.
      results.mashbooh.push({
        ingredient: ingredient,
        matched_name: bestMatch,
        status: 'Mashbooh',
        category: bestDbEntry.category,
        explanation: `Possible match for ${bestMatch} (${bestDbEntry.status}) — verify before consuming.`
      });
    } else {
      let explanation = 'Not found in database';
      if (bestScore > 0.3 && bestDbEntry) {
        explanation += `. Did you mean: ${bestMatch}?`;
      }
      results.unknown.push({ ingredient: ingredient, explanation: explanation });
    }
  });

  const totalClassified = results.halal.length + results.haram.length + results.mashbooh.length + results.unknown.length;

  if (totalClassified === 0) {
    // No ingredients could be parsed at all — refuse to claim halal.
    results.overallStatus = 'unknown';
  } else if (results.haram.length > 0) {
    results.overallStatus = 'haram';
  } else if (results.mashbooh.length > 0) {
    results.overallStatus = 'mashbooh';
  } else if (results.unknown.length > 0 && results.halal.length === 0) {
    results.overallStatus = 'unknown';
  } else if (results.unknown.length > 0) {
    // Mostly recognized but some unknowns — be cautious.
    results.overallStatus = 'mashbooh';
  }

  return results;
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

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Signin error:', err);
    const mapped = dbErrorResponse('Login', err);
    res.status(mapped.status).json(mapped.body);
  }
});

app.post('/api/testimonials', async (req, res) => {
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

app.get('/api/testimonials', async (req, res) => {
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

    const analysis = analyzeIngredients(ingredients);
    res.json({ success: true, analysis: analysis });
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

    const prompt = `Extract and correct the list of food ingredients from the following text. Return a comma-separated list, with each ingredient clearly separated. Ignore non-ingredient text (e.g., contains milk, gluten-free, and, or, with, from, of, the, a, an, etc.). If an ingredient contains parentheses, include the content but remove the parentheses symbols from the output. Remove all symbols except dash. Text: ${ocrText}`;

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
