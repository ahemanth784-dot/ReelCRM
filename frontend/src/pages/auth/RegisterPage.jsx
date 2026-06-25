import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Camera, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Min 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      addToast('Account created! Welcome to ReelCRM 🎉', 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => { setForm(f => ({...f, [k]:v})); setErrors(e => ({...e, [k]:''})); };

  const Field = ({ id, label, type='text', placeholder, field, icon: Icon, extra={} }) => (
    <div className="form-group">
      <label className="label" style={{ color:'rgba(255,255,255,0.6)' }}>{label}</label>
      <div style={{ position:'relative' }}>
        <Icon size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.3)' }} />
        <input id={id} type={type} className="input" placeholder={placeholder} value={form[field]}
          onChange={e => set(field, e.target.value)}
          style={{ paddingLeft:42, background:'rgba(255,255,255,0.06)', border:`1.5px solid ${errors[field]?'#EF4444':'rgba(255,255,255,0.12)'}`, color:'#fff', ...extra }} />
      </div>
      {errors[field] && <p style={{ color:'#EF4444', fontSize:12, marginTop:4 }}>{errors[field]}</p>}
    </div>
  );

  return (
    <div className="auth-bg">
      <div style={{ position:'absolute', width:300, height:300, background:'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', top:'5%', right:'5%', borderRadius:'50%', filter:'blur(40px)', pointerEvents:'none' }} />
      <div className="auth-card animate-slide-up">
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:56, height:56, borderRadius:14, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow:'0 8px 24px rgba(99,102,241,0.4)', marginBottom:14 }}>
            <Camera size={24} color="#fff" />
          </div>
          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:26, fontWeight:800, color:'#fff', marginBottom:4 }}>Create Account</h1>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13 }}>Join ReelCRM · thereelshoot</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Field id="name" label="Full Name" placeholder="Aluvala Hemanth" field="name" icon={User} />
          <Field id="reg-email" label="Email Address" type="email" placeholder="ahemanth784@gmail.com" field="email" icon={Mail} />

          <div className="form-group">
            <label className="label" style={{ color:'rgba(255,255,255,0.6)' }}>Password</label>
            <div style={{ position:'relative' }}>
              <Lock size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.3)' }} />
              <input type={show?'text':'password'} className="input" placeholder="Min 6 characters" value={form.password} onChange={e=>set('password',e.target.value)}
                style={{ paddingLeft:42, paddingRight:42, background:'rgba(255,255,255,0.06)', border:`1.5px solid ${errors.password?'#EF4444':'rgba(255,255,255,0.12)'}`, color:'#fff' }} />
              <button type="button" onClick={()=>setShow(s=>!s)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)' }}>
                {show?<EyeOff size={16}/>:<Eye size={16}/>}
              </button>
            </div>
            {errors.password && <p style={{ color:'#EF4444', fontSize:12, marginTop:4 }}>{errors.password}</p>}
          </div>

          <div className="form-group">
            <label className="label" style={{ color:'rgba(255,255,255,0.6)' }}>Confirm Password</label>
            <div style={{ position:'relative' }}>
              <Lock size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.3)' }} />
              <input type="password" className="input" placeholder="Repeat password" value={form.confirm} onChange={e=>set('confirm',e.target.value)}
                style={{ paddingLeft:42, background:'rgba(255,255,255,0.06)', border:`1.5px solid ${errors.confirm?'#EF4444':'rgba(255,255,255,0.12)'}`, color:'#fff' }} />
            </div>
            {errors.confirm && <p style={{ color:'#EF4444', fontSize:12, marginTop:4 }}>{errors.confirm}</p>}
          </div>

          <button id="register-btn" type="submit" className="btn btn-primary w-full" disabled={loading} style={{ justifyContent:'center', padding:'14px', fontSize:15, marginTop:4 }}>
            {loading ? <Loader2 size={18} style={{ animation:'spin 0.8s linear infinite' }} /> : <><span>Create Account</span><ArrowRight size={16}/></>}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:20, fontSize:14, color:'rgba(255,255,255,0.4)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'#818CF8', fontWeight:600, textDecoration:'none' }}>Sign in</Link>
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}

