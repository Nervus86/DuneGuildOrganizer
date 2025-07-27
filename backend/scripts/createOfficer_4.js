import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/User.js'
import Guild from '../models/Guild.js'

dotenv.config()
await mongoose.connect(process.env.MONGO_URI)

const guild = await Guild.findOne({ name: 'SplitGuild' })
if (!guild) {
  console.error('❌ Gilda "TestGuild" non trovata.')
  process.exit(1)
}

const user = new User({
  username: 'officer1',
  password: 'officerpass',
  displayName: 'Officer Uno',
  role: 'user',
  guild: guild._id
})
await user.save()

guild.members.push(user._id)
guild.rolesByMember = guild.rolesByMember || []
guild.rolesByMember.push({ user: user._id, role: 'officer' })
await guild.save()

console.log('✅ Officer creato e aggiunto alla gilda TestGuild.')
process.exit()
