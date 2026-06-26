const pool = require('../db');

const toCalendarEvent = c => ({
  id: `client-${c.id}`,
  title: `${c.name} - ${c.event_type}`,
  date: c.event_date,
  event_date: c.event_date,
  type: 'shoot',
  clientId: c.id,
  client_id: c.id,
  client_name: c.name,
  name: c.name,
  eventType: c.event_type,
  event_type: c.event_type,
  time: c.time || 'All day',
  location: c.address || '',
  color: '#6366F1',
  payment_status: c.payment_status,
  stage: c.stage,
  phone: c.phone,
});

// GET /api/calendar/events
const getEvents = async (req, res) => {
  const { start, end } = req.query;
  try {
    const params = [req.user.id];
    const conditions = ['c.user_id = $1', 'c.event_date IS NOT NULL'];

    if (start) {
      params.push(start);
      conditions.push(`c.event_date >= $${params.length}`);
    }
    if (end) {
      params.push(end);
      conditions.push(`c.event_date <= $${params.length}`);
    }

    const clients = await pool.query(
      `SELECT c.id, c.name, c.event_type, c.event_date, c.phone, c.address,
              p.payment_status, pip.stage
       FROM clients c
       LEFT JOIN payments p ON p.client_id = c.id
       LEFT JOIN pipeline pip ON pip.client_id = c.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY c.event_date ASC`,
      params
    );

    res.json(clients.rows.map(toCalendarEvent));
  } catch(err) {
    console.error(err);
    res.status(500).json({ message:'Server error.' });
  }
};

// GET /api/calendar/upcoming
const getUpcoming = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.event_type, c.event_date, c.phone, c.address,
              p.payment_status, pip.stage
       FROM clients c
       LEFT JOIN payments p ON p.client_id=c.id
       LEFT JOIN pipeline pip ON pip.client_id=c.id
       WHERE c.user_id=$1 AND c.event_date >= CURRENT_DATE
       ORDER BY c.event_date ASC LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows.map(toCalendarEvent));
  } catch(err) {
    console.error(err);
    res.status(500).json({ message:'Server error.' });
  }
};

module.exports = { getEvents, getUpcoming };

