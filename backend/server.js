const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const stringSimilarity = require('string-similarity');
const { CohereClient } = require('cohere-ai');
const cohere = new CohereClient({
  token: 'aA2FHRswke9hKG8mSCdhXI8NuBzONV6qMAZgL3le'
});
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Load haram ingredients database (new structure)
let haramIngredientsArr = [];
try {
    const haramData = fs.readFileSync(path.join(__dirname, '../haram_ingredients.json'), 'utf8');
    const parsed = JSON.parse(haramData);
    haramIngredientsArr = parsed.ingredients || [];
} catch (error) {
    console.error('Error loading haram ingredients:', error);
}

// Enhanced normalization: remove common words, plurals, and extra spaces
function strongNormalize(str) {
    return str
        .replace(/\([^)]*\)/g, '') // remove parenthesis and their content
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

// open the database
let db = new sqlite3.Database('./halalscanner.db', (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    }
    console.log('Connected to the halalscanner.db database.');

    // Create users table with is_admin column
    const usersSql = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0
        )`;
    db.run(usersSql, (err) => {
        if (err) {
            return console.error(err.message);
        }
    });

    // Create saved_results table
    const savedResultsSql = `
    CREATE TABLE IF NOT EXISTS saved_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        result_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`;
    db.run(savedResultsSql, (err) => {
        if (err) {
            return console.error('Error creating saved_results table:', err.message);
        }
    });

    // Create testimonials table
    const testimonialsSql = `
    CREATE TABLE IF NOT EXISTS testimonials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        testimony TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`;
    db.run(testimonialsSql, (err) => {
        if (err) {
            return console.error('Error creating testimonials table:', err.message);
        }
    });

    global.db = db;

    // --- API: Add a testimonial ---
    app.post('/api/testimonials', (req, res) => {
        const { name, rating, testimony } = req.body;
        if (!name || !rating || !testimony) {
            return res.status(400).json({ error: 'Name, rating, and testimony are required.' });
        }
        const sql = 'INSERT INTO testimonials (name, rating, testimony) VALUES (?, ?, ?)';
        db.run(sql, [name, rating, testimony], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to save testimonial.' });
            }
            res.json({ success: true, id: this.lastID });
        });
    });

    // --- API: Get all testimonials ---
    app.get('/api/testimonials', (req, res) => {
        db.all('SELECT * FROM testimonials ORDER BY created_at DESC', [], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch testimonials.' });
            }
            res.json(rows);
        });
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
            const prompt = `Extract and correct the list of food ingredients from the following text. Return a comma-separated list, with each ingredient clearly separated. Ignore non-ingredient text (e.g., “contains milk”, “gluten-free”, etc.). Text: ${ocrText}`;
            const response = await cohere.generate({
                model: 'command',
                prompt: prompt,
                max_tokens: 100,
                temperature: 0.2,
                stop_sequences: ['\n']
            });
            const cleaned = response.generations[0].text.trim();
            res.json({ success: true, ingredients: cleaned });
        } catch (error) {
            console.error('Cohere extraction error:', error);
            res.status(500).json({ error: 'Failed to extract ingredients with AI' });
        }
    });

    // Signup endpoint
    app.post('/signup', (req, res) => {
        const { name, email, password } = req.body;
        const sql = 'INSERT INTO users (name, email, password) VALUES (?,?,?)';
        const params = [name, email, password];

        db.run(sql, params, function(err, result) {
            if (err) {
                res.status(400).json({"error": err.message});
                return;
            }
            res.json({
                "message": "success",
                "data": { name, email },
                "id": this.lastID
            });
        });
    });

    // Signin endpoint (returns JWT)
    app.post('/signin', (req, res) => {
        const { email, password } = req.body;
        const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
        const params = [email, password];
        db.get(sql, params, (err, row) => {
            if (err) {
                res.status(400).json({"error": err.message});
                return;
            }
            if (row) {
                // Issue JWT
                const token = jwt.sign({
                    id: row.id,
                    email: row.email,
                    name: row.name,
                    is_admin: !!row.is_admin
                }, JWT_SECRET, { expiresIn: '12h' });
                res.json({
                    message: "success",
                    token,
                    data: row
                });
            } else {
                res.status(404).json({"error": "User not found"});
            }
        });
    });

    // Helper function to check if user is admin (for demo, we'll use a simple check)
    function isAdmin(userId) {
        // For demo purposes, let's consider user with ID 1 as admin
        // In production, you'd have a proper admin role system
        return userId === 1;
    }

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
    app.post('/submit-report', (req, res) => {
        const user = getCurrentUser(req);
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const { item_name, reason } = req.body;
        
        if (!item_name || !reason) {
            return res.status(400).json({ error: 'Item name and reason are required' });
        }
        
        const sql = 'INSERT INTO reports (user_id, item_name, reason) VALUES (?, ?, ?)';
        const params = [user.id, item_name, reason];
        
        db.run(sql, params, function(err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({
                message: 'Report submitted successfully',
                report_id: this.lastID
            });
        });
    });

    // Get user's reports
    app.get('/user-reports', (req, res) => {
        const user = getCurrentUser(req);
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const sql = 'SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC';
        const params = [user.id];
        
        db.all(sql, params, (err, rows) => {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({ reports: rows });
        });
    });

    // Get all reports (admin only)
    app.get('/admin/reports', (req, res) => {
        const user = getCurrentUser(req);
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        if (!isAdmin(user.id)) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const sql = `
            SELECT r.*, u.name as user_name, u.email as user_email 
            FROM reports r 
            LEFT JOIN users u ON r.user_id = u.id 
            ORDER BY r.created_at DESC
        `;
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({ reports: rows });
        });
    });

    // Update report status (admin only)
    app.put('/admin/reports/:id', (req, res) => {
        const user = getCurrentUser(req);
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!isAdmin(user.id)) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { id } = req.params;
        const { status, admin_note } = req.body;
        if (!status || !['pending', 'solved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Valid status required' });
        }
        // Get the report to find the user_id
        db.get('SELECT * FROM reports WHERE id = ?', [id], (err, report) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            if (!report) {
                return res.status(404).json({ error: 'Report not found' });
            }
            const sql = `
                UPDATE reports 
                SET status = ?, admin_note = ?
                WHERE id = ?
            `;
            const params = [status, admin_note, id];
            db.run(sql, params, function(err) {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }
                res.json({ message: 'Report status updated successfully' });
            });
        });
    });

    // Save scan results
    app.post('/save-results', (req, res) => {
        const user = getCurrentUser(req);
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const { result_data } = req.body;
        
        if (!result_data) {
            return res.status(400).json({ error: 'Result data is required' });
        }
        
        const sql = 'INSERT INTO saved_results (user_id, result_data) VALUES (?, ?)';
        const params = [user.id, JSON.stringify(result_data)];
        
        db.run(sql, params, function(err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({
                message: 'Results saved successfully',
                saved_id: this.lastID
            });
        });
    });

    // Get user's saved results
    app.get('/user-saved-results', (req, res) => {
        const user = getCurrentUser(req);
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const sql = 'SELECT * FROM saved_results WHERE user_id = ? ORDER BY created_at DESC';
        const params = [user.id];
        
        db.all(sql, params, (err, rows) => {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            // Parse the JSON data for each result
            const results = rows.map(row => ({
                ...row,
                result_data: JSON.parse(row.result_data)
            }));
            res.json({ saved_results: results });
        });
    });

    // Delete saved result
    app.delete('/saved-results/:id', (req, res) => {
        const user = getCurrentUser(req);
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const { id } = req.params;
        
        const sql = 'DELETE FROM saved_results WHERE id = ? AND user_id = ?';
        const params = [id, user.id];
        
        db.run(sql, params, function(err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ error: 'Saved result not found' });
                return;
            }
            res.json({ message: 'Saved result deleted successfully' });
        });
    });

    // Delete report (user or admin)
    app.delete('/reports/:id', (req, res) => {
        const user = getCurrentUser(req);
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const { id } = req.params;
        db.get('SELECT * FROM reports WHERE id = ?', [id], (err, report) => {
            if (err) return res.status(400).json({ error: err.message });
            if (!report) return res.status(404).json({ error: 'Report not found' });
            // Admin can delete only if reviewed
            if (isAdmin(user.id)) {
                if (report.status === 'pending') {
                    return res.status(400).json({ error: 'Admin must review the report before deleting.' });
                }
                db.run('DELETE FROM reports WHERE id = ?', [id], function(err) {
                    if (err) return res.status(400).json({ error: err.message });
                    res.json({ message: 'Report deleted by admin.' });
                });
            } else {
                // User can only delete their own report
                if (report.user_id !== user.id) {
                    return res.status(403).json({ error: 'You can only delete your own report.' });
                }
                db.run('DELETE FROM reports WHERE id = ? AND user_id = ?', [id, user.id], function(err) {
                    if (err) return res.status(400).json({ error: err.message });
                    res.json({ message: 'Report deleted.' });
                });
            }
        });
    });

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});

// After db is initialized, add:
global.db = db;
