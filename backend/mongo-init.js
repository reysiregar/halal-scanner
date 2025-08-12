require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

function randomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  await User.deleteMany({}); // Clean users

  const adminPassword = randomString(12);
  const userPassword = randomString(12);
  const admin = new User({
    name: 'Default Admin',
    email: 'admin@halalscanner.com',
    password: await bcrypt.hash(adminPassword, 10),
    is_admin: true
  });
  const user = new User({
    name: 'Default User',
    email: 'user@halalscanner.com',
    password: await bcrypt.hash(userPassword, 10),
    is_admin: false
  });
  await admin.save();
  await user.save();
  console.log('Default Admin:', admin.email, 'Password:', adminPassword);
  console.log('Default User:', user.email, 'Password:', userPassword);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
