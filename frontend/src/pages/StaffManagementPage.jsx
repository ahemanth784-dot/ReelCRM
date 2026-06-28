import { useCallback, useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, KeyRound, Loader2, X, ShieldCheck, UserCheck, UserX } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const blankForm = { fullName: '', email: '', username: '', password: '', confirmPassword: '', isActive: true };
const strongPasswordHelp = 'At least 8 chars with uppercase, lowercase, number, and symbol.';

function StaffModal({ staff, mode, onClose, onSave }) {
  const isEdit = mode === 'edit';
  const isPassword = mode === 'password';
  const [form, setForm] = useState(isEdit && staff ? {
    fullName: staff.fullName || staff.name || '',
    email: staff.email || '',
    username: staff.username || '',
    isActive: staff.isActive !== false,
    password: '',
    confirmPassword: ''
  } : blankForm);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    if (!isPassword && !form.fullName.trim()) return 'Full name is required.';
    if (!isPassword && !/\S+@\S+\.\S+/.test(form.email)) return 'Valid email is required.';
    if (!isEdit && !form.password) return 'Password is required.';
    if (!isEdit || isPassword) {
      if (form.password !== form.confirmPassword) return 'Passwords do not match.';
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(form.password)) return strongPasswordHelp;
    }
    return '';
  };

  const submit = async e => {
    e.preventDefault();
    const error = validate();
    if (error) { addToast(error, 'error'); return; }
    setLoading(true);
    try {
      if (isPassword) await api.patch(`/staff/${staff.id}/password`, { password: form.password, confirmPassword: form.confirmPassword });
      else if (isEdit) await api.put(`/staff/${staff.id}`, form);
      else await api.post('/staff', form);
      addToast(isPassword ? 'Password reset successfully' : `Staff ${isEdit ? 'updated' : 'created'} successfully`, 'success');
      onSave();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save staff', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-slide-up" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2 className="modal-title">{isPassword ? 'Reset Staff Password' : isEdit ? 'Edit Staff' : 'Create Staff'}</h2>
          <button onClick={onClose} className="btn btn-icon btn-secondary"><X size={18}/></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {!isPassword && (
              <>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="label">Full Name *</label>
                  <input className="input" value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="label">Email *</label>
                  <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="label">Username</label>
                  <input className="input" value={form.username} onChange={e => set('username', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="label">Role</label>
                  <input className="input" value="staff" disabled style={{ opacity: 0.65, cursor: 'not-allowed' }} />
                  <span className="field-hint">Role is fixed and cannot be changed.</span>
                </div>
                {isEdit && (
                  <div className="form-group">
                    <label className="label">Account Status</label>
                    <select className="input" value={form.isActive ? 'active' : 'inactive'} onChange={e => set('isActive', e.target.value === 'active')}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
              </>
            )}
            {(!isEdit || isPassword) && (
              <>
                <div className="form-group">
                  <label className="label">Password *</label>
                  <input className="input" type="password" value={form.password} onChange={e => set('password', e.target.value)} required />
                  <span className="field-hint">{strongPasswordHelp}</span>
                </div>
                <div className="form-group">
                  <label className="label">Confirm Password *</label>
                  <input className="input" type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
                </div>
              </>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading && <Loader2 size={16} className="animate-spin"/>}Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const { addToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/staff');
      setStaff(res.data.staff || []);
    } catch (err) {
      setStaff([]);
      addToast(err.response?.data?.message || 'Failed to load staff', 'error');
    } finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const close = () => { setModal(null); setSelected(null); };
  const saved = () => { close(); load(); };

  const remove = async member => {
    if (!window.confirm(`Delete staff member ${member.fullName || member.name}?`)) return;
    try {
      await api.delete(`/staff/${member.id}`);
      addToast('Staff member deleted', 'success');
      load();
    } catch (err) { addToast(err.response?.data?.message || 'Failed to delete staff', 'error'); }
  };

  return (
    <div style={{ padding: '16px 20px 40px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="page-subtitle">Create staff accounts and control access. Staff role is fixed and cannot be promoted from here.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}><Plus size={18}/>Create Staff</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Loader2 className="animate-spin" size={34} color="var(--primary)"/></div>
      ) : staff.length === 0 ? (
        <div className="empty-state"><ShieldCheck size={48}/><h3>No staff accounts</h3><p>Create a staff account for your team.</p></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Username</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {staff.map(member => (
                <tr key={member.id}>
                  <td style={{ fontWeight: 700 }}>{member.fullName || member.name}</td>
                  <td>{member.email}</td>
                  <td>{member.username || '�'}</td>
                  <td><span className="badge badge-info">staff</span></td>
                  <td>{member.isActive ? <span className="badge badge-success"><UserCheck size={12}/> Active</span> : <span className="badge badge-danger"><UserX size={12}/> Inactive</span>}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="btn btn-icon btn-secondary btn-sm" title="Edit" onClick={() => { setSelected(member); setModal('edit'); }}><Edit2 size={15}/></button>
                      <button className="btn btn-icon btn-secondary btn-sm" title="Reset Password" onClick={() => { setSelected(member); setModal('password'); }}><KeyRound size={15}/></button>
                      <button className="btn btn-icon btn-sm" title="Delete" onClick={() => remove(member)} style={{ background:'rgba(239,68,68,0.1)', color:'#EF4444', border:'1px solid rgba(239,68,68,0.2)' }}><Trash2 size={15}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && <StaffModal mode={modal} staff={selected} onClose={close} onSave={saved} />}
    </div>
  );
}
