const jwt = require('jsonwebtoken');
const pool = require('../db');

const WORKSPACE_OWNER_ID = Number(process.env.WORKSPACE_OWNER_ID || 1);

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    if (!userId) return res.status(401).json({ message: 'Invalid token payload.' });

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (!result.rows.length) return res.status(401).json({ message: 'User no longer exists.' });

    const user = result.rows[0];
    if (!['admin', 'staff'].includes(user.role)) return res.status(403).json({ message: 'Invalid user role.' });
    if (user.is_active === false) return res.status(403).json({ message: 'Account is inactive. Contact admin.' });

    req.user = {
      userId: user.id,
      id: WORKSPACE_OWNER_ID,
      workspaceId: WORKSPACE_OWNER_ID,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.is_active !== false
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden. Admin access required.' });
  next();
};

module.exports = authMiddleware;
module.exports.adminOnly = adminOnly;
