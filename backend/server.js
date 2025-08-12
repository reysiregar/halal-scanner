require('dotenv').config()
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const SavedResult = require('./models/SavedResult');
const Testimonial = require('./models/Testimonial');
const Report = require('./models/Report');
const fs = require('fs');
const path = require('path');
const stringSimilarity = require('string-similarity');
const { CohereClient } = require('cohere-ai');
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY
});
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

if (!JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set. JWT operations may fail.');
}
if (!process.env.COHERE_API_KEY) {
  console.warn('Warning: COHERE_API_KEY is not set. AI extraction endpoint will not work.');
}

const app = express();

// Configure CORS with allowed origins
const allowedOrigins = [
  'http://localhost:5173', // Local development
  'https://ai-halal-scanner.vercel.app', // Production frontend
  'https://mid-andreana-veez-37004fdb.koyeb.app' // Backend domain for direct frontend access
];

// Add development origins for common ports
const devOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8080'
];

// Combine all allowed origins
const allAllowedOrigins = [...new Set([...allowedOrigins, ...devOrigins])];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list or is a subdomain of an allowed origin
    const isAllowed = allAllowedOrigins.some(allowedOrigin => {
      return origin === allowedOrigin || 
             origin.startsWith(allowedOrigin.replace('*', ''));
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
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Halal Scanner API',
    status: 'operational',
    documentation: 'https://github.com/reysiregar/halal-scanner',
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});


// Load haram ingredients database (new structure)
let haramIngredientsArr = [];
try {
    const haramData = fs.readFileSync(path.join(__dirname, './ingredients.json'), 'utf8');
    const parsed = JSON.parse(haramData);
    haramIngredientsArr = parsed.ingredients || [];
} catch (error) {
    console.error('Error loading haram ingredients:', error);
}

// Enhanced normalization: remove common words, plurals, and extra spaces
function strongNormalize(str) {
    return str
        // Remove parentheses symbols but keep the content inside
        .replace(/[()]/g, '')
        .replace(/\d+[.,]?\d*\s*%/g, '') // remove percentages like 14,5% or 14.5%
        .replace(/\d+[.,]?\d*\s*g\b/gi, '') // remove grams like 20g, 5g
        .replace(/\d+[%]?/g, '') // remove numbers and percentages
        .replace(/[^a-zA-Z\s]/g, '')
        .replace(/\b(powder|extract|concentrate|solids|flavor|flavour|creamer|oil|syrup|juice|color|colour|seasoning|starch|milk|sugar|water|salt|cream|coffee|non\-dairy|dairy|artificial|natural|modified|autolyzed|caseinate|acid|hydroxide|disodium|monosodium|calcium|sodium|tomato|onion|brown|corn|vegetable|yeast|maltodextrin|citric|spices|solids|solids|solids|solids)\b/gi, '')
        .replace(/\s+/g, ' ')
        .replace(/s\b/g, '') // simple plural stemming
        .trim()
        .toLowerCase();
}

// Helper: Is likely a section header
function isSectionHeader(str) {
    return /^[A-Z\s]+:?$/.test(str.trim()) || /^(noodles|seasoning|powder|oil|sauce|shallot|contains|produced|products|that|peanuts|crustacean|egg|dairy|fish)$/i.test(str.trim());
}

// Helper function to analyze ingredients (fuzzy, deduped)
function analyzeIngredients(ingredientsList) {
    const results = {
        halal: [],
        haram: [],
        mashbooh: [],
        unknown: [],
        overallStatus: 'halal'
    };
    const seen = new Set();
    // Normalize ingredients list (split by common delimiters)
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
        // 1. Fuzzy and substring match against all item_names and aliases
        haramIngredientsArr.forEach(dbEntry => {
            const dbNames = [dbEntry.item_name, ...(dbEntry.aliases || [])];
            dbNames.forEach(name => {
                const dbCleaned = strongNormalize(name);
                // Fuzzy match
                const score = stringSimilarity.compareTwoStrings(cleaned, dbCleaned);
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = name;
                    bestDbEntry = dbEntry;
                }
                // Substring/partial match
                if (
                    (dbCleaned && cleaned && (dbCleaned.includes(cleaned) || cleaned.includes(dbCleaned))) &&
                    (!partialMatch || dbCleaned.length < partialMatch.length)
                ) {
                    partialMatch = name;
                    partialDbEntry = dbEntry;
                }
            });
        });
        // 2. Category-based fallback (if ingredient contains a known category word)
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
        // 3. Decision logic
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
            results.unknown.push({
                ingredient: ingredient,
                explanation: explanation
            });
        }
    });
    // Determine overall status
    if (results.haram.length > 0) {
        results.overallStatus = 'haram';
    } else if (results.mashbooh.length > 0) {
        results.overallStatus = 'mashbooh';
    } else if (results.unknown.length > 0) {
        results.overallStatus = 'unknown';
    }
    return results;
}

