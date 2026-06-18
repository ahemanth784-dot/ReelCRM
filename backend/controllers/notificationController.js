const pool = require('../db');

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, c.name as client_name
       FROM activities a
       LEFT JOIN clients c ON c.id=a.client_id
       WHERE a.user_id=$1
       ORDER BY a.created_at DESC
       LIMIT 20`,
      [req.user.id]
    );
    res.json({ notifications: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load notifications.' });
  }
};

module.exports = { getNotifications };
