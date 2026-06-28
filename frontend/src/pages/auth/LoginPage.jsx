import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Camera, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Min 6 characters';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email, form.password, form.remember);
      addToast('Welcome back! 🎉', 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  return (
    <div className="auth-bg">
      {/* Floating orbs */}
      <div style={{ position:'absolute', width:300, height:300, background:'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', top:'10%', left:'5%', borderRadius:'50%', filter:'blur(40px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:200, height:200, background:'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)', bottom:'15%', right:'10%', borderRadius:'50%', filter:'blur(30px)', pointerEvents:'none' }} />

      <div className="auth-card animate-slide-up">
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:60, height:60, borderRadius:16, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow:'0 8px 24px rgba(99,102,241,0.4)', marginBottom:16 }}>
            <Camera size={28} color="#fff" />
          </div>
          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:28, fontWeight:800, color:'#fff', letterSpacing:'-0.5px', marginBottom:4 }}>
            Welcome Back
          </h1>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14 }}>Sign in to <strong style={{ color:'rgba(255,255,255,0.8)' }}>ReelCRM</strong> · thereelshoot</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="form-group">
            <label className="label" style={{ color:'rgba(255,255,255,0.6)' }}>Email Address</label>
            <div style={{ position:'relative' }}>
              <Mail size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.3)' }} />
              <input
                id="email"
                type="email"
                className="input"
                placeholder="Enter your email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                style={{ paddingLeft:42, background:'rgba(255,255,255,0.06)', border:`1.5px solid ${errors.email ? '#EF4444' : 'rgba(255,255,255,0.12)'}`, color:'#fff' }}
              />
            </div>
            {errors.email && <p style={{ color:'#EF4444', fontSize:12, marginTop:4 }}>{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="label" style={{ color:'rgba(255,255,255,0.6)' }}>Password</label>
            <div style={{ position:'relative' }}>
              <Lock size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.3)' }} />
              <input
                id="password"
                type={show ? 'text' : 'password'}
                className="input"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                style={{ paddingLeft:42, paddingRight:42, background:'rgba(255,255,255,0.06)', border:`1.5px solid ${errors.password ? '#EF4444' : 'rgba(255,255,255,0.12)'}`, color:'#fff' }}
              />
              <button type="button" onClick={() => setShow(s => !s)}
                style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)' }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p style={{ color:'#EF4444', fontSize:12, marginTop:4 }}>{errors.password}</p>}
          </div>

          {/* Remember + Forgot */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
              <input type="checkbox" checked={form.remember} onChange={e => set('remember', e.target.checked)}
                style={{ accentColor:'#6366F1', width:15, height:15 }} />
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>Remember me</span>
            </label>
            <Link to="/forgot-password" style={{ fontSize:13, color:'#818CF8', fontWeight:600, textDecoration:'none' }}>
              Forgot password?
            </Link>
          </div>

          <button id="login-btn" type="submit" className="btn btn-primary w-full" disabled={loading}
            style={{ justifyContent:'center', padding:'14px', fontSize:15 }}>
            {loading ? <Loader2 size={18} style={{ animation:'spin 0.8s linear infinite' }} /> : <><span>Sign In</span><ArrowRight size={16} /></>}
          </button>
        </form>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
