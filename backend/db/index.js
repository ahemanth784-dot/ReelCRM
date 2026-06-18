const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

let pool;
let isMock = false;

// In-memory tables to mimic PostgreSQL state in local dev/demo mode
const users = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@thereelshoot.com',
    password: bcrypt.hashSync('Admin@123', 10),
    role: 'admin',
    studio_name: 'thereelshoot Studio',
    studio_phone: '+91 98765 43210',
    studio_address: 'Bandra West, Mumbai, Maharashtra 400050',
    avatar_url: '',
    created_at: new Date(),
    updated_at: new Date()
  }
];

const clients = [
  { id: 1, user_id: 1, name: 'Priya Sharma', phone: '+91 98001 11111', email: 'priya@example.com', event_type: 'Wedding', event_date: '2026-07-15', address: 'Mumbai', notes: 'Traditional coverage', status: 'active', created_at: new Date(), updated_at: new Date() },
  { id: 2, user_id: 1, name: 'Rahul & Meena Verma', phone: '+91 98001 22222', email: 'rahul@example.com', event_type: 'Wedding', event_date: '2026-07-28', address: 'Alibaug', notes: 'Couple portraits', status: 'active', created_at: new Date(), updated_at: new Date() },
  { id: 3, user_id: 1, name: 'Ananya Krishnan', phone: '+91 98001 33333', email: 'ananya@example.com', event_type: 'Maternity', event_date: '2026-06-30', address: 'Pune', notes: 'Outdoor shoot', status: 'active', created_at: new Date(), updated_at: new Date() },
  { id: 4, user_id: 1, name: 'Rohan Mehta', phone: '+91 98001 44444', email: 'rohan@example.com', event_type: 'Pre-Wedding', event_date: '2026-07-05', address: 'Goa', notes: 'Beach shoot', status: 'active', created_at: new Date(), updated_at: new Date() },
  { id: 5, user_id: 1, name: 'hemanth', phone: '+916309981270', email: 'ahemanth784@gmail.com', event_type: 'Engagement', event_date: '2026-05-04', address: '', notes: '', status: 'active', created_at: new Date('2026-06-18'), updated_at: new Date('2026-06-18') },
  { id: 6, user_id: 1, name: 'hemanth', phone: '+916309981270', email: 'ahemanth784@gmail.com', event_type: 'Wedding', event_date: '2026-07-20', address: '', notes: '', status: 'active', created_at: new Date('2026-06-19'), updated_at: new Date('2026-06-19') }
];

const leads = [
  { id: 1, user_id: 1, name: 'Sanjana Pillai', phone: '+91 90001 11111', email: 'sanjana@example.com', event_type: 'Wedding', event_date: '2026-10-15', budget: 80000, source: 'Instagram', notes: 'Interested in outdoor package', status: 'new', created_at: new Date(), updated_at: new Date() },
  { id: 2, user_id: 1, name: 'Mohit & Preeti Agarwal', phone: '+91 90001 22222', email: 'mohit@example.com', event_type: 'Wedding', event_date: '2026-11-20', budget: 120000, source: 'Referral', notes: 'Inquired on call', status: 'contacted', created_at: new Date(), updated_at: new Date() }
];

const pipeline = [
  { id: 1, user_id: 1, client_id: 1, stage: 'shoot_scheduled', notes: '', created_at: new Date(), updated_at: new Date() },
  { id: 2, user_id: 1, client_id: 2, stage: 'confirmed', notes: '', created_at: new Date(), updated_at: new Date() },
  { id: 3, user_id: 1, client_id: 3, stage: 'editing', notes: '', created_at: new Date(), updated_at: new Date() },
  { id: 4, user_id: 1, client_id: 4, stage: 'confirmed', notes: '', created_at: new Date(), updated_at: new Date() },
  { id: 5, user_id: 1, client_id: 5, stage: 'enquiry', notes: '', created_at: new Date(), updated_at: new Date() },
  { id: 6, user_id: 1, client_id: 6, stage: 'enquiry', notes: '', created_at: new Date(), updated_at: new Date() }
];

