const pool = require('../db');

// GET /api/calendar/events
const getEvents = async (req, res) => {
  const { start, end } = req.query;
  try {
    const clients = await pool.query(
      `SELECT id, name, event_type, event_date, 'shoot' as event_kind FROM clients
       WHERE user_id=$1 AND event_date IS NOT NULL
       ${start ? 'AND event_date >= $2' : ''} ${end ? `AND event_date <= $${start?3:2}` : ''}`,
      start && end ? [req.user.id, start, end] : start ? [req.user.id, start] : [req.user.id]
    );
    const events = clients.rows.map(c => ({
      id: `client-${c.id}`,
      title: `${c.name} - ${c.event_type}`,
      date: c.event_date,
      type: c.event_kind,
      clientId: c.id,
      eventType: c.event_type,
      color: '#6366F1'
    }));
    res.json(events);
  } catch(err) { console.error(err); res.status(500).json({ message:'Server error.' }); }
};

// GET /api/calendar/upcoming
const getUpcoming = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.event_type, c.event_date, c.phone,
              p.payment_status, pip.stage
       FROM clients c
       LEFT JOIN payments p ON p.client_id=c.id
       LEFT JOIN pipeline pip ON pip.client_id=c.id
       WHERE c.user_id=$1 AND c.event_date >= CURRENT_DATE
       ORDER BY c.event_date ASC LIMIT 10`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch(err) { res.status(500).json({ message:'Server error.' }); }
};

module.exports = { getEvents, getUpcoming };
