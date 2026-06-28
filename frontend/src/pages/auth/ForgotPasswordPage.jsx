import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Mail, ArrowLeft, Send, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import api from '../../api/axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [devResetLink, setDevResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Invalid email'); return; }
    setLoading(true);
    setDevResetLink('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data?.resetLink) setDevResetLink(res.data.resetLink);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send reset link. Please try again.');
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
          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:24, fontWeight:800, color:'#fff', marginBottom:4 }}>Reset Password</h1>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13 }}>We'll send a reset link to your email</p>
        </div>

        {sent ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <CheckCircle size={56} color="#10B981" style={{ margin:'0 auto 16px' }} />
            <h3 style={{ color:'#fff', fontSize:18, fontWeight:700, marginBottom:8 }}>Check your inbox!</h3>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, marginBottom:24 }}>
              If an account exists for <strong style={{ color:'rgba(255,255,255,0.7)' }}>{email}</strong>, you'll receive a reset link shortly.
            </p>
            {devResetLink && (
              <a href={devResetLink} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, color:'#A5B4FC', marginBottom:18, wordBreak:'break-all', fontSize:13 }}>
                <ExternalLink size={15} /> Open local reset link
              </a>
            )}
            <Link to="/login" className="btn btn-primary w-full" style={{ justifyContent:'center' }}>
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label" style={{ color:'rgba(255,255,255,0.6)' }}>Email Address</label>
              <div style={{ position:'relative' }}>
                <Mail size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.3)' }} />
                <input type="email" className="input" placeholder="ahemanth784@gmail.com"
                  value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                  style={{ paddingLeft:42, background:'rgba(255,255,255,0.06)', border:`1.5px solid ${error?'#EF4444':'rgba(255,255,255,0.12)'}`, color:'#fff' }} />
              </div>
              {error && <p style={{ color:'#EF4444', fontSize:12, marginTop:4 }}>{error}</p>}
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ justifyContent:'center', padding:'14px', marginBottom:16 }}>
              {loading ? <Loader2 size={18} style={{ animation:'spin 0.8s linear infinite' }} /> : <><Send size={16}/><span>Send Reset Link</span></>}
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