const payments = [
  { id: 1, user_id: 1, client_id: 1, total_amount: 85000, deposit_amount: 42500, balance_amount: 42500, paid_amount: 42500, payment_status: 'deposit_received', due_date: '2026-07-01', created_at: new Date(), updated_at: new Date() },
  { id: 2, user_id: 1, client_id: 2, total_amount: 120000, deposit_amount: 50000, balance_amount: 70000, paid_amount: 50000, payment_status: 'deposit_received', due_date: '2026-07-10', created_at: new Date(), updated_at: new Date() },
  { id: 3, user_id: 1, client_id: 3, total_amount: 28000, deposit_amount: 10000, balance_amount: 0, paid_amount: 28000, payment_status: 'fully_paid', due_date: '2026-06-15', created_at: new Date(), updated_at: new Date() },
  { id: 4, user_id: 1, client_id: 4, total_amount: 45000, deposit_amount: 20000, balance_amount: 0, paid_amount: 45000, payment_status: 'fully_paid', due_date: '2026-06-25', created_at: new Date(), updated_at: new Date() },
  { id: 5, user_id: 1, client_id: 5, total_amount: 0, deposit_amount: 0, balance_amount: 0, paid_amount: 0, payment_status: 'fully_paid', due_date: null, created_at: new Date(), updated_at: new Date() },
  { id: 6, user_id: 1, client_id: 6, total_amount: 0, deposit_amount: 0, balance_amount: 0, paid_amount: 0, payment_status: 'pending', due_date: null, created_at: new Date(), updated_at: new Date() }
];

const activities = [
  { id: 1, user_id: 1, client_id: 1, type: 'client_added', description: 'New client Priya Sharma added', created_at: new Date(Date.now() - 3600000 * 2) },
  { id: 2, user_id: 1, client_id: 3, type: 'payment_received', description: 'Full payment ₹28,000 received from Ananya Krishnan', created_at: new Date(Date.now() - 600000) }
];

