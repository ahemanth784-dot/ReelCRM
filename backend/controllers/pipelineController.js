const pool = require('../db');

const logActivity = async (userId, clientId, type, description) => {
  try { await pool.query('INSERT INTO activities (user_id,client_id,type,description) VALUES ($1,$2,$3,$4)', [userId, clientId||null, type, description]); } catch(e){}
};

const STAGES = ['enquiry','confirmed','shoot_scheduled','editing','delivered'];

// GET /api/pipeline
const getPipeline = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pip.id, pip.stage, pip.notes, pip.updated_at,
              c.id as client_id, c.name, c.event_type, c.event_date, c.phone,
              p.payment_status, p.total_amount, p.paid_amount
       FROM pipeline pip
       JOIN clients c ON c.id = pip.client_id
       LEFT JOIN payments p ON p.client_id = c.id
       WHERE pip.user_id = $1
       ORDER BY pip.updated_at DESC`,
      [req.user.id]
    );
    // Group by stage
    const board = {};
    STAGES.forEach(s => board[s] = []);
    result.rows.forEach(row => { if(board[row.stage]) board[row.stage].push(row); });
    res.json({ board, stages: STAGES });
  } catch(err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
};

// PUT /api/pipeline/:id/stage
const updateStage = async (req, res) => {
  const { stage } = req.body;
  if (!STAGES.includes(stage)) return res.status(400).json({ message: 'Invalid stage.' });
  try {
    const result = await pool.query(
      'UPDATE pipeline SET stage=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3 RETURNING *, (SELECT name FROM clients WHERE id=pipeline.client_id) as client_name',
      [stage, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Pipeline entry not found.' });
    const row = result.rows[0];
    await logActivity(req.user.id, row.client_id, 'stage_updated', `${row.client_name} moved to ${stage.replace('_',' ')}`);
    res.json(result.rows[0]);
  } catch(err) { res.status(500).json({ message: 'Server error.' }); }
};

// PATCH /api/pipeline/client/:clientId/stage
const updateClientStage = async (req, res) => {
  const { stage } = req.body;
  if (!STAGES.includes(stage)) return res.status(400).json({ message: 'Invalid stage.' });

  try {
    const result = await pool.query(
      `UPDATE pipeline SET stage=$1, updated_at=NOW()
       WHERE client_id=$2 AND user_id=$3
       RETURNING *, (SELECT name FROM clients WHERE id=pipeline.client_id) as client_name`,
      [stage, req.params.clientId, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Pipeline entry not found.' });
    const row = result.rows[0];
    await logActivity(req.user.id, row.client_id, 'stage_updated', `${row.client_name} moved to ${stage.replace(/_/g,' ')}`);
    res.json(row);
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getPipeline, updateStage, updateClientStage };
