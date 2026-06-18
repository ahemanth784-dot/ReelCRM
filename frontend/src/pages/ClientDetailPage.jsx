import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Camera, CreditCard, Edit2 } from 'lucide-react';
import api from '../api/axios';

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'}) : '—';
const fmtCurrency = v => `₹${Number(v||0).toLocaleString('en-IN')}`;

const InfoRow = ({icon:Icon,label,value}) => (
  <div style={{display:'flex',gap:12,padding:'12px 0',borderBottom:'1px solid var(--border-light)'}}>
    <div style={{width:36,height:36,borderRadius:10,background:'rgba(99,102,241,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      <Icon size={16} color="var(--primary)"/>
    </div>
    <div>
      <p style={{fontSize:12,color:'var(--text-muted)',fontWeight:600,marginBottom:2}}>{label}</p>
      <p style={{fontSize:14,color:'var(--text-primary)',fontWeight:500}}>{value||'—'}</p>
    </div>
  </div>
);

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/clients/${id}`)
      .then(r=>setClient(r.data))
      .catch(()=>setClient(null))
      .finally(()=>setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300}}>
      <div style={{width:36,height:36,borderRadius:'50%',border:'4px solid var(--border)',borderTopColor:'var(--primary)',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  if (!client) return <div className="empty-state"><h3>Client not found</h3><Link to="/clients" className="btn btn-primary" style={{marginTop:16}}>Back to Clients</Link></div>;

  const payPct = client.total_amount ? Math.round((client.paid_amount/client.total_amount)*100) : 0;

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <button onClick={()=>navigate(-1)} className="btn btn-secondary btn-sm"><ArrowLeft size={16}/>Back</button>
        <div style={{flex:1}}>
          <h1 className="page-title">{client.name}</h1>
          <p className="page-subtitle">Client Details</p>
        </div>
        <Link to="/clients" className="btn btn-secondary btn-sm"><Edit2 size={15}/>Edit Client</Link>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        {/* Contact info */}
        <div className="card" style={{padding:24}}>
          <h3 style={{fontFamily:'Outfit,sans-serif',fontWeight:700,fontSize:16,marginBottom:16}}>Contact Information</h3>
          <InfoRow icon={Phone} label="Phone" value={client.phone}/>
          <InfoRow icon={Mail} label="Email" value={client.email}/>
          <InfoRow icon={MapPin} label="Address" value={client.address}/>
          <InfoRow icon={Calendar} label="Event Date" value={fmtDate(client.event_date)}/>
          <InfoRow icon={Camera} label="Event Type" value={client.event_type}/>
        </div>

        {/* Payment */}
        <div className="card" style={{padding:24}}>
          <h3 style={{fontFamily:'Outfit,sans-serif',fontWeight:700,fontSize:16,marginBottom:16}}>Payment Summary</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
            {[
              {label:'Total Amount',value:fmtCurrency(client.total_amount),color:'var(--primary)'},
              {label:'Amount Paid',value:fmtCurrency(client.paid_amount),color:'#10B981'},
              {label:'Deposit',value:fmtCurrency(client.deposit_amount),color:'#3B82F6'},
              {label:'Balance Due',value:fmtCurrency(client.balance_amount),color:'#EF4444'},
            ].map(s=>(
              <div key={s.label} style={{background:'var(--bg)',borderRadius:10,padding:'14px 16px'}}>
                <p style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,marginBottom:4}}>{s.label}</p>
                <p style={{fontSize:18,fontWeight:800,color:s.color,fontFamily:'Outfit,sans-serif'}}>{s.value}</p>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text-muted)',marginBottom:6}}>
              <span>Payment Progress</span><span>{payPct}%</span>
            </div>
            <div style={{background:'var(--border)',borderRadius:99,height:8,overflow:'hidden'}}>
              <div style={{width:`${payPct}%`,height:'100%',background:'linear-gradient(90deg,#6366F1,#10B981)',borderRadius:99,transition:'width 0.8s ease'}}/>
            </div>
          </div>
          <div style={{marginTop:16}}>
            <Link to="/payments" className="btn btn-primary btn-sm" style={{width:'100%',justifyContent:'center'}}>
              <CreditCard size={14}/> Manage Payment
            </Link>
          </div>
        </div>

        {/* Notes */}
        {client.notes && (
          <div className="card" style={{padding:24,gridColumn:'1/-1'}}>
            <h3 style={{fontFamily:'Outfit,sans-serif',fontWeight:700,fontSize:16,marginBottom:12}}>Notes</h3>
            <p style={{color:'var(--text-secondary)',lineHeight:1.7,fontSize:14}}>{client.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
