const pool = require('../db');

const normalizePhone = phone => String(phone || '').replace(/\D/g, '');
const isValidIndianMobile = phone => /^[6-9]\d{9}$/.test(normalizePhone(phone));
const todayLocal = () => new Date().toISOString().split('T')[0];
const isPastDate = date => Boolean(date) && String(date).split('T')[0] < todayLocal();
const isValidPersonName = name => /^[A-Za-z][A-Za-z\s&.'-]*$/.test(String(name || '').trim());
const VALID_EVENT_TYPES = ['Wedding','Pre-Wedding','Engagement','Maternity','Baby Shower','Portraits','Corporate Event','Birthday','Anniversary','Other'];
const VALID_CLIENT_STATUSES = ['active','inactive','completed'];
const VALID_PAYMENT_METHODS = ['Cash','UPI','Bank Transfer','Cheque','Card','Other'];
const validateClientCore = ({ name, phone, event_type, event_date, status = 'active' }) => {
  if (!String(name || '').trim()) return 'Client name is required.';
  if (!isValidPersonName(name)) return 'Client name should not contain numbers or special symbols.';
  if (!isValidIndianMobile(phone)) return 'Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.';
  if (!event_type) return 'Event type is required.';
  if (!VALID_EVENT_TYPES.includes(event_type)) return 'Invalid event type.';
  if (!VALID_CLIENT_STATUSES.includes(status)) return 'Invalid client status.';
  if (!event_date) return 'Event date is required.'
  if (isPastDate(event_date)) return 'Event date cannot be in the past.';
  return null;
};

const logActivity = async (userId, clientId, type, description) => {
  try {
    await pool.query(
      'INSERT INTO activities (user_id, client_id, type, description) VALUES ($1, $2, $3, $4)',
      [userId, clientId || null, type, description]
    );
  } catch (e) { /* silent */ }
};

// GET /api/clients
const getClients = async (req, res) => {
  const userId = req.user.id;
  const { search, event_type, status, sort_by = 'created_at', order = 'DESC', page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  let conditions = ['c.user_id = $1'];
  let params = [userId];
  let idx = 2;

  if (search) {
    conditions.push(`(c.name ILIKE $${idx} OR c.phone ILIKE $${idx} OR c.email ILIKE $${idx})`);
    params.push(`%${search}%`); idx++;
  }
  if (event_type) { conditions.push(`c.event_type = $${idx}`); params.push(event_type); idx++; }
  if (status) { conditions.push(`c.status = $${idx}`); params.push(status); idx++; }

  const where = conditions.join(' AND ');
  const validSorts = ['name', 'event_date', 'created_at', 'event_type'];
  const sortCol = validSorts.includes(sort_by) ? sort_by : 'created_at';
  const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  try {
    const countResult = await pool.query(`SELECT COUNT(*) FROM clients c WHERE ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit), parseInt(offset));
    const result = await pool.query(
      `SELECT c.*, p.payment_status, p.total_amount, p.paid_amount, pip.stage
       FROM clients c
       LEFT JOIN payments p ON p.client_id = c.id
       LEFT JOIN pipeline pip ON pip.client_id = c.id
       WHERE ${where}
       ORDER BY c.${sortCol} ${sortOrder}
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );
    res.json({ clients: result.rows, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/clients/:id
const getClient = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, p.payment_status, p.total_amount, p.deposit_amount, p.balance_amount, p.paid_amount, pip.stage
       FROM clients c
       LEFT JOIN payments p ON p.client_id = c.id
       LEFT JOIN pipeline pip ON pip.client_id = c.id
       WHERE c.id = $1 AND c.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Client not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/clients
const createClient = async (req, res) => {
  const userId = req.user.id;
  const {
    name, phone, email, event_type, event_date, address, notes, status = 'active',
    total_amount = 0, deposit_amount = 0, paid_amount = 0, payment_method, due_date
  } = req.body;
  const validationError = validateClientCore({ name, phone, event_type, event_date, status });
  if (validationError) return res.status(400).json({ message: validationError });
  const total = Number(total_amount);
  if (!payment_method) {
    return res.status(400).json({ message: 'Payment method is required.' });
  }
  if (!VALID_PAYMENT_METHODS.includes(payment_method)) {
    return res.status(400).json({ message: 'Invalid payment method.' });
  }
  if (paid_amount === undefined || paid_amount === null || paid_amount === '') {
    return res.status(400).json({ message: 'Paid amount is required. Enter 0 if no amount is paid yet.' });
  }
  if (!Number.isFinite(total) || total <= 0) {
    return res.status(400).json({ message: 'Enter a valid total amount greater than 0.' });
  }
  const deposit = Number(deposit_amount) || 0;
  const paid = Number(paid_amount) || 0;
  if (total < 0 || deposit < 0 || paid < 0) {
    return res.status(400).json({ message: 'Payment amounts cannot be negative.' });
  }
  if (deposit > total) {
    return res.status(400).json({ message: 'Deposit cannot be greater than total amount.' });
  }
  if (paid > total) {
    return res.status(400).json({ message: 'Paid amount cannot be greater than total amount.' });
  }
  const balance = Math.max(0, total - paid);
  let paymentStatus = 'pending';
  if (total > 0 && paid >= total) paymentStatus = 'fully_paid';
  else if (deposit > 0 && paid >= deposit) paymentStatus = 'deposit_received';
  else if (paid > 0) paymentStatus = 'partially_paid';
  try {
    const duplicate = await pool.query(
      'SELECT id FROM clients WHERE user_id=$1 AND phone=$2 LIMIT 1',
      [userId, normalizePhone(phone)]
    );
    if (duplicate.rows.length) return res.status(409).json({ message: 'A client with this phone number already exists.' });

    const result = await pool.query(
      `INSERT INTO clients (user_id, name, phone, email, event_type, event_date, address, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [userId, String(name).trim(), normalizePhone(phone), email, event_type, String(event_date).split('T')[0], address, notes, status]
    );
    const client = result.rows[0];
    // Auto-create pipeline entry
    await pool.query('INSERT INTO pipeline (user_id, client_id, stage) VALUES ($1,$2,$3)', [userId, client.id, 'enquiry']);
    const paymentResult = await pool.query(
      `INSERT INTO payments
       (user_id, client_id, total_amount, deposit_amount, balance_amount, paid_amount, payment_status, payment_method, due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [userId, client.id, total, deposit, balance, paid, paymentStatus, payment_method, due_date || null]
    );
    await logActivity(userId, client.id, 'client_added', `New client ${name} added`);
    res.status(201).json({ ...client, ...paymentResult.rows[0], id: client.id, stage: 'enquiry' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/clients/:id
const updateClient = async (req, res) => {
  const { name, phone, email, event_type, event_date, address, notes, status } = req.body;
  const validationError = validateClientCore({ name, phone, event_type, event_date, status });
  if (validationError) return res.status(400).json({ message: validationError });
  try {
    const duplicate = await pool.query(
      'SELECT id FROM clients WHERE user_id=$1 AND phone=$2 AND id <> $3 LIMIT 1',
      [req.user.id, normalizePhone(phone), req.params.id]
    );
    if (duplicate.rows.length) return res.status(409).json({ message: 'A client with this phone number already exists.' });

    const result = await pool.query(
      `UPDATE clients SET name=$1, phone=$2, email=$3, event_type=$4, event_date=$5,
       address=$6, notes=$7, status=$8, updated_at=NOW()
       WHERE id=$9 AND user_id=$10 RETURNING *`,
      [String(name).trim(), normalizePhone(phone), email, event_type, String(event_date).split('T')[0], address, notes, status, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Client not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/clients/:id
const deleteClient = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM clients WHERE id=$1 AND user_id=$2 RETURNING name',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Client not found.' });
    res.json({ message: `Client "${result.rows[0].name}" deleted.` });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getClients, getClient, createClient, updateClient, deleteClient };
