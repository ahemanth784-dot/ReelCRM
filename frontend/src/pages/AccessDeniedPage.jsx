export default function AccessDeniedPage() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 460, padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>??</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>403 Access Denied</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>You do not have permission to view this page.</p>
        <a className="btn btn-primary" href="/dashboard" style={{ justifyContent: 'center' }}>Go to Dashboard</a>
      </div>
    </div>
  );
}
