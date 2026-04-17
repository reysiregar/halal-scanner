require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const stringSimilarity = require('string-similarity');
const { CohereClient } = require('cohere-ai');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3000;
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
const db = new Pool({
  connectionString: DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false
});

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://ai-halal-scanner.vercel.app',
  'https://mid-andreana-veez-37004fdb.koyeb.app'
];

const devOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5500'
];

const allAllowedOrigins = [...new Set([...allowedOrigins, ...devOrigins])];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const isAllowed = allAllowedOrigins.some(allowedOrigin => {
      return origin === allowedOrigin || origin.startsWith(allowedOrigin.replace('*', ''));
    });

    if (!isAllowed) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}.`;
      console.warn(msg);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id', 'user-email', 'user-name'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Halal Scanner API',
    status: 'operational',
    documentation: 'https://github.com/reysiregar/halal-scanner',
    version: '1.0.0'
  });
});

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
    .replace(/\b(powder|extract|concentrate|solids|flavor|flavour|creamer|oil|syrup|juice|color|colour|seasoning|starch|milk|sugar|water|salt|cream|coffee|non\-dairy|dairy|artificial|natural|modified|autolyzed|caseinate|acid|hydroxide|disodium|monosodium|calcium|sodium|tomato|onion|brown|corn|vegetable|yeast|maltodextrin|citric|spices|solids|solids|solids|solids)\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/s\b/g, '')
    .trim()
    .toLowerCase();
}

function isSectionHeader(str) {
  return /^[A-Z\s]+:?$/.test(str.trim()) || /^(noodles|seasoning|powder|oil|sauce|shallot|contains|produced|products|that|peanuts|crustacean|egg|dairy|fish)$/i.test(str.trim());
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
        const score = stringSimilarity.compareTwoStrings(cleaned, dbCleaned);
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

    let categoryFallback = null;
    let categoryDbEntry = null;
    if (!bestDbEntry && !partialDbEntry) {
      const categories = [
        'meat', 'animal', 'dairy', 'sweetener', 'flavor', 'oil', 'seafood', 'enzyme', 'beverage', 'seasoning', 'condiment', 'gelling', 'humectant', 'color', 'glazing', 'dough', 'fats', 'additive', 'acid', 'preservative', 'emulsifier', 'thickener', 'stabilizer', 'antioxidant', 'vitamin', 'mineral', 'protein', 'carbohydrate', 'fiber', 'fruit', 'vegetable', 'grain', 'nut', 'seed', 'spice', 'herb', 'extract', 'powder', 'concentrate', 'starch', 'gum', 'lecithin', 'yeast', 'casein', 'pectin', 'agar', 'xanthan', 'pectin', 'sorbitol', 'mannitol', 'aspartame', 'sucralose', 'saccharin', 'maltodextrin', 'fructose', 'glucose', 'honey', 'molasses', 'syrup', 'vinegar', 'mustard', 'cocoa', 'chocolate', 'flavour', 'colour', 'juice', 'concentrate', 'fiber', 'fibre', 'seed', 'nut', 'sesame', 'sunflower', 'canola', 'rapeseed', 'palm', 'coconut', 'olive', 'soybean', 'peanut', 'almond', 'cashew', 'hazelnut', 'walnut', 'pistachio', 'macadamia', 'brazil', 'pecan', 'pine', 'chestnut', 'date', 'raisin', 'apricot', 'fig', 'prune', 'plum', 'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'berry', 'strawberry', 'blueberry', 'raspberry', 'blackberry', 'cranberry', 'melon', 'watermelon', 'cantaloupe', 'honeydew', 'mango', 'papaya', 'pineapple', 'kiwi', 'guava', 'passion', 'dragon', 'lychee', 'longan', 'rambutan', 'durian', 'jackfruit', 'soursop', 'starfruit', 'carambola', 'tamarind', 'avocado', 'olive', 'artichoke', 'asparagus', 'beet', 'broccoli', 'brussels', 'cabbage', 'carrot', 'cauliflower', 'celery', 'chard', 'chicory', 'collard', 'corn', 'cress', 'cucumber', 'dandelion', 'edamame', 'eggplant', 'endive', 'fennel', 'garlic', 'ginger', 'horseradish', 'jicama', 'kale', 'kohlrabi', 'leek', 'lettuce', 'mushroom', 'okra', 'onion', 'parsnip', 'pea', 'pepper', 'potato', 'pumpkin', 'radish', 'rutabaga', 'shallot', 'spinach', 'squash', 'sweet', 'tomato', 'turnip', 'yam', 'zucchini'
      ];
      for (const dbEntry of haramIngredientsArr) {
        if (dbEntry.category && categories.some(cat => dbEntry.category.toLowerCase().includes(cat))) {
          categoryFallback = dbEntry.item_name;
          categoryDbEntry = dbEntry;
          break;
        }
      }
    }

    if (bestScore >= 0.5 && bestDbEntry) {
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
    } else if (categoryDbEntry) {
      const entry = {
        ingredient: ingredient,
        matched_name: categoryFallback,
        status: categoryDbEntry.status,
        category: categoryDbEntry.category
      };
      if (/haram/i.test(categoryDbEntry.status)) {
        results.haram.push(entry);
      } else if (/mushbooh|mashbooh/i.test(categoryDbEntry.status)) {
        results.mashbooh.push(entry);
      } else if (/halal/i.test(categoryDbEntry.status)) {
        results.halal.push(entry);
      } else {
        results.unknown.push(entry);
      }
    } else {
      let explanation = 'Not found in database';
      if (bestScore > 0.3 && bestDbEntry) {
        explanation += `. Did you mean: ${bestMatch}?`;
      }
      results.unknown.push({ ingredient: ingredient, explanation: explanation });
    }
  });

  if (results.haram.length > 0) {
    results.overallStatus = 'haram';
  } else if (results.mashbooh.length > 0) {
    results.overallStatus = 'mashbooh';
  } else if (results.unknown.length > 0) {
    results.overallStatus = 'unknown';
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
    res.status(500).json({ error: 'Failed to login.' });
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
    res.status(500).json({ error: 'Failed to save testimonial.' });
  }
});

app.get('/api/testimonials', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM testimonials ORDER BY created_at DESC');
    const testimonials = result.rows.map(row => ({ ...row, _id: row.id }));
    res.json(testimonials);
  } catch (err) {
    console.error('Fetch testimonials error:', err);
    res.status(500).json({ error: 'Failed to fetch testimonials.' });
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

    const response = await cohere.generate({
      model: 'command',
      prompt: prompt,
      max_tokens: 100,
      temperature: 0.2,
      stop_sequences: ['\n']
    });

    let cleaned = response.generations[0].text.trim();
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
    console.log('PostgreSQL connection configured.');
  } catch (err) {
    console.error('Failed to verify PostgreSQL connection on startup:', err.message);
  }
});
