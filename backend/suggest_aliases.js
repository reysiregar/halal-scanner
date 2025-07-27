const fs = require('fs');
const path = require('path');
const stringSimilarity = require('string-similarity');

function clean(str) {
    return str
        .replace(/\([^)]*\)/g, '')
        .replace(/\d+[%]?/g, '')
        .replace(/[^a-zA-Z\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

const dbPath = path.join(__dirname, '../ingredients.json');
const unknownPath = path.join(__dirname, '../unknown_ingredients.txt');

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const unknowns = fs.readFileSync(unknownPath, 'utf8').split(/\r?\n/).map(l => l.trim()).filter(Boolean);

const suggestions = [];

unknowns.forEach(unknown => {
    const cleanedUnknown = clean(unknown);
    let bestScore = 0;
    let bestMatch = null;
    let bestDbEntry = null;
    db.ingredients.forEach(entry => {
        const dbNames = [entry.item_name, ...(entry.aliases || [])];
        dbNames.forEach(name => {
            const cleanedDb = clean(name);
            const score = stringSimilarity.compareTwoStrings(cleanedUnknown, cleanedDb);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = name;
                bestDbEntry = entry;
            }
        });
    });
    if (bestScore > 0.5 && bestDbEntry) {
        suggestions.push({
            unknown,
            match: bestDbEntry.item_name,
            score: bestScore
        });
    }
});

console.log('Alias Suggestions:');
suggestions.forEach(s => {
    console.log(`Add alias "${s.unknown}" to "${s.match}" (score: ${s.score.toFixed(2)})`);
}); 