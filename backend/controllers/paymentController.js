const pool = require('../db');
const PAYMENT_STATUSES = ['pending', 'deposit_received', 'partially_paid', 'fully_paid'];

const logActivity = async (userId, clientId, type, description) => {
  try { await pool.query('INSERT INTO activities (user_id,client_id,type,description) VALUES ($1,$2,$3,$4)', [userId, clientId||null, type, description]); } catch(e){}
};

// GET /api/payments
const getPayments = async (req, res) => {
  const { search, payment_status, page=1, limit=10 } = req.query;
  const offset = (page-1)*limit;
  let conditions = ['p.user_id=$1'], params=[req.user.id], idx=2;
  if (search) { conditions.push(`c.name ILIKE $${idx}`); params.push(`%${search}%`); idx++; }
  if (payment_status) { conditions.push(`p.payment_status=$${idx}`); params.push(payment_status); idx++; }
  const where = conditions.join(' AND ');
  try {
    const countRes = await pool.query(`SELECT COUNT(*) FROM payments p JOIN clients c ON c.id=p.client_id WHERE ${where}`, params);
    const total = parseInt(countRes.rows[0].count);
    params.push(parseInt(limit), parseInt(offset));
    const result = await pool.query(
      `SELECT p.*, c.name as client_name, c.event_type, c.event_date, c.phone FROM payments p
       JOIN clients c ON c.id=p.client_id WHERE ${where}
       ORDER BY p.updated_at DESC LIMIT $${idx} OFFSET $${idx+1}`, params
    );
    res.json({ payments: result.rows, total, page: parseInt(page), totalPages: Math.ceil(total/limit) });
  } catch(err) { console.error(err); res.status(500).json({ message:'Server error.' }); }
};

// GET /api/payments/summary
const getSummary = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         SUM(total_amount) as total_revenue,
         SUM(paid_amount) as total_collected,
         SUM(balance_amount) as total_pending,
         COUNT(CASE WHEN payment_status='fully_paid' THEN 1 END) as fully_paid_count,
         COUNT(CASE WHEN payment_status='deposit_received' THEN 1 END) as deposit_count,
         COUNT(CASE WHEN payment_status='partially_paid' THEN 1 END) as partial_count
       FROM payments WHERE user_id=$1`, [req.user.id]
    );
    res.json(result.rows[0]);
  } catch(err) { res.status(500).json({ message:'Server error.' }); }
};

// GET /api/payments/:clientId
const getPayment = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name as client_name FROM payments p JOIN clients c ON c.id=p.client_id WHERE p.client_id=$1 AND p.user_id=$2`,
      [req.params.clientId, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message:'Payment not found.' });
    res.json(result.rows[0]);
  } catch(err) { res.status(500).json({ message:'Server error.' }); }
};

// PATCH /api/payments/:clientId/status
const updatePaymentStatus = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can update payment status.' });
  }

  const { payment_status } = req.body;
  if (!PAYMENT_STATUSES.includes(payment_status)) {
    return res.status(400).json({ message: 'Invalid payment status.' });
  }

  try {
    const result = await pool.query(
      `UPDATE payments SET payment_status=$1, updated_at=NOW()
       WHERE client_id=$2 AND user_id=$3 RETURNING *`,
      [payment_status, req.params.clientId, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message:'Payment not found.' });
    await logActivity(req.user.id, req.params.clientId, 'payment_status_updated', `Payment status changed to ${payment_status.replace(/_/g, ' ')}`);
    res.json(result.rows[0]);
  } catch(err) {
    console.error(err);
    res.status(500).json({ message:'Server error.' });
  }
};

// PUT /api/payments/:clientId
const updatePayment = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can update payment records.' });
  }

  const { total_amount, deposit_amount, paid_amount, payment_status, payment_method, notes, due_date } = req.body;
  const total = parseFloat(total_amount)||0;
  const paid = parseFloat(paid_amount)||0;
  const deposit = parseFloat(deposit_amount)||0;
  if (total < 0 || paid < 0 || deposit < 0) {
    return res.status(400).json({ message: 'Payment amounts cannot be negative.' });
  }
  if (paid > total) {
    return res.status(400).json({ message: 'Paid amount cannot be greater than total amount.' });
  }
  if (deposit > total) {
    return res.status(400).json({ message: 'Deposit cannot be greater than total amount.' });
  }
  const balance = Math.max(0, total - paid);
  let status = 'pending';
  if (paid >= total && total > 0) status = 'fully_paid';
  else if (paid >= deposit && deposit > 0) status = 'deposit_received';
  else if (paid > 0) status = 'partially_paid';
  if (payment_status !== undefined) {
    if (!PAYMENT_STATUSES.includes(payment_status)) {
      return res.status(400).json({ message: 'Invalid payment status.' });
    }
    status = payment_status;
  }
  try {
    const result = await pool.query(
      `UPDATE payments SET total_amount=$1,deposit_amount=$2,balance_amount=$3,paid_amount=$4,
       payment_status=$5,payment_method=$6,notes=$7,due_date=$8,updated_at=NOW()
       WHERE client_id=$9 AND user_id=$10 RETURNING *`,
      [total, deposit, balance, paid, status, payment_method, notes, due_date||null, req.params.clientId, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message:'Payment not found.' });
    const clientRes = await pool.query('SELECT name FROM clients WHERE id=$1', [req.params.clientId]);
    const clientName = clientRes.rows[0]?.name || 'Unknown';
    await logActivity(req.user.id, req.params.clientId, 'payment_received', `Payment updated for ${clientName}: ₹${paid.toLocaleString()}`);
    res.json(result.rows[0]);
  } catch(err) { console.error(err); res.status(500).json({ message:'Server error.' }); }
};

module.exports = { getPayments, getSummary, getPayment, updatePaymentStatus, updatePayment };
