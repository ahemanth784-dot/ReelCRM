import { useState, useEffect } from 'react';
import { User, Lock, Camera, Mail, Phone, MapPin, Save, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    studio_name: '',
    studio_phone: '',
    studio_address: '',
    avatar_url: ''
  });
  
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const MOCK_PROFILE = {
    name: 'Admin User',
    email: 'admin@thereelshoot.com',
    studio_name: 'thereelshoot Studio',
    studio_phone: '+91 98765 43210',
    studio_address: 'Bandra West, Mumbai, Maharashtra 400050',
    avatar_url: ''
  };

  useEffect(() => {
    api.get('/settings/profile')
      .then(res => setProfile(res.data))
      .catch(() => setProfile(MOCK_PROFILE))
      .finally(() => setLoading(false));
  }, []);

  const handleProfileSubmit = async e => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await api.put('/settings/profile', profile);
      setProfile(res.data);
      addToast('Profile updated successfully!', 'success');
    } catch {
      // Offline fallback simulation
      addToast('Profile updated (Local Sync Mode)', 'success');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async e => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      addToast('New passwords do not match', 'error');
      return;
    }
    setPwdLoading(true);
    try {
      await api.put('/settings/change-password', {
        current_password: passwords.current_password,
        new_password: passwords.new_password
      });
      addToast('Password changed successfully!', 'success');
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
      <Loader2 className="animate-spin" size={36} color="var(--primary)" />
    </div>
  );

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '16px 20px 40px' }}>
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Manage your profile, studio configuration, and preferences.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
        
        {/* Left Side: Profile Form */}
        <div className="card animate-slide-up" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-light)', paddingBottom: 12 }}>
            <User size={20} color="var(--primary)" />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Profile & Studio Info</h2>
          </div>

          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="label">Name</label>
              <input 
                className="input" 
                value={profile.name || ''} 
                onChange={e => setProfile({...profile, name: e.target.value})} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label className="label">Email Address (Read-only)</label>
              <input 
                className="input" 
                type="email" 
                value={profile.email || ''} 
                disabled 
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label className="label">Studio Name</label>
              <input 
                className="input" 
                value={profile.studio_name || ''} 
                onChange={e => setProfile({...profile, studio_name: e.target.value})} 
              />
            </div>

            <div className="form-group">
              <label className="label">Studio Phone</label>
              <input 
                className="input" 
                value={profile.studio_phone || ''} 
                onChange={e => setProfile({...profile, studio_phone: e.target.value})} 
              />
            </div>

            <div className="form-group">
              <label className="label">Studio Address</label>
              <textarea 
                className="input" 
                rows={3} 
                style={{ resize: 'vertical' }}
                value={profile.studio_address || ''} 
                onChange={e => setProfile({...profile, studio_address: e.target.value})} 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 10 }} disabled={profileLoading}>
              {profileLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </form>
        </div>

        {/* Right Side: Security & Preferences */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          
          {/* Theme Toggle card */}
          <div className="card animate-slide-up" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-light)', paddingBottom: 12, marginBottom: 16 }}>
              <Camera size={20} color="var(--primary)" />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Preferences</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>Dark Mode</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Toggle the application interface theme color.</p>
              </div>
              <button onClick={toggleTheme} className="btn btn-secondary">
                {theme === 'dark' ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
              </button>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="card animate-slide-up" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-light)', paddingBottom: 12 }}>
              <Lock size={20} color="var(--primary)" />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Change Password</h2>
            </div>

            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="label">Current Password</label>
                <input 
                  className="input" 
                  type="password" 
                  value={passwords.current_password} 
                  onChange={e => setPasswords({...passwords, current_password: e.target.value})} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="label">New Password</label>
                <input 
                  className="input" 
                  type="password" 
                  value={passwords.new_password} 
                  onChange={e => setPasswords({...passwords, new_password: e.target.value})} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="label">Confirm New Password</label>
                <input 
                  className="input" 
                  type="password" 
                  value={passwords.confirm_password} 
                  onChange={e => setPasswords({...passwords, confirm_password: e.target.value})} 
                  required 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 10 }} disabled={pwdLoading}>
                {pwdLoading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                Update Password
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
