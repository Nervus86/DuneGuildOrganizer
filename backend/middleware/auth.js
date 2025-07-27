import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Guild from '../models/Guild.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token' });

  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ message: 'Invalid token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}


export function requireGuildRole(...allowedRoles) {
  return async (req, res, next) => {
    const user = await User.findById(req.user.id).populate('guild');
    if (!user.guild) return res.status(403).json({ message: 'Not in a guild' });
    const guild = await Guild.findById(user.guild._id);
    const entry = guild.rolesByMember.find(e => e.user.toString() === req.user.id);

    if (!entry || !allowedRoles.includes(entry.role)) {
      return res.status(403).json({ message: 'Insufficient guild permissions' });
    }

    next();
  }
}