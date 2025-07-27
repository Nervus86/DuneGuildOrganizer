import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const admin = new User({
  username: 'admin',
  password: 'adminpass',
  displayName: 'app Admin',
  role: 'admin'
});

await admin.save();
console.log('Admin created!');
process.exit();