// Middleware to verify JWT and optionally require admin
function authenticateJWT(requireAdmin = false) {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
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

// Connect to MongoDB
if (!MONGO_URI) {
  console.error('MongoDB connection error: MONGO_URI is not defined. Set it in your environment variables (.env).');
  process.exit(1);
}
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

// --- AUTH: Signup endpoint ---
app.post('/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    try {
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ error: 'Email already registered.' });
        }
        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashed });
        await user.save();
        // Remove password from response
        const userObj = user.toObject();
        delete userObj.password;
        res.json({ success: true, user: userObj });
    } catch (err) {
        res.status(500).json({ error: 'Failed to register user.' });
    }
});

// --- SAVED RESULTS: Get all saved results for current user ---
app.get('/api/saved-results', authenticateJWT(), async (req, res) => {
    try {
        const userId = req.user.id;
        const results = await SavedResult.find({ user: userId }).sort({ createdAt: -1 });
        res.json(results);
    } catch (error) {
        console.error('Error fetching saved results:', error);
        res.status(500).json({ error: 'Failed to fetch saved results' });
    }
});

// --- USER REPORTS: Get all reports for current user ---
app.get('/api/user/reports', authenticateJWT(), async (req, res) => {
    try {
        const userId = req.user.id;
        const reports = await Report.find({ user: userId }).sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        console.error('Error fetching user reports:', error);
        res.status(500).json({ error: 'Failed to fetch user reports' });
    }
});

// --- AUTH: Login endpoint ---
app.post('/auth/signin', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        // Build JWT payload
        const payload = {
            id: user._id,
            email: user.email,
            name: user.name,
            is_admin: user.is_admin
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
        const userObj = user.toObject();
        delete userObj.password;
        res.json({ success: true, token, user: userObj });
    } catch (err) {
        res.status(500).json({ error: 'Failed to login.' });
    }
});

