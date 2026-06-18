import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, X, Edit2, Trash2, Loader2, TrendingUp, UserCheck, UserX, FileText, ArrowRight } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const STATUSES = ['new','contacted','quoted','confirmed','cancelled'];
const EVENT_TYPES = ['Wedding','Pre-Wedding','Engagement','Maternity','Baby Shower','Portraits','Corporate Event','Birthday','Anniversary','Other'];
const SOURCES = ['Instagram','Facebook','Google','Referral','LinkedIn','Walk-in','Other'];

const STATUS_CONFIG = {
  new:       { label:'New',       cls:'badge-info',    icon:'🆕' },
  contacted: { label:'Contacted', cls:'badge-primary', icon:'📞' },
  quoted:    { label:'Quoted',    cls:'badge-warning', icon:'📋' },
  confirmed: { label:'Confirmed', cls:'badge-success', icon:'✅' },
  cancelled: { label:'Cancelled', cls:'badge-danger',  icon:'❌' },
};

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const fmtCurrency = v => v ? `₹${Number(v).toLocaleString('en-IN')}` : '—';

function LeadModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState({name:'',phone:'',email:'',event_type:'',event_date:'',budget:'',source:'',notes:'',status:'new',...(lead||{})});
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) { addToast('Lead name required','error'); return; }
    setLoading(true);
    try {
      let res;
      if (lead?.id) res = await api.put(`/leads/${lead.id}`, form);
      else res = await api.post('/leads', form);
      addToast(`Lead ${lead?.id?'updated':'added'}!`,'success');
      onSave(res.data);
    } catch (error) { addToast(error.response?.data?.message || 'Failed to save lead','error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal animate-slide-up">
        <div className="modal-header">
          <h2 className="modal-title">{lead?.id?'Edit Lead':'Add New Lead'}</h2>
          <button onClick={onClose} className="btn btn-icon btn-secondary"><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="label">Full Name *</label>
                <input className="input" placeholder="Lead name" value={form.name} onChange={e=>set('name',e.target.value)} required/>
              </div>
              <div className="form-group">
                <label className="label">Phone</label>
                <input className="input" placeholder="+91 98765 43210" value={form.phone||''} onChange={e=>set('phone',e.target.value)}/>
              </div>
              <div className="form-group">
                <label className="label">Email</label>
                <input className="input" type="email" placeholder="email@example.com" value={form.email||''} onChange={e=>set('email',e.target.value)}/>
              </div>
              <div className="form-group">
                <label className="label">Event Type</label>
                <select className="input" value={form.event_type||''} onChange={e=>set('event_type',e.target.value)}>
                  <option value="">Select type</option>
                  {EVENT_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Event Date</label>
                <input className="input" type="date" value={form.event_date?form.event_date.split('T')[0]:''} onChange={e=>set('event_date',e.target.value)}/>
              </div>
              <div className="form-group">
                <label className="label">Budget (₹)</label>
                <input className="input" type="number" placeholder="50000" value={form.budget||''} onChange={e=>set('budget',e.target.value)}/>
              </div>
              <div className="form-group">
                <label className="label">Source</label>
                <select className="input" value={form.source||''} onChange={e=>set('source',e.target.value)}>
                  <option value="">Select source</option>
                  {SOURCES.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Status</label>
                <select className="input" value={form.status||'new'} onChange={e=>set('status',e.target.value)}>
                  {STATUSES.map(s=><option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                </select>
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="label">Notes</label>
                <textarea className="input" rows={3} placeholder="Additional notes…" value={form.notes||''} onChange={e=>set('notes',e.target.value)} style={{resize:'vertical'}}/>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading&&<Loader2 size={16} style={{animation:'spin 0.8s linear infinite'}}/>}
              {lead?.id?'Save Changes':'Add Lead'}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({new:0,contacted:0,quoted:0,confirmed:0,cancelled:0});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { addToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lr, sr] = await Promise.all([
        api.get('/leads', { params: { search, status: statusFilter, limit: 50 } }),
        api.get('/leads/stats'),
      ]);
      setLeads(lr.data.leads);
      setStats(sr.data);
    } catch (error) {
      setLeads([]);
      setStats({new:0,contacted:0,quoted:0,confirmed:0,cancelled:0});
      addToast(error.response?.data?.message || 'Failed to load leads', 'error');
    } finally { setLoading(false); }
  }, [search, statusFilter, addToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const moveToNext = async (lead) => {
    const idx = STATUSES.indexOf(lead.status);
    if (idx >= STATUSES.length - 2) return;
    const next = STATUSES[idx + 1];
    try {
      await api.put(`/leads/${lead.id}`, { ...lead, status: next });
      addToast(`Moved to ${STATUS_CONFIG[next].label}`, 'success');
      load();
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to update lead status', 'error');
    }
  };

  const markCancelled = async (lead) => {
    try {
      await api.put(`/leads/${lead.id}`, { ...lead, status: 'cancelled' });
      addToast('Lead marked as cancelled', 'warning');
      load();
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to cancel lead', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/leads/${id}`);
      addToast('Lead deleted', 'success');
      setDeleteConfirm(null);
      load();
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to delete lead', 'error');
    }
  };

  const handleSave = () => { setModal(null); load(); };
  const total = Object.values(stats).reduce((a,b)=>a+b,0);
  const convRate = total > 0 ? Math.round((stats.confirmed / total) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">{total} total leads · {convRate}% conversion rate</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}><Plus size={18}/>Add Lead</button>
      </div>

      {/* Stats row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:14,marginBottom:24}}>
        {STATUSES.map(s => {
          const cfg = STATUS_CONFIG[s];
          const cnt = stats[s] || 0;
          return (
            <button key={s} onClick={() => setStatusFilter(f => f === s ? '' : s)}
              className="card" style={{padding:'16px 18px',cursor:'pointer',border:`2px solid ${statusFilter===s?'var(--primary)':'var(--border-light)'}`,transition:'all 0.2s',background:statusFilter===s?'rgba(99,102,241,0.06)':'var(--bg-card)'}}>
              <div style={{fontSize:22,marginBottom:6}}>{cfg.icon}</div>
              <div style={{fontSize:24,fontWeight:800,fontFamily:'Outfit,sans-serif',color:'var(--text-primary)'}}>{cnt}</div>
              <div style={{fontSize:12,color:'var(--text-muted)',fontWeight:600}}>{cfg.label}</div>
            </button>
          );
        })}
        <div className="card" style={{padding:'16px 18px',background:'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.1))'}}>
          <TrendingUp size={22} color="var(--primary)" style={{marginBottom:6}}/>
          <div style={{fontSize:24,fontWeight:800,fontFamily:'Outfit,sans-serif',color:'var(--primary)'}}>{convRate}%</div>
          <div style={{fontSize:12,color:'var(--text-muted)',fontWeight:600}}>Conversion</div>
        </div>
      </div>

      {/* Search */}
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        <div className="search-bar" style={{flex:1,minWidth:200}}>
          <Search size={15} color="var(--text-muted)"/>
          <input placeholder="Search leads…" value={search} onChange={e=>setSearch(e.target.value)}/>
          {search&&<button onClick={()=>setSearch('')} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)'}}><X size={14}/></button>}
        </div>
        {statusFilter && <button className="btn btn-secondary btn-sm" onClick={()=>setStatusFilter('')}><X size={14}/>Clear filter</button>}
      </div>

      {/* Leads cards */}
      {loading ? (
        <div style={{textAlign:'center',padding:48}}><div style={{width:36,height:36,borderRadius:'50%',border:'4px solid var(--border)',borderTopColor:'var(--primary)',animation:'spin 0.8s linear infinite',margin:'0 auto'}}/></div>
      ) : leads.length === 0 ? (
        <div className="empty-state"><UserCheck size={48}/><h3>No leads found</h3><p>Add your first lead to start tracking enquiries</p></div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16}}>
          {leads.map(lead => {
            const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
            const nextIdx = STATUSES.indexOf(lead.status) + 1;
            const canAdvance = nextIdx < STATUSES.length - 1;
            return (
              <div key={lead.id} className="card animate-slide-up" style={{padding:20}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                  <div style={{display:'flex',gap:10,alignItems:'center'}}>
                    <div className="avatar" style={{width:38,height:38,fontSize:15}}>{lead.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <div style={{fontWeight:700,fontSize:14}}>{lead.name}</div>
                      <div style={{fontSize:11,color:'var(--text-muted)'}}>{lead.source||'Direct'}</div>
                    </div>
                  </div>
                  <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
                  {[
                    {label:'Event',value:lead.event_type||'—'},
                    {label:'Budget',value:fmtCurrency(lead.budget)},
                    {label:'Date',value:fmtDate(lead.event_date)},
                    {label:'Phone',value:lead.phone||'—'},
                  ].map(i=>(
                    <div key={i.label} style={{background:'var(--bg)',borderRadius:8,padding:'8px 10px'}}>
                      <div style={{fontSize:10,color:'var(--text-muted)',fontWeight:600,marginBottom:2}}>{i.label}</div>
                      <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>{i.value}</div>
                    </div>
                  ))}
                </div>

                {lead.notes && (
                  <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:12,display:'flex',gap:6,alignItems:'flex-start'}}>
                    <FileText size={12} style={{flexShrink:0,marginTop:2}}/>{lead.notes}
                  </p>
                )}

                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {canAdvance && (
                    <button className="btn btn-primary btn-sm" onClick={()=>moveToNext(lead)} style={{flex:1,justifyContent:'center'}}>
                      <ArrowRight size={14}/> Move to {STATUS_CONFIG[STATUSES[nextIdx]]?.label}
                    </button>
                  )}
                  {lead.status !== 'cancelled' && (
                    <button className="btn btn-sm" onClick={()=>markCancelled(lead)}
                      style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,padding:'7px 12px',cursor:'pointer',color:'#EF4444',fontSize:13,display:'flex',alignItems:'center',gap:6}}>
                      <UserX size={14}/>Cancel
                    </button>
                  )}
                  <button className="btn btn-icon btn-secondary btn-sm" onClick={()=>setModal(lead)} title="Edit"><Edit2 size={14}/></button>
                  <button className="btn btn-icon btn-sm" onClick={()=>setDeleteConfirm(lead)} title="Delete"
                    style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,padding:'7px',cursor:'pointer',color:'#EF4444'}}>
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && <LeadModal lead={modal==='add'?null:modal} onClose={()=>setModal(null)} onSave={handleSave}/>}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setDeleteConfirm(null)}>
          <div className="modal animate-slide-up" style={{maxWidth:420}}>
            <div className="modal-header"><h2 className="modal-title">Delete Lead</h2></div>
            <div className="modal-body"><p style={{color:'var(--text-secondary)'}}>Delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={()=>handleDelete(deleteConfirm.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}
