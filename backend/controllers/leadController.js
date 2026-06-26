const pool = require('../db');
const normalizePhone = phone => String(phone || '').replace(/\D/g, '');
const isValidIndianMobile = phone => /^[6-9]\d{9}$/.test(normalizePhone(phone));
const LEAD_STATUSES = ['new','contacted','quoted','confirmed','cancelled'];

const logActivity = async (userId, clientId, type, description) => {
  try { await pool.query('INSERT INTO activities (user_id,client_id,type,description) VALUES ($1,$2,$3,$4)', [userId, clientId||null, type, description]); } catch(e){}
};

// GET /api/leads
const getLeads = async (req, res) => {
  const userId = req.user.id;
  const { search, status, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  let conditions = ['user_id = $1'], params = [userId], idx = 2;
  if (search) { conditions.push(`(name ILIKE $${idx} OR phone ILIKE $${idx} OR email ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
  if (status) { conditions.push(`status = $${idx}`); params.push(status); idx++; }
  const where = conditions.join(' AND ');
  try {
    const countRes = await pool.query(`SELECT COUNT(*) FROM leads WHERE ${where}`, params);
    const total = parseInt(countRes.rows[0].count);
    params.push(parseInt(limit), parseInt(offset));
    const result = await pool.query(`SELECT * FROM leads WHERE ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx+1}`, params);
    res.json({ leads: result.rows, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total/limit) });
  } catch(err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
};

// GET /api/leads/stats
const getLeadStats = async (req, res) => {
  try {
    const result = await pool.query(`SELECT status, COUNT(*) as count FROM leads WHERE user_id=$1 GROUP BY status`, [req.user.id]);
    const stats = { new:0, contacted:0, quoted:0, confirmed:0, cancelled:0 };
    result.rows.forEach(r => { if(stats[r.status]!==undefined) stats[r.status]=parseInt(r.count); });
    res.json(stats);
  } catch(err) { res.status(500).json({ message: 'Server error.' }); }
};

// GET /api/leads/:id
const getLead = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leads WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Lead not found.' });
    res.json(result.rows[0]);
  } catch(err) { res.status(500).json({ message: 'Server error.' }); }
};

// POST /api/leads
const createLead = async (req, res) => {
  const userId = req.user.id;
  const { name, phone, email, event_type, event_date, budget, source, notes, status='new' } = req.body;
  if (!name) return res.status(400).json({ message: 'Lead name is required.' });
  if (!isValidIndianMobile(phone)) return res.status(400).json({ message: 'Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.' });
  if (!LEAD_STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid lead status.' });
  if (budget !== undefined && budget !== null && budget !== '' && Number(budget) < 0) {
    return res.status(400).json({ message: 'Budget cannot be negative.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO leads (user_id,name,phone,email,event_type,event_date,budget,source,notes,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [userId, name, normalizePhone(phone), email, event_type, event_date||null, budget||null, source, notes, status]
    );
    await logActivity(userId, null, 'lead_added', `New lead ${name} added`);
    res.status(201).json(result.rows[0]);
  } catch(err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
};

// PUT /api/leads/:id
const updateLead = async (req, res) => {
  const { name, phone, email, event_type, event_date, budget, source, notes, status } = req.body;
  if (!name) return res.status(400).json({ message: 'Lead name is required.' });
  if (!isValidIndianMobile(phone)) return res.status(400).json({ message: 'Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.' });
  if (!LEAD_STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid lead status.' });
  if (budget !== undefined && budget !== null && budget !== '' && Number(budget) < 0) {
    return res.status(400).json({ message: 'Budget cannot be negative.' });
  }
  try {
    const result = await pool.query(
      `UPDATE leads SET name=$1,phone=$2,email=$3,event_type=$4,event_date=$5,budget=$6,source=$7,notes=$8,status=$9,updated_at=NOW() WHERE id=$10 AND user_id=$11 RETURNING *`,
      [name, normalizePhone(phone), email, event_type, event_date||null, budget||null, source, notes, status, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Lead not found.' });
    res.json(result.rows[0]);
  } catch(err) { res.status(500).json({ message: 'Server error.' }); }
};

// DELETE /api/leads/:id
const deleteLead = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM leads WHERE id=$1 AND user_id=$2 RETURNING name', [req.params.id, req.user.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Lead not found.' });
    res.json({ message: `Lead "${result.rows[0].name}" deleted.` });
  } catch(err) { res.status(500).json({ message: 'Server error.' }); }
};

module.exports = { getLeads, getLeadStats, getLead, createLead, updateLead, deleteLead };

