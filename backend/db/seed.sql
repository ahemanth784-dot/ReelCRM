-- Seed data for ReelCRM
-- Run AFTER schema.sql
-- This inserts a demo user and sample data

-- Demo user: email: admin@thereelshoot.com | password: Admin@123
INSERT INTO users (name, email, password, role, studio_name, studio_phone, studio_address)
VALUES (
  'Alex Morgan',
  'admin@thereelshoot.com',
  '$2b$10$Ur6zjsvUPLC9HcujbWF61.ZjfbJzoYNkN/vI3VaGQzPD7MruQtqiq',
  'admin',
  'thereelshoot',
  '+91 98765 43210',
  '42, Studio Lane, Bengaluru, Karnataka 560001'
) ON CONFLICT (email) DO NOTHING;

-- Sample clients
INSERT INTO clients (user_id, name, phone, email, event_type, event_date, address, notes, status) VALUES
(1, 'Priya Sharma', '+91 98001 11111', 'priya@example.com', 'Wedding', '2026-07-15', 'Mumbai, Maharashtra', 'VIP client, outdoor preferred', 'active'),
(1, 'Rahul & Meena Verma', '+91 98001 22222', 'rahul@example.com', 'Wedding', '2026-07-28', 'Delhi, NCR', 'Traditional ceremony + reception', 'active'),
(1, 'Ananya Krishnan', '+91 98001 33333', 'ananya@example.com', 'Maternity', '2026-06-30', 'Chennai, Tamil Nadu', 'Studio session + outdoor', 'active'),
(1, 'Rohan Mehta', '+91 98001 44444', 'rohan@example.com', 'Pre-Wedding', '2026-07-05', 'Jaipur, Rajasthan', 'Heritage location shoot', 'active'),
(1, 'Sunita & Deepak Patel', '+91 98001 55555', 'sunita@example.com', 'Wedding', '2026-08-10', 'Ahmedabad, Gujarat', 'Full day event coverage', 'active'),
(1, 'Kavya Reddy', '+91 98001 66666', 'kavya@example.com', 'Portraits', '2026-06-25', 'Hyderabad, Telangana', 'Corporate headshots + personal', 'active'),
(1, 'Arjun Singh', '+91 98001 77777', 'arjun@example.com', 'Engagement', '2026-07-20', 'Chandigarh, Punjab', 'Couple shoot at golden hour', 'active'),
(1, 'Neha & Vikram Joshi', '+91 98001 88888', 'neha@example.com', 'Wedding', '2026-09-14', 'Pune, Maharashtra', 'Destination wedding - Goa', 'active'),
(1, 'Tanvi Gupta', '+91 98001 99999', 'tanvi@example.com', 'Baby Shower', '2026-06-28', 'Bengaluru, Karnataka', 'Indoor studio setup', 'active'),
(1, 'Karthik Nair', '+91 98002 10000', 'karthik@example.com', 'Pre-Wedding', '2026-08-02', 'Kochi, Kerala', 'Backwaters theme shoot', 'active');

-- Sample leads
INSERT INTO leads (user_id, name, phone, email, event_type, event_date, budget, source, notes, status) VALUES
(1, 'Sanjana Pillai', '+91 90001 11111', 'sanjana@example.com', 'Wedding', '2026-10-15', 80000, 'Instagram', 'Interested in full day coverage', 'new'),
(1, 'Mohit & Preeti Agarwal', '+91 90001 22222', 'mohit@example.com', 'Wedding', '2026-11-20', 120000, 'Referral', 'Want drone shots included', 'contacted'),
(1, 'Divya Menon', '+91 90001 33333', 'divya@example.com', 'Maternity', '2026-07-30', 25000, 'Google', 'First time client', 'quoted'),
(1, 'Aarav Sharma', '+91 90001 44444', 'aarav@example.com', 'Corporate Event', '2026-08-22', 45000, 'LinkedIn', 'Annual company event', 'confirmed'),
(1, 'Sneha & Raj Kumar', '+91 90001 55555', 'sneha@example.com', 'Wedding', '2026-12-05', 95000, 'Instagram', 'Beach wedding in Goa', 'new'),
(1, 'Pooja Iyer', '+91 90001 66666', 'pooja@example.com', 'Portraits', '2026-07-10', 15000, 'Facebook', 'Actress portfolio shoot', 'cancelled');

-- Sample pipeline entries
INSERT INTO pipeline (user_id, client_id, stage, notes) VALUES
(1, 1, 'shoot_scheduled', 'Location finalized - Udaipur Palace'),
(1, 2, 'confirmed', 'Contract signed, 50% advance received'),
(1, 3, 'editing', 'Raw files processing complete'),
(1, 4, 'enquiry', 'Initial call done, awaiting confirmation'),
(1, 5, 'shoot_scheduled', 'Pre-shoot meeting on 5th July'),
(1, 6, 'delivered', 'Final gallery delivered via Google Drive'),
(1, 7, 'confirmed', 'Advance received, venue booked'),
(1, 8, 'enquiry', 'Destination wedding planning in progress'),
(1, 9, 'editing', 'Retouching in progress'),
(1, 10, 'shoot_scheduled', 'Travel arranged for Kerala');

-- Sample payments
INSERT INTO payments (user_id, client_id, total_amount, deposit_amount, balance_amount, paid_amount, payment_status, payment_method, due_date) VALUES
(1, 1, 85000, 42500, 42500, 42500, 'deposit_received', 'Bank Transfer', '2026-07-14'),
(1, 2, 95000, 47500, 47500, 47500, 'deposit_received', 'UPI', '2026-07-27'),
(1, 3, 28000, 14000, 14000, 28000, 'fully_paid', 'Cash', '2026-06-29'),
(1, 4, 55000, 27500, 27500, 55000, 'fully_paid', 'Bank Transfer', '2026-07-04'),
(1, 5, 110000, 55000, 55000, 55000, 'deposit_received', 'Cheque', '2026-08-09'),
(1, 6, 18000, 9000, 9000, 9000, 'deposit_received', 'UPI', '2026-06-24'),
(1, 7, 42000, 21000, 21000, 42000, 'fully_paid', 'Bank Transfer', '2026-07-19'),
(1, 8, 150000, 75000, 75000, 30000, 'partially_paid', 'UPI', '2026-09-13'),
(1, 9, 22000, 11000, 11000, 11000, 'deposit_received', 'Cash', '2026-06-27'),
(1, 10, 65000, 32500, 32500, 65000, 'fully_paid', 'Bank Transfer', '2026-08-01');

-- Sample activities
INSERT INTO activities (user_id, client_id, type, description) VALUES
(1, 1, 'client_added', 'New wedding client Priya Sharma added'),
(1, 3, 'payment_received', 'Full payment of ₹28,000 received from Ananya Krishnan'),
(1, 6, 'delivery', 'Final gallery delivered to Kavya Reddy'),
(1, 7, 'payment_received', 'Full payment of ₹42,000 received from Arjun Singh'),
(1, 2, 'contract_signed', 'Contract signed with Rahul & Meena Verma'),
(1, 5, 'stage_updated', 'Sunita & Deepak Patel moved to Shoot Scheduled'),
(1, 4, 'payment_received', 'Full payment received from Rohan Mehta'),
(1, NULL, 'lead_added', 'New lead from Instagram - Sanjana Pillai'),
(1, 9, 'stage_updated', 'Tanvi Gupta moved to Editing stage'),
(1, 10, 'client_added', 'New pre-wedding client Karthik Nair added');
