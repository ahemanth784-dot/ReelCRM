import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Edit2, Trash2, Eye, ChevronUp, ChevronDown, X, Loader2, Phone, Mail, Calendar, Users } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const EVENT_TYPES = ['Wedding','Pre-Wedding','Engagement','Maternity','Baby Shower','Portraits','Corporate Event','Birthday','Anniversary','Other'];
const STATUSES = ['active','inactive','completed'];
const PAYMENT_STATUSES = [
  { value:'pending', label:'Pending' },
  { value:'deposit_received', label:'Deposit Paid' },
  { value:'partially_paid', label:'Partial' },
  { value:'fully_paid', label:'Fully Paid' },
];
const PIPELINE_STAGES = [
  { value:'enquiry', label:'Enquiry' },
  { value:'confirmed', label:'Confirmed' },
  { value:'shoot_scheduled', label:'Shoot Scheduled' },
  { value:'editing', label:'Editing' },
  { value:'delivered', label:'Delivered' },
];

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';

const PayBadge = ({status}) => {
  const m={fully_paid:{l:'Fully Paid',c:'badge-success'},deposit_received:{l:'Deposit Paid',c:'badge-info'},partially_paid:{l:'Partial',c:'badge-warning'},pending:{l:'Pending',c:'badge-danger'}};
  const s=m[status]||{l:status||'—',c:'badge-gray'};
  return <span className={`badge ${s.c}`}>{s.l}</span>;
};

const StageBadge=({stage})=>{
  const m={enquiry:'badge-gray',confirmed:'badge-info',shoot_scheduled:'badge-primary',editing:'badge-warning',delivered:'badge-success'};
  return <span className={`badge ${m[stage]||'badge-gray'}`}>{stage?.replace(/_/g,' ')}</span>;
};

const SortIcon = ({ col, sortBy, order }) => sortBy===col
  ? (order==='ASC' ? <ChevronUp size={13}/> : <ChevronDown size={13}/>)
  : <ChevronDown size={13} style={{opacity:0.3}}/>;

