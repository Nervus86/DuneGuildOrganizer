import express from 'express';
import Guild from '../models/Guild.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import { authMiddleware, requireGuildRole } from '../middleware/auth.js';

const router = express.Router();

// Crea una gilda
router.post('/', authMiddleware, async (req, res) => {
  const { name } = req.body;

  const existing = await Guild.findOne({ name });
  if (existing) return res.status(400).json({ message: 'Guild name already exists' });

  const guild = await Guild.create({ name, owner: req.user.id, members: [req.user.id] });
  await User.findByIdAndUpdate(req.user.id, { guild: guild._id });

  res.status(201).json(guild);
});

// Aggiungi un membro
router.post('/:guildId/add', authMiddleware, requireGuildRole(['leader', 'officer']), async (req, res) => {
  const { userId } = req.body;
  const guild = await Guild.findById(req.params.guildId);
  if (!guild) return res.status(404).json({ message: 'Guild not found' });
  if (!guild.owner.equals(req.user.id)) return res.status(403).json({ message: 'Only owner can add members' });

  if (!guild.members.includes(userId)) guild.members.push(userId);
  await guild.save();
  await User.findByIdAndUpdate(userId, { guild: guild._id });

  res.json({ message: 'User added to guild' });
});


// Rimuovi un membro (ma non il leader!)
router.post('/:guildId/remove', authMiddleware, requireGuildRole(['leader', 'officer']), async (req, res) => {
  const { userId } = req.body;
  const guild = await Guild.findById(req.params.guildId);

  if (!guild) return res.status(404).json({ message: 'Guild not found' });
  if (!guild.owner.equals(req.user.id)) return res.status(403).json({ message: 'Only owner can remove members' });

  if (guild.owner.equals(userId)) {
    return res.status(400).json({ message: 'Cannot remove the guild leader. Transfer leadership first.' });
  }

  guild.members = guild.members.filter(id => id.toString() !== userId);
  await guild.save();
  await User.findByIdAndUpdate(userId, { guild: null });

  res.json({ message: 'User removed from guild' });
});


// Uscita volontaria da una gilda
router.post('/leave', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user.guild) return res.status(400).json({ message: 'Not in a guild' });

  const guild = await Guild.findById(user.guild);
  guild.members = guild.members.filter(id => id.toString() !== user._id.toString());
  await guild.save();

  user.guild = null;
  await user.save();

  res.json({ message: 'You left the guild' });
});

// Cambia il leader della gilda
router.post('/:guildId/transfer-leadership', authMiddleware, requireGuildRole(['leader']), async (req, res) => {
  const { newLeaderId } = req.body;
  const guild = await Guild.findById(req.params.guildId);

  if (!guild) return res.status(404).json({ message: 'Guild not found' });
  if (!guild.owner.equals(req.user.id)) return res.status(403).json({ message: 'Only the current leader can transfer ownership' });
  if (!guild.members.includes(newLeaderId)) return res.status(400).json({ message: 'New leader must be a member of the guild' });

  guild.owner = newLeaderId;
  await guild.save();

  res.json({ message: 'Leadership transferred' });
});

router.get(
  '/members/count',
  authMiddleware,
  requireGuildRole('leader', 'officer'),
  async (req, res) => {
    const guild = await Guild.findById(req.user.guild)
    if (!guild) return res.status(404).json({ message: 'Guild not found' })

    res.json({ count: guild.members.length })
  }
)

router.get(
  '/members/list',
  authMiddleware,
  requireGuildRole('leader', 'officer'),
  async (req, res) => {
    const guild = await Guild.findById(req.user.guild).populate('members')
    if (!guild) return res.status(404).json({ message: 'Guild not found' })

    const roleMap = {}
    for (const entry of guild.rolesByMember) {
      roleMap[entry.user.toString()] = entry.role
    }

    const members = guild.members.map(member => ({
      id: member._id,
      username: member.username,
      displayName: member.displayName,
      role: roleMap[member._id.toString()] || 'member'
    }))

    res.json({ members })
  }
)

router.get(
  '/events/count',
  authMiddleware,
  requireGuildRole('leader', 'officer'),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id)

      if (!user.guild) {
        return res.status(400).json({ message: 'User not in a guild' })
      }

      const count = await Event.countDocuments({ guild: user.guild })

      res.json({ count })
    } catch (err) {
      console.error('[ERROR] /guilds/events/count:', err)
      res.status(500).json({ message: 'Server error' })
    }
  }
)

export default router;
