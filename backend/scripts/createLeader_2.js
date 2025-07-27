import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/User.js'

dotenv.config()
await mongoose.connect(process.env.MONGO_URI)

const leader = new User({
  username: 'guildleader',
  password: 'leaderpass',
  displayName: 'Guild Leader',
  role: 'user'
})

await leader.save()
console.log('✅ Leader creato:', leader.username)
process.exit()