function ClientModal({ client, onClose, onSave }) {
  const [form, setForm] = useState({
    name:'', phone:'', email:'', event_type:'', event_date:'', address:'', notes:'', status:'active',
    total_amount:'', deposit_amount:'', paid_amount:'', payment_method:'', due_date:'',
    ...(client||{})
  });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const setTotalAmount = value => setForm(current => {
    if (value === '') return { ...current, total_amount:'', deposit_amount:'', paid_amount:'' };
    const total = Math.max(0, Number(value) || 0);
    return {
      ...current,
      total_amount: value,
      deposit_amount: Math.min(Number(current.deposit_amount || 0), total).toString(),
      paid_amount: Math.min(Number(current.paid_amount || 0), total).toString(),
    };
  });
  const setCappedPaymentAmount = (field, value) => setForm(current => {
    if (value === '') return { ...current, [field]:'' };
    const total = Math.max(0, Number(current.total_amount) || 0);
    const amount = Math.min(Math.max(0, Number(value) || 0), total);
    return { ...current, [field]:amount.toString() };
  });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) { addToast('Client name is required','error'); return; }
    if (!client?.id) {
      const total = Number(form.total_amount);
      const deposit = Number(form.deposit_amount || 0);
      const paid = Number(form.paid_amount || 0);
      if (total < 0 || deposit < 0 || paid < 0) {
        addToast('Payment amounts cannot be negative','error');
        return;
      }
      if (deposit > total) {
        addToast('Deposit cannot be greater than total amount','error');
        return;
      }
      if (paid > total) {
        addToast('Paid amount cannot be greater than total amount','error');
        return;
      }
    }
    setLoading(true);
    try {
      let res;
      if (client?.id) res = await api.put(`/clients/${client.id}`, form);
      else res = await api.post('/clients', form);
      addToast(`Client ${client?.id?'updated':'added'} successfully!`,'success');
      onSave(res.data);
    } catch {
      addToast('Failed to save client','error');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal animate-slide-up" style={{maxHeight:'90vh',overflowY:'auto'}}>
        <div className="modal-header">
          <h2 className="modal-title">{client?.id ? 'Edit Client' : 'Add New Client'}</h2>
          <button onClick={onClose} className="btn btn-icon btn-secondary"><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="label">Client Name *</label>
                <input className="input" placeholder="Full name or couple's names" value={form.name} onChange={e=>set('name',e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="label">Phone</label>
                <input className="input" placeholder="+91 98765 43210" value={form.phone||''} onChange={e=>set('phone',e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Email</label>
                <input className="input" type="email" placeholder="client@email.com" value={form.email||''} onChange={e=>set('email',e.target.value)} />
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
                <input className="input" type="date" value={form.event_date?form.event_date.split('T')[0]:''} onChange={e=>set('event_date',e.target.value)} />
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="label">Address</label>
                <input className="input" placeholder="City, State" value={form.address||''} onChange={e=>set('address',e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Status</label>
                <select className="input" value={form.status||'active'} onChange={e=>set('status',e.target.value)}>
                  {STATUSES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
              {!client?.id && (
                <>
                  <div style={{gridColumn:'1/-1',borderTop:'1px solid var(--border-light)',paddingTop:16,marginTop:4}}>
                    <h3 style={{fontSize:15,fontWeight:700,marginBottom:4}}>Payment Details</h3>
                    <p style={{fontSize:12,color:'var(--text-muted)'}}>Add the client budget and amount received.</p>
                  </div>
                  <div className="form-group">
                    <label className="label">Total Amount *</label>
                    <input className="input" type="number" min="0" step="0.01" placeholder="0" value={form.total_amount} onChange={e=>setTotalAmount(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="label">Deposit Amount</label>
                    <input className="input" type="number" min="0" max={Number(form.total_amount||0)} step="0.01" placeholder="0" value={form.deposit_amount} onChange={e=>setCappedPaymentAmount('deposit_amount',e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="label">Amount Paid</label>
                    <input className="input" type="number" min="0" max={Number(form.total_amount||0)} step="0.01" placeholder="0" value={form.paid_amount} onChange={e=>setCappedPaymentAmount('paid_amount',e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="label">Balance Amount</label>
                    <input className="input" value={Math.max(0, Number(form.total_amount||0)-Number(form.paid_amount||0))} disabled />
                  </div>
                  <div className="form-group">
                    <label className="label">Payment Method</label>
                    <select className="input" value={form.payment_method} onChange={e=>set('payment_method',e.target.value)}>
                      <option value="">Select method</option>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Card">Card</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">Payment Due Date</label>
                    <input className="input" type="date" value={form.due_date} onChange={e=>set('due_date',e.target.value)} />
                  </div>
                </>
              )}
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="label">Notes</label>
                <textarea className="input" rows={3} placeholder="Special requirements, preferences…" value={form.notes||''} onChange={e=>set('notes',e.target.value)} style={{resize:'vertical'}} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading?<Loader2 size={16} style={{animation:'spin 0.8s linear infinite'}}/>:null}
              {client?.id?'Save Changes':'Add Client'}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('DESC');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | client object
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [updatingPayment, setUpdatingPayment] = useState(null);
  const [updatingStage, setUpdatingStage] = useState(null);
  const { addToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const LIMIT = 10;

  const load = useCallback(async (overrides = {}) => {
    setLoading(true);
    try {
      const params = {
        search,
        event_type: eventFilter,
        sort_by: sortBy,
        order,
        page,
        limit: LIMIT,
        ...overrides,
      };
      const res = await api.get('/clients', { params });
      setClients(res.data.clients);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      setClients([]);
      setTotal(0);
      setTotalPages(1);
    } finally { setLoading(false); }
  }, [search, eventFilter, sortBy, order, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleSort = col => {
    if (sortBy===col) setOrder(o=>o==='ASC'?'DESC':'ASC');
    else { setSortBy(col); setOrder('ASC'); }
  };

  const handleDelete = async id => {
    try {
      await api.delete(`/clients/${id}`);
      addToast('Client deleted','success');
      setDeleteConfirm(null);
      load();
    } catch { addToast('Failed to delete','error'); }
  };

  const handleSave = (_, wasNew) => {
    setModal(null);
    if (wasNew) {
      setSearch('');
      setEventFilter('');
      setSortBy('created_at');
      setOrder('DESC');
      setPage(1);
      load({ search: '', event_type: '', sort_by: 'created_at', order: 'DESC', page: 1 });
      return;
    }
    load();
  };

  const handlePaymentStatus = async (clientId, paymentStatus) => {
    setUpdatingPayment(clientId);
    try {
      const res = await api.patch(`/payments/${clientId}/status`, { payment_status: paymentStatus });
      setClients(current => current.map(client =>
        client.id === clientId
          ? { ...client, payment_status: res.data.payment_status }
          : client
      ));
      addToast('Payment status updated', 'success');
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to update payment status', 'error');
    } finally {
      setUpdatingPayment(null);
    }
  };

  const handleStage = async (clientId, stage) => {
    setUpdatingStage(clientId);
    try {
      const res = await api.patch(`/pipeline/client/${clientId}/stage`, { stage });
      setClients(current => current.map(client =>
        client.id === clientId ? { ...client, stage: res.data.stage } : client
      ));
      addToast('Client stage updated', 'success');
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to update client stage', 'error');
    } finally {
      setUpdatingStage(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{total} total clients</p>
        </div>
        <button id="add-client-btn" className="btn btn-primary" onClick={()=>setModal('add')}>
          <Plus size={18}/> Add Client
        </button>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        <div className="search-bar" style={{flex:1,minWidth:200}}>
          <Search size={15} color="var(--text-muted)"/>
          <input placeholder="Search by name, phone, email…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
          {search && <button onClick={()=>{setSearch('');setPage(1);}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)'}}><X size={14}/></button>}
        </div>
        <select className="input" value={eventFilter} onChange={e=>{setEventFilter(e.target.value);setPage(1);}} style={{width:'auto',minWidth:150}}>
          <option value="">All Event Types</option>
          {EVENT_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
        {(search||eventFilter) && (
          <button className="btn btn-secondary btn-sm" onClick={()=>{setSearch('');setEventFilter('');setPage(1);}}>
            <Filter size={14}/> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div style={{padding:48,textAlign:'center'}}><div style={{width:36,height:36,borderRadius:'50%',border:'4px solid var(--border)',borderTopColor:'var(--primary)',animation:'spin 0.8s linear infinite',margin:'0 auto'}}/></div>
        ) : clients.length === 0 ? (
          <div className="empty-state"><Users size={48}/><h3>No clients found</h3><p>Add your first client to get started</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th onClick={()=>handleSort('name')} style={{cursor:'pointer'}}>Client <SortIcon col="name" sortBy={sortBy} order={order}/></th>
                <th>Contact</th>
                <th onClick={()=>handleSort('event_type')} style={{cursor:'pointer'}}>Event Type <SortIcon col="event_type" sortBy={sortBy} order={order}/></th>
                <th onClick={()=>handleSort('event_date')} style={{cursor:'pointer'}}>Event Date <SortIcon col="event_date" sortBy={sortBy} order={order}/></th>
                <th>Stage</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c=>(
                <tr key={c.id}>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div className="avatar" style={{width:34,height:34,fontSize:13}}>{c.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <div style={{fontWeight:600,fontSize:13}}>{c.name}</div>
                        <div style={{fontSize:11,color:'var(--text-muted)'}}>{fmtDate(c.created_at)}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{fontSize:12,color:'var(--text-secondary)'}}>
                      {c.phone&&<div style={{display:'flex',alignItems:'center',gap:4}}><Phone size={11}/>{c.phone}</div>}
                      {c.email&&<div style={{display:'flex',alignItems:'center',gap:4}}><Mail size={11}/>{c.email}</div>}
                    </div>
                  </td>
                  <td><span className="badge badge-primary">{c.event_type||'—'}</span></td>
                  <td style={{fontSize:13,color:'var(--text-secondary)',whiteSpace:'nowrap'}}>
                    {c.event_date&&<span style={{display:'flex',alignItems:'center',gap:4}}><Calendar size={11}/>{fmtDate(c.event_date)}</span>}
                  </td>
                  <td>
                    {user?.role === 'admin' ? (
                      <select
                        className="input"
                        aria-label={`Stage for ${c.name}`}
                        value={c.stage || 'enquiry'}
                        onChange={e=>handleStage(c.id, e.target.value)}
                        disabled={updatingStage===c.id}
                        style={{width:145,padding:'6px 8px',fontSize:12}}
                      >
                        {PIPELINE_STAGES.map(stage=>(
                          <option key={stage.value} value={stage.value}>{stage.label}</option>
                        ))}
                      </select>
                    ) : (
                      <StageBadge stage={c.stage}/>
                    )}
                  </td>
                  <td>
                    {user?.role === 'admin' ? (
                      <select
                        className="input"
                        aria-label={`Payment status for ${c.name}`}
                        value={c.payment_status || 'pending'}
                        onChange={e=>handlePaymentStatus(c.id, e.target.value)}
                        disabled={updatingPayment===c.id}
                        style={{width:140,padding:'6px 8px',fontSize:12}}
                      >
                        {PAYMENT_STATUSES.map(status=>(
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    ) : (
                      <PayBadge status={c.payment_status}/>
                    )}
                  </td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      <button className="btn btn-icon btn-secondary btn-sm" title="View" onClick={()=>navigate(`/clients/${c.id}`)}><Eye size={15}/></button>
                      <button className="btn btn-icon btn-secondary btn-sm" title="Edit" onClick={()=>setModal(c)}><Edit2 size={15}/></button>
                      <button className="btn btn-icon btn-sm" title="Delete" onClick={()=>setDeleteConfirm(c)}
                        style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,padding:'6px',cursor:'pointer',color:'#EF4444'}}>
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>‹</button>
          {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
            <button key={p} className={`page-btn ${p===page?'active':''}`} onClick={()=>setPage(p)}>{p}</button>
          ))}
          <button className="page-btn" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}>›</button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && <ClientModal client={modal==='add'?null:modal} onClose={()=>setModal(null)} onSave={saved=>handleSave(saved, modal==='add')}/>}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setDeleteConfirm(null)}>
          <div className="modal animate-slide-up" style={{maxWidth:420}}>
            <div className="modal-header"><h2 className="modal-title">Delete Client</h2></div>
            <div className="modal-body">
              <p style={{color:'var(--text-secondary)'}}>Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.</p>
            </div>
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
