import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/User.js'
import Guild from '../models/Guild.js'

dotenv.config()
await mongoose.connect(process.env.MONGO_URI)

// Puoi sostituire direttamente con l'id dell'utente creato da createLeader
const leader = await User.findOne({ username: 'guildleader' })

if (!leader) {
  console.error('❌ Utente leader non trovato')
  process.exit(1)
}

const guild = new Guild({
  name: 'SplitGuild',
  owner: leader._id,
  members: [leader._id],
  rolesByMember: [{ user: leader._id, role: 'leader' }]
})

await guild.save()

leader.guild = guild._id
await leader.save()

console.log('✅ Gilda creata con leader:', guild.name)
process.exit()