if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('user:password')) {
  // Use real PostgreSQL
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL');
  });

  pool.on('error', (err) => {
    console.error('❌ PostgreSQL pool error:', err);
    process.exit(-1);
  });
} else {
  // Fall back to SQLite-like mock query parser
  isMock = true;
  console.log('⚠️ No DATABASE_URL found. Running with in-memory Mock database (Default login: admin@thereelshoot.com / Admin@123).');

  const mockQuery = async (text, params = []) => {
    const sql = text.trim().replace(/\s+/g, ' ');
    const sqlLower = sql.toLowerCase();

    // -- Auth --
    if (sqlLower.includes('select id from users where email = $1') || sqlLower.includes('select id from users where email=$1')) {
      const email = params[0];
      const user = users.find(u => u.email === email);
      return { rows: user ? [{ id: user.id }] : [] };
    }
    
    if (sqlLower.includes('insert into users')) {
      const [name, email, password] = params;
      const newUser = {
        id: users.length + 1,
        name,
        email,
        password,
        role: 'admin',
        studio_name: 'thereelshoot Studio',
        studio_phone: '',
        studio_address: '',
        avatar_url: '',
        created_at: new Date(),
        updated_at: new Date()
      };
      users.push(newUser);
      return { rows: [newUser] };
    }

    if (sqlLower.includes('select * from users where email = $1') || sqlLower.includes('select * from users where email=$1')) {
      const email = params[0];
      const user = users.find(u => u.email === email);
      return { rows: user ? [user] : [] };
    }

    if (sqlLower.includes('select id, name, email, role, studio_name, studio_phone, studio_address, avatar_url, created_at from users where id = $1') ||
        sqlLower.includes('select id,name,email,role,studio_name,studio_phone,studio_address,avatar_url,created_at from users where id=$1')) {
      const id = params[0];
      const user = users.find(u => u.id === Number(id));
      return { rows: user ? [user] : [] };
    }

    if (sqlLower.includes('select password from users where id=$1')) {
      const id = params[0];
      const user = users.find(u => u.id === Number(id));
      return { rows: user ? [{ password: user.password }] : [] };
    }

    if (sqlLower.includes('update users set password=$1')) {
      const [password, id] = params;
      const idx = users.findIndex(u => u.id === Number(id));
      if (idx !== -1) users[idx].password = password;
      return { rows: [] };
    }

    if (sqlLower.includes('update users set name=$1')) {
      const [name, studio_name, studio_phone, studio_address, id] = params;
      const idx = users.findIndex(u => u.id === Number(id));
      if (idx !== -1) {
        users[idx].name = name;
        users[idx].studio_name = studio_name;
        users[idx].studio_phone = studio_phone;
        users[idx].studio_address = studio_address;
      }
      return { rows: [users[idx]] };
    }

    // -- Clients --
    const filterMockClients = (query, queryParams) => {
      let paramIndex = 1;
      let filtered = clients.filter(c => c.user_id === Number(queryParams[0]));

      if (query.includes(' ilike ')) {
        const search = String(queryParams[paramIndex++] || '').replace(/%/g, '').toLowerCase();
        filtered = filtered.filter(c =>
          (c.name && c.name.toLowerCase().includes(search)) ||
          (c.phone && c.phone.toLowerCase().includes(search)) ||
          (c.email && c.email.toLowerCase().includes(search))
        );
      }
      if (query.includes('c.event_type = $')) {
        const eventType = queryParams[paramIndex++];
        filtered = filtered.filter(c => c.event_type === eventType);
      }
      if (query.includes('c.status = $')) {
        const status = queryParams[paramIndex++];
        filtered = filtered.filter(c => c.status === status);
      }

      return { filtered, paramIndex };
    };

    if (sqlLower.includes('select count(*) from clients c')) {
      const { filtered } = filterMockClients(sqlLower, params);
      return { rows: [{ count: filtered.length.toString() }] };
    }

    if (sqlLower.includes('select c.*, p.payment_status') && sqlLower.includes('from clients c') && !sqlLower.includes('where c.id = $1')) {
      const { filtered: matched, paramIndex } = filterMockClients(sqlLower, params);
      const sortMatch = sqlLower.match(/order by c\.(name|event_date|created_at|event_type) (asc|desc)/);
      const sortColumn = sortMatch?.[1] || 'created_at';
      const direction = sortMatch?.[2] === 'asc' ? 1 : -1;
      const limit = Number(params[paramIndex] ?? matched.length);
      const offset = Number(params[paramIndex + 1] ?? 0);

      const filtered = [...matched].sort((a, b) => {
        const left = a[sortColumn] == null ? '' : String(a[sortColumn]).toLowerCase();
        const right = b[sortColumn] == null ? '' : String(b[sortColumn]).toLowerCase();
        return left.localeCompare(right) * direction;
      }).slice(offset, offset + limit);

      const res = filtered.map(c => {
        const pay = payments.find(p => p.client_id === c.id) || {};
        const pip = pipeline.find(p => p.client_id === c.id) || {};
        return {
          ...c,
          payment_status: pay.payment_status || 'pending',
          total_amount: pay.total_amount || 0,
          paid_amount: pay.paid_amount || 0,
          stage: pip.stage || 'enquiry'
        };
      });
      return { rows: res };
    }

    if (sqlLower.includes('select c.*, p.payment_status') && sqlLower.includes('where c.id = $1')) {
      const clientId = params[0];
      const client = clients.find(c => c.id === Number(clientId) && c.user_id === Number(params[1]));
      if (!client) return { rows: [] };
      const pay = payments.find(p => p.client_id === client.id) || {};
      const pip = pipeline.find(p => p.client_id === client.id) || {};
      return {
        rows: [{
          ...client,
          payment_status: pay.payment_status || 'pending',
          total_amount: pay.total_amount || 0,
          deposit_amount: pay.deposit_amount || 0,
          balance_amount: pay.balance_amount || 0,
          paid_amount: pay.paid_amount || 0,
          stage: pip.stage || 'enquiry'
        }]
      };
    }

    if (sqlLower.includes('insert into clients')) {
      const [user_id, name, phone, email, event_type, event_date, address, notes, status] = params;
      const newClient = {
        id: clients.length + 1,
        user_id: Number(user_id),
        name,
        phone,
        email,
        event_type,
        event_date,
        address,
        notes,
        status: status || 'active',
        created_at: new Date(),
        updated_at: new Date()
      };
      clients.push(newClient);
      return { rows: [newClient] };
    }

    if (sqlLower.includes('update clients set name=$1')) {
      const [name, phone, email, event_type, event_date, address, notes, status, id, user_id] = params;
      const idx = clients.findIndex(c => c.id === Number(id) && c.user_id === Number(user_id));
      if (idx === -1) return { rows: [] };
      clients[idx] = {
        ...clients[idx],
        name, phone, email, event_type, event_date, address, notes, status,
        updated_at: new Date()
      };
      return { rows: [clients[idx]] };
    }

    if (sqlLower.includes('delete from clients where id=$1')) {
      const [id, user_id] = params;
      const idx = clients.findIndex(c => c.id === Number(id) && c.user_id === Number(user_id));
      if (idx === -1) return { rows: [] };
      const name = clients[idx].name;
      clients.splice(idx, 1);
      return { rows: [{ name }] };
    }

    // -- Pipeline --
    if (sqlLower.includes('insert into pipeline')) {
      const [user_id, client_id, stage] = params;
      const newPip = {
        id: pipeline.length + 1,
        user_id: Number(user_id),
        client_id: Number(client_id),
        stage: stage || 'enquiry',
        notes: '',
        created_at: new Date(),
        updated_at: new Date()
      };
      pipeline.push(newPip);
      return { rows: [newPip] };
    }

    if (sqlLower.includes('select pip.id, pip.stage') && sqlLower.includes('from pipeline pip')) {
      const userId = params[0];
      const res = pipeline.filter(p => p.user_id === Number(userId)).map(p => {
        const c = clients.find(cl => cl.id === p.client_id) || {};
        const pay = payments.find(py => py.client_id === p.client_id) || {};
        return {
          id: p.id,
          stage: p.stage,
          notes: p.notes,
          updated_at: p.updated_at,
          client_id: p.client_id,
          name: c.name,
          event_type: c.event_type,
          event_date: c.event_date,
          phone: c.phone,
          payment_status: pay.payment_status || 'pending',
          total_amount: pay.total_amount || 0,
          paid_amount: pay.paid_amount || 0
        };
      });
      return { rows: res };
    }

    if (sqlLower.includes('update pipeline set stage=$1')) {
      if (sqlLower.includes('where client_id=$2')) {
        const [stage, client_id, user_id] = params;
        const idx = pipeline.findIndex(p => p.client_id === Number(client_id) && p.user_id === Number(user_id));
        if (idx === -1) return { rows: [] };
        pipeline[idx].stage = stage;
        pipeline[idx].updated_at = new Date();
        const c = clients.find(cl => cl.id === pipeline[idx].client_id) || {};
        return { rows: [{ ...pipeline[idx], client_name: c.name }] };
      }

      const [stage, id, user_id] = params;
      const idx = pipeline.findIndex(p => p.id === Number(id) && p.user_id === Number(user_id));
      if (idx === -1) return { rows: [] };
      pipeline[idx].stage = stage;
      pipeline[idx].updated_at = new Date();
      const c = clients.find(cl => cl.id === pipeline[idx].client_id) || {};
      return { rows: [{ ...pipeline[idx], client_name: c.name }] };
    }

    // -- Payments --
    const filterMockPayments = (query, queryParams) => {
      let paramIndex = 1;
      let filtered = payments.filter(p => p.user_id === Number(queryParams[0]));

      if (query.includes('c.name ilike')) {
        const search = String(queryParams[paramIndex++] || '').replace(/%/g, '').toLowerCase();
        filtered = filtered.filter(payment => {
          const client = clients.find(c => c.id === payment.client_id);
          return client?.name?.toLowerCase().includes(search);
        });
      }
      if (query.includes('p.payment_status=$')) {
        const paymentStatus = queryParams[paramIndex++];
        filtered = filtered.filter(payment => payment.payment_status === paymentStatus);
      }

      return { filtered, paramIndex };
    };

    if (sqlLower.includes('select count(*) from payments p join clients c')) {
      const { filtered } = filterMockPayments(sqlLower, params);
      return { rows: [{ count: filtered.length.toString() }] };
    }

    if (sqlLower.includes('select p.*, c.name as client_name') && sqlLower.includes('where p.client_id=$1')) {
      const payment = payments.find(p => p.client_id === Number(params[0]) && p.user_id === Number(params[1]));
      if (!payment) return { rows: [] };
      const client = clients.find(c => c.id === payment.client_id) || {};
      return { rows: [{ ...payment, client_name: client.name }] };
    }

    if (sqlLower.includes('select p.*, c.name as client_name') && sqlLower.includes('from payments p')) {
      const { filtered, paramIndex } = filterMockPayments(sqlLower, params);
      const limit = Number(params[paramIndex] ?? filtered.length);
      const offset = Number(params[paramIndex + 1] ?? 0);
      const rows = [...filtered]
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(offset, offset + limit)
        .map(payment => {
          const client = clients.find(c => c.id === payment.client_id) || {};
          return {
            ...payment,
            client_name: client.name,
            event_type: client.event_type,
            event_date: client.event_date,
            phone: client.phone
          };
        });
      return { rows };
    }

    if (sqlLower.includes('insert into payments')) {
      const [
        user_id, client_id, total_amount = 0, deposit_amount = 0, balance_amount = 0,
        paid_amount = 0, payment_status = 'pending', payment_method = '', due_date = null
      ] = params;
      const newPay = {
        id: payments.length + 1,
        user_id: Number(user_id),
        client_id: Number(client_id),
        total_amount: Number(total_amount),
        deposit_amount: Number(deposit_amount),
        balance_amount: Number(balance_amount),
        paid_amount: Number(paid_amount),
        payment_status,
        payment_method: payment_method || '',
        notes: '',
        due_date,
        created_at: new Date(),
        updated_at: new Date()
      };
      payments.push(newPay);
      return { rows: [newPay] };
    }

    if (sqlLower.includes('update payments set total_amount=$1')) {
      const [total_amount, deposit_amount, balance_amount, paid_amount, payment_status, payment_method, notes, due_date, client_id, user_id] = params;
      const idx = payments.findIndex(p => p.client_id === Number(client_id) && p.user_id === Number(user_id));
      if (idx === -1) return { rows: [] };
      payments[idx] = {
        ...payments[idx],
        total_amount, deposit_amount, balance_amount, paid_amount, payment_status, payment_method, due_date, notes,
        updated_at: new Date()
      };
      return { rows: [payments[idx]] };
    }

    if (sqlLower.includes('update payments set payment_status=$1')) {
      const [payment_status, client_id, user_id] = params;
      const idx = payments.findIndex(p => p.client_id === Number(client_id) && p.user_id === Number(user_id));
      if (idx === -1) return { rows: [] };
      payments[idx] = {
        ...payments[idx],
        payment_status,
        updated_at: new Date()
      };
      return { rows: [payments[idx]] };
    }

    // -- Leads --
    const filterMockLeads = (query, queryParams) => {
      let paramIndex = 1;
      let filtered = leads.filter(lead => lead.user_id === Number(queryParams[0]));

      if (query.includes(' ilike ')) {
        const search = String(queryParams[paramIndex++] || '').replace(/%/g, '').toLowerCase();
        filtered = filtered.filter(lead =>
          lead.name?.toLowerCase().includes(search) ||
          lead.phone?.toLowerCase().includes(search) ||
          lead.email?.toLowerCase().includes(search)
        );
      }
      if (query.includes('status = $')) {
        const status = queryParams[paramIndex++];
        filtered = filtered.filter(lead => lead.status === status);
      }

      return { filtered, paramIndex };
    };

    if (sqlLower.includes('select status, count(*) as count from leads')) {
      const userLeads = leads.filter(lead => lead.user_id === Number(params[0]));
      const grouped = userLeads.reduce((counts, lead) => {
        counts[lead.status] = (counts[lead.status] || 0) + 1;
        return counts;
      }, {});
      return { rows: Object.entries(grouped).map(([status, count]) => ({ status, count: count.toString() })) };
    }

    if (sqlLower.includes('select count(*) from leads where')) {
      const { filtered } = filterMockLeads(sqlLower, params);
      return { rows: [{ count: filtered.length.toString() }] };
    }

    if (sqlLower.includes('select * from leads where id=$1')) {
      const lead = leads.find(item => item.id === Number(params[0]) && item.user_id === Number(params[1]));
      return { rows: lead ? [lead] : [] };
    }

    if (sqlLower.includes('select * from leads where')) {
      const { filtered, paramIndex } = filterMockLeads(sqlLower, params);
      const limit = Number(params[paramIndex] ?? filtered.length);
      const offset = Number(params[paramIndex + 1] ?? 0);
      const rows = [...filtered]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(offset, offset + limit);
      return { rows };
    }

    if (sqlLower.includes('insert into leads')) {
      const [user_id, name, phone, email, event_type, event_date, budget, source, notes, status = 'new'] = params;
      const newLead = {
        id: Math.max(0, ...leads.map(lead => lead.id)) + 1,
        user_id: Number(user_id),
        name, phone, email, event_type, event_date,
        budget: Number(budget || 0),
        source, notes,
        status,
        created_at: new Date(),
        updated_at: new Date()
      };
      leads.push(newLead);
      return { rows: [newLead] };
    }

    if (sqlLower.includes('update leads set name=$1')) {
      const [name, phone, email, event_type, event_date, budget, source, notes, status, id, user_id] = params;
      const idx = leads.findIndex(l => l.id === Number(id) && l.user_id === Number(user_id));
      if (idx === -1) return { rows: [] };
      leads[idx] = {
        ...leads[idx],
        name, phone, email, event_type, event_date, budget, source, notes, status,
        updated_at: new Date()
      };
      return { rows: [leads[idx]] };
    }

    if (sqlLower.includes('delete from leads where id=$1')) {
      const [id, user_id] = params;
      const idx = leads.findIndex(l => l.id === Number(id) && l.user_id === Number(user_id));
      if (idx === -1) return { rows: [] };
      const name = leads[idx].name;
      leads.splice(idx, 1);
      return { rows: [{ name }] };
    }

    // -- Calendar --
    if (sqlLower.includes('select c.id, c.name as client_name')) {
      const userId = params[0];
      const res = clients.filter(c => c.user_id === Number(userId)).map(c => ({
        id: c.id,
        client_name: c.name,
        event_type: c.event_type,
        event_date: c.event_date,
        title: `${c.name} (${c.event_type})`
      }));
      return { rows: res };
    }

    // -- Activities --
    if (sqlLower.includes('insert into activities')) {
      const [user_id, client_id, type, description] = params;
      const newAct = {
        id: activities.length + 1,
        user_id: Number(user_id),
        client_id: client_id ? Number(client_id) : null,
        type,
        description,
        created_at: new Date()
      };
      activities.push(newAct);
      return { rows: [newAct] };
    }

    if (sqlLower.includes('select a.*, c.name as client_name from activities a')) {
      const userId = params[0];
      const res = activities
        .filter(a => a.user_id === Number(userId))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 20)
        .map(a => {
          const c = clients.find(cl => cl.id === a.client_id) || {};
          return {
            ...a,
            client_name: c.name
          };
        });
      return { rows: res };
    }

    // -- Reports --
    if (sqlLower.includes('select count(*) as "totalclients", count(case when status=\'active\' then 1 end) as "activeprojects" from clients')) {
      const userId = params[0];
      const userClients = clients.filter(c => c.user_id === Number(userId));
      const active = userClients.filter(c => c.status === 'active').length;
      return { rows: [{ totalClients: userClients.length, activeProjects: active }] };
    }

    if (sqlLower.includes('select count(*) as count, stage from pipeline where user_id=$1 group by stage')) {
      const userId = params[0];
      const userPip = pipeline.filter(p => p.user_id === Number(userId));
      const grouped = {};
      STAGES = ['enquiry', 'confirmed', 'shoot_scheduled', 'editing', 'delivered'];
      STAGES.forEach(s => grouped[s] = 0);
      userPip.forEach(p => { if (grouped[p.stage] !== undefined) grouped[p.stage]++; });
      const rows = Object.keys(grouped).map(s => ({ stage: s, count: grouped[s] }));
      return { rows };
    }

    if (sqlLower.includes('select count(*) as count, to_char(created_at')) {
      const months = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026'];
      const rows = months.map((m, idx) => ({ month: m, count: idx === 5 ? leads.length : 3 + idx }));
      return { rows };
    }

    if (sqlLower.includes('select sum(paid_amount) as collected, sum(total_amount) as total')) {
      const months = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026'];
      const totalCollected = payments.reduce((acc, curr) => acc + Number(curr.paid_amount || 0), 0);
      const totalBooked = payments.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);
      
      const rows = months.map((m, idx) => ({
        month: m,
        collected: idx === 5 ? totalCollected : 80000 + idx * 15000,
        total: idx === 5 ? totalBooked : 100000 + idx * 15000
      }));
      return { rows };
    }

    return { rows: [] };
  };

  pool = {
    query: mockQuery,
    on: () => {}
  };
}

module.exports = pool;