// --- API: Add a testimonial ---
app.post('/api/testimonials', async (req, res) => {
        const { name, rating, testimony } = req.body;
        if (!name || !rating || !testimony) {
            return res.status(400).json({ error: 'Name, rating, and testimony are required.' });
        }
        // Save testimonial using Mongoose
        try {
            const testimonial = new Testimonial({ name, rating, testimony });
            await testimonial.save();
            res.json({ success: true, id: testimonial._id });
        } catch (err) {
            res.status(500).json({ error: 'Failed to save testimonial.' });
        }
    });

    // --- API: Get all testimonials ---
    app.get('/api/testimonials', async (req, res) => {
        try {
            const testimonials = await Testimonial.find().sort({ created_at: -1 });
            res.json(testimonials);
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch testimonials.' });
        }
    });

    // Ingredient analysis endpoint
    app.post('/analyze-ingredients', (req, res) => {
        try {
            const { ingredients } = req.body;
            
            if (!ingredients || typeof ingredients !== 'string') {
                return res.status(400).json({
                    error: 'Ingredients list is required'
                });
            }

            const analysis = analyzeIngredients(ingredients);
            
            res.json({
                success: true,
                analysis: analysis
            });
        } catch (error) {
            console.error('Analysis error:', error);
            res.status(500).json({
                error: 'Internal server error during analysis'
            });
        }
    });

    // AI-powered ingredient extraction endpoint
    app.post('/extract-ingredients-ai', async (req, res) => {
        try {
            const { ocrText } = req.body;
            if (!ocrText || typeof ocrText !== 'string') {
                return res.status(400).json({ error: 'OCR text is required' });
            }
            const prompt = `Extract and correct the list of food ingredients from the following text. Return a comma-separated list, with each ingredient clearly separated. Ignore non-ingredient text (e.g., “contains milk”, “gluten-free”, "and", "or", "with", "from", "of", "the", "a", "an", etc.). If an ingredient contains parentheses, include the content but remove the parentheses symbols from the output. Remove all symbols except dash. Text: ${ocrText}`;
            const response = await cohere.generate({
                model: 'command',
                prompt: prompt,
                max_tokens: 100,
                temperature: 0.2,
                stop_sequences: ['\n']
            });
            let cleaned = response.generations[0].text.trim();
            // Improved post-process: remove parentheses symbols but keep their content, remove non-ingredient words, and extraneous symbols except dash
            cleaned = cleaned
                // Remove parentheses symbols but keep the content inside
                .replace(/[()]/g, '')
                // Remove non-ingredient words/phrases at start, end, or after slashes
                .replace(/(^|[\s,/\\-])((and|or|with|from|of|the|a|an|may contain|contains|produced|allergen|products that|and\/or|and-or|or\/and|andor|orand))[\s,/\\-]+/gi, '$1')
                // Remove non-ingredient words/phrases at the end
                .replace(/([\s,/\\-])((and|or|with|from|of|the|a|an|may contain|contains|produced|allergen|products that|and\/or|and-or|or\/and|andor|orand))$/gi, '')
                // Remove any remaining non-ingredient words (standalone)
                .replace(/\b(and|or|with|from|of|the|a|an|may contain|contains|produced|allergen|products that|and\/or|and-or|or\/and|andor|orand)\b/gi, '')
                // Remove extraneous symbols except dash, comma, space
                .replace(/[^a-zA-Z0-9,\-\s]/g, '')
                // Remove repeated dashes, commas, or spaces
                .replace(/\s{2,}/g, ' ')
                .replace(/,+/g, ',')
                .replace(/\-+/g, '-')
                // Remove leading/trailing dashes, commas, spaces from each ingredient
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

    // Get current user from session/token (simplified for demo)
    function getCurrentUser(req) {
        // In a real app, you'd use JWT tokens or sessions
        // For demo, we'll pass user info in headers
        const userId = req.headers['user-id'];
        const userEmail = req.headers['user-email'];
        const userName = req.headers['user-name'];
        
        if (!userId || !userEmail) {
            return null;
        }
        
        return {
            id: parseInt(userId),
            email: userEmail,
            name: userName
        };
    }

// Submit inaccuracy report
app.post('/submit-report', authenticateJWT(), async (req, res) => {
  const user = req.user;
  const { item_name, reason } = req.body;
  if (!item_name || !reason) {
    return res.status(400).json({ error: 'Item name and reason are required' });
  }
  try {
    const report = new Report({ user_id: user.id, item_name, reason });
    await report.save();
    res.json({ message: 'Report submitted successfully', report_id: report._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get user's reports
app.get('/user-reports', authenticateJWT(), async (req, res) => {
  const user = req.user;
  try {
    const reports = await Report.find({ user_id: user.id }).sort({ created_at: -1 });
    res.json({ reports });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all reports (admin only)
app.get('/admin/reports', authenticateJWT(true), async (req, res) => {
  try {
    const reports = await Report.find().populate('user_id', 'name email').sort({ created_at: -1 });
    res.json({ reports });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update report status (admin only)
app.put('/admin/reports/:id', authenticateJWT(true), async (req, res) => {
  const { id } = req.params;
  const { status, admin_note } = req.body;
  if (!status || !['pending', 'solved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Valid status required' });
  }
  try {
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    report.status = status;
    report.admin_note = admin_note;
    await report.save();
    res.json({ message: 'Report status updated successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Save scan results
app.post('/save-results', authenticateJWT(), async (req, res) => {
  const user = req.user;
  const { result_data } = req.body;
  if (!result_data) {
    return res.status(400).json({ error: 'Result data is required' });
  }
  try {
    const saved = new SavedResult({ user_id: user.id, result_data: JSON.stringify(result_data) });
    await saved.save();
    res.json({ message: 'Results saved successfully', saved_id: saved._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get user's saved results
app.get('/user-saved-results', authenticateJWT(), async (req, res) => {
  const user = req.user;
  try {
    const results = await SavedResult.find({ user_id: user.id }).sort({ created_at: -1 });
    const parsedResults = results.map(r => ({
      ...r.toObject(),
      result_data: JSON.parse(r.result_data)
    }));
    res.json({ saved_results: parsedResults });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete saved result
app.delete('/saved-results/:id', authenticateJWT(), async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  try {
    const result = await SavedResult.findOneAndDelete({ _id: id, user_id: user.id });
    if (!result) {
      return res.status(404).json({ error: 'Saved result not found' });
    }
    res.json({ message: 'Saved result deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete report (user or admin)
app.delete('/reports/:id', authenticateJWT(), async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  try {
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (user.is_admin) {
      if (report.status === 'pending') {
        return res.status(400).json({ error: 'Admin must review the report before deleting.' });
      }
      await report.deleteOne();
      res.json({ message: 'Report deleted by admin.' });
    } else {
      if (report.user_id.toString() !== user.id) {
        return res.status(403).json({ error: 'You can only delete your own report.' });
      }
      await report.deleteOne();
      res.json({ message: 'Report deleted.' });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running: port ${PORT}`);
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));