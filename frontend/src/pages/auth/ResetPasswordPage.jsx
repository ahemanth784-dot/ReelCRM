import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, Lock, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import api from '../../api/axios';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const set = (key, value) => {
    setForm(current => ({ ...current, [key]: value }));
    setError('');
  };

  const validate = () => {
    if (!token) return 'Reset token is missing. Please request a new reset link.';
    if (!form.password || !form.confirmPassword) return 'Password and confirm password are required.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(form.password)) {
      return 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.';
    }
    return '';
  };

  const submit = async e => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, ...form });
      setDone(true);
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card animate-slide-up">
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:56, height:56, borderRadius:14, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow:'0 8px 24px rgba(99,102,241,0.4)', marginBottom:14 }}>
            <Camera size={24} color="#fff" />
          </div>
          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:24, fontWeight:800, color:'#fff', marginBottom:4 }}>Create New Password</h1>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13 }}>Enter a strong new password</p>
        </div>

        {done ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <CheckCircle size={56} color="#10B981" style={{ margin:'0 auto 16px' }} />
            <h3 style={{ color:'#fff', fontSize:18, fontWeight:700, marginBottom:8 }}>Password updated</h3>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, marginBottom:24 }}>Redirecting to login…</p>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="label" style={{ color:'rgba(255,255,255,0.6)' }}>New Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.3)' }} />
                <input className="input" type="password" value={form.password} onChange={e => set('password', e.target.value)} style={{ paddingLeft:42, background:'rgba(255,255,255,0.06)', border:'1.5px solid rgba(255,255,255,0.12)', color:'#fff' }} />
              </div>
            </div>
            <div className="form-group">
              <label className="label" style={{ color:'rgba(255,255,255,0.6)' }}>Confirm Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.3)' }} />
                <input className="input" type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} style={{ paddingLeft:42, background:'rgba(255,255,255,0.06)', border:'1.5px solid rgba(255,255,255,0.12)', color:'#fff' }} />
              </div>
            </div>
            {error && <p style={{ color:'#EF4444', fontSize:12, marginTop:-6, marginBottom:12 }}>{error}</p>}

            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ justifyContent:'center', padding:'14px', marginBottom:16 }}>
              {loading ? <Loader2 size={18} style={{ animation:'spin 0.8s linear infinite' }} /> : 'Update Password'}
            </button>

            <Link to="/login" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, color:'rgba(255,255,255,0.5)', fontSize:14, textDecoration:'none', fontWeight:500 }}>
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </form>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}
