const pool = require('../db');

// GET /api/reports/revenue
const getRevenueReport = async (req, res) => {
  try {
    const monthly = await pool.query(
      `SELECT TO_CHAR(c.event_date,'Mon YYYY') as month,
              DATE_TRUNC('month',c.event_date) as month_date,
              SUM(p.total_amount) as total,
              SUM(p.paid_amount) as collected
       FROM payments p
       JOIN clients c ON c.id=p.client_id
       WHERE p.user_id=$1 AND c.event_date IS NOT NULL
       GROUP BY month, month_date ORDER BY month_date ASC LIMIT 12`,
      [req.user.id]
    );
    res.json(monthly.rows);
  } catch(err) { res.status(500).json({ message:'Server error.' }); }
};

// GET /api/reports/projects
const getProjectReport = async (req, res) => {
  try {
    const byType = await pool.query(
      `SELECT event_type, COUNT(*) as count FROM clients WHERE user_id=$1 AND event_type IS NOT NULL GROUP BY event_type ORDER BY count DESC`,
      [req.user.id]
    );
    const byStage = await pool.query(
      `SELECT stage, COUNT(*) as count FROM pipeline WHERE user_id=$1 GROUP BY stage`,
      [req.user.id]
    );
    res.json({ byType: byType.rows, byStage: byStage.rows });
  } catch(err) { res.status(500).json({ message:'Server error.' }); }
};

// GET /api/reports/leads
const getLeadsReport = async (req, res) => {
  try {
    const byStatus = await pool.query(
      `SELECT status, COUNT(*) as count FROM leads WHERE user_id=$1 GROUP BY status`,
      [req.user.id]
    );
    const monthly = await pool.query(
      `SELECT TO_CHAR(created_at,'Mon YYYY') as month, DATE_TRUNC('month',created_at) as month_date, COUNT(*) as count
       FROM leads WHERE user_id=$1
       GROUP BY month, month_date ORDER BY month_date ASC LIMIT 12`,
      [req.user.id]
    );
    res.json({ byStatus: byStatus.rows, monthly: monthly.rows });
  } catch(err) { res.status(500).json({ message:'Server error.' }); }
};

// GET /api/reports/dashboard-stats
const getDashboardStats = async (req, res) => {
  const uid = req.user.id;
  try {
    const [clients, activeProjects, upcoming, pending, revenue, outstanding, activities] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM clients WHERE user_id=$1', [uid]),
      pool.query("SELECT COUNT(*) FROM pipeline WHERE user_id=$1 AND stage NOT IN ('delivered')", [uid]),
      pool.query("SELECT COUNT(*) FROM clients WHERE user_id=$1 AND event_date >= CURRENT_DATE AND event_date <= CURRENT_DATE + INTERVAL '30 days'", [uid]),
      pool.query("SELECT COUNT(*) FROM pipeline WHERE user_id=$1 AND stage='editing'", [uid]),
      pool.query("SELECT COALESCE(SUM(paid_amount),0) as revenue FROM payments WHERE user_id=$1 AND updated_at >= DATE_TRUNC('month', NOW())", [uid]),
      pool.query("SELECT COALESCE(SUM(balance_amount),0) as outstanding FROM payments WHERE user_id=$1 AND payment_status != 'fully_paid'", [uid]),
      pool.query("SELECT * FROM activities WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10", [uid]),
    ]);
    res.json({
      totalClients: parseInt(clients.rows[0].count),
      activeProjects: parseInt(activeProjects.rows[0].count),
      upcomingShoots: parseInt(upcoming.rows[0].count),
      pendingDeliveries: parseInt(pending.rows[0].count),
      revenueThisMonth: parseFloat(revenue.rows[0].revenue),
      outstandingPayments: parseFloat(outstanding.rows[0].outstanding),
      recentActivities: activities.rows,
    });
  } catch(err) { console.error(err); res.status(500).json({ message:'Server error.' }); }
};

// GET /api/reports/upcoming-shoots
const getUpcomingShoots = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id,c.name,c.event_type,c.event_date,c.phone,pip.stage,p.payment_status
       FROM clients c
       LEFT JOIN pipeline pip ON pip.client_id=c.id
       LEFT JOIN payments p ON p.client_id=c.id
       WHERE c.user_id=$1 AND c.event_date >= CURRENT_DATE
       ORDER BY c.event_date ASC LIMIT 10`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch(err) { res.status(500).json({ message:'Server error.' }); }
};

// GET /api/reports/pending-deliveries
const getPendingDeliveries = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id,c.name,c.event_type,c.event_date,pip.stage,
              CURRENT_DATE - c.event_date as delay_days
       FROM clients c
       JOIN pipeline pip ON pip.client_id=c.id
       WHERE c.user_id=$1 AND pip.stage='editing' AND c.event_date < CURRENT_DATE
       ORDER BY c.event_date ASC LIMIT 10`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch(err) { res.status(500).json({ message:'Server error.' }); }
};

module.exports = { getRevenueReport, getProjectReport, getLeadsReport, getDashboardStats, getUpcomingShoots, getPendingDeliveries };
