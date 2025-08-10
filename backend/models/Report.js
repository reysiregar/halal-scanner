const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  item_name: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, default: 'pending' },
  admin_note: { type: String },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);
