const mongoose = require('mongoose');

const savedResultSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  result_data: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SavedResult', savedResultSchema);
