import { useEffect, useState } from 'react';

function Services() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', type: 'ClusterIP', clusterIp: '', port: '80', targetPort: '80' });
  const [showDetail, setShowDetail] = useState({ open: false, service: null });

  useEffect(() => { loadServices(); }, []);

  useEffect(() => {
    function onDoc() { setOpenMenu(null); }
    function onScrollResize() { setOpenMenu(null); }
    document.addEventListener('click', onDoc);
    window.addEventListener('scroll', onScrollResize, true);
    window.addEventListener('resize', onScrollResize);
    return () => {
      document.removeEventListener('click', onDoc);
      window.removeEventListener('scroll', onScrollResize, true);
      window.removeEventListener('resize', onScrollResize);
    };
  }, []);

  async function loadServices() {
    setLoading(true);
    try {
      // TODO: replace with real API
      await new Promise(r => setTimeout(r, 300));
      setItems([
        { name: 'web-portal-svc', type: 'ClusterIP', clusterIp: '10.96.123.45', externalIp: '<none>', port: '80/TCP', age: '5d', selector: 'app=web-portal' },
        { name: 'api-gateway', type: 'LoadBalancer', clusterIp: '10.96.234.56', externalIp: '172.16.1.100', port: '443/TCP', age: '12d', selector: 'app=api' },
        { name: 'nginx-svc', type: 'NodePort', clusterIp: '10.96.345.67', externalIp: '<none>', port: '80:30080/TCP', age: '3d', selector: 'app=nginx' },
      ]);
    } finally { setLoading(false); }
  }

  const filtered = items.filter(s => (s.name || '').toLowerCase().includes(search.toLowerCase()) || (s.clusterIp || '').toLowerCase().includes(search.toLowerCase()));

  function computeStats(list) {
    const total = list.length;
    let clusterIp = 0;
    for (const s of list) {
      if ((s.type || '').toLowerCase() === 'clusterip') clusterIp++;
    }
    const others = total - clusterIp;
    return { total, clusterIp, others };
  }

  function openActions(e, service) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const estimatedWidth = 200;
    const top = rect.bottom + 8;
    const left = Math.max(12, Math.min(rect.right - estimatedWidth, window.innerWidth - estimatedWidth - 12));
    setMenuPos({ top, left });
    setOpenMenu(prev => prev === service.name ? null : service.name);
  }

  function openDetail(service) {
    setShowDetail({ open: true, service });
    setOpenMenu(null);
  }

  async function createService(e) {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    setCreating(true);
    try {
      await new Promise(r => setTimeout(r, 300));
      setItems(prev => [
        { name: createForm.name.trim(), type: createForm.type, clusterIp: createForm.clusterIp || '10.96.0.1', externalIp: '<none>', port: `${createForm.port}/TCP`, age: '0d', selector: '-' },
        ...prev
      ]);
      setShowCreate(false);
      setCreateForm({ name: '', type: 'ClusterIP', clusterIp: '', port: '80', targetPort: '80' });
    } finally { setCreating(false); }
  }

  return (
    <div>
      {/* Summary */}
      {(() => { const s = computeStats(items); return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
          <ServiceStatCard title="Total services" primary={`${s.total}`} secondary="All services" variant="total" />
          <ServiceStatCard title="ClusterIP" primary={`${s.clusterIp}`} secondary="Internal services" variant="clusterip" />
          <ServiceStatCard title="External" primary={`${s.others}`} secondary="LoadBalancer/NodePort" variant="external" />
        </div>
      ); })()}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#64748b' }}>
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name or Cluster-IP..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 12, border: '1px solid #e5e7eb', outline: 'none', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
          />
        </div>
        <button
          className="modal-action-btn"
          onClick={()=>setShowCreate(true)}
          style={{ width: 'auto', padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', boxShadow: '0 4px 12px rgba(37,99,235,0.35)', borderRadius: 10, border: 'none' }}
        >
          <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18 }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
            <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Create service
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#334155' }}>
              {['NAME', 'TYPE', 'CLUSTER-IP', 'EXTERNAL-IP', 'PORT(S)', 'AGE', 'SELECTOR', 'Actions'].map((h, i) => (
                <th key={h} style={{ textAlign: i <= 0 ? 'left' : 'center', padding: '12px 14px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>No data</td></tr>
            ) : (
              filtered.map(service => (
                <tr key={service.name}>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{service.name}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{service.type}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{service.clusterIp}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{service.externalIp}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{service.port}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{service.age}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontSize: 12, color: '#64748b' }}>{service.selector}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                      <button
                        className="modal-action-btn"
                        aria-label="Open actions menu"
                        onClick={(e)=>openActions(e, service)}
                        style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18, color: '#334155' }}>
                          <circle cx="12" cy="5" r="1.8" fill="currentColor"/>
                          <circle cx="12" cy="12" r="1.8" fill="currentColor"/>
                          <circle cx="12" cy="19" r="1.8" fill="currentColor"/>
                        </svg>
                      </button>
                      {openMenu === service.name && (
                        <div
                          onClick={(e)=>e.stopPropagation()}
                          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)', minWidth: 200, zIndex: 1000, padding: 6 }}
                        >
                          <button
                            className="modal-action-btn secondary-btn"
                            style={{ width: '100%', padding: '10px 12px', justifyContent: 'flex-start', borderRadius: 12, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 10 }}
                            onClick={()=>openDetail(service)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16 }}>
                              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke="currentColor" strokeWidth="2"/>
                              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            View details
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={()=>setShowCreate(false)}>
          <div className="modal-container" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-content success">
              <button className="modal-close-btn" onClick={()=>setShowCreate(false)} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <h2 className="modal-title">Create service</h2>
              <form onSubmit={createService} style={{ display: 'grid', gap: 12 }}>
                <input placeholder="Service name" value={createForm.name} onChange={(e)=>setCreateForm(prev=>({...prev, name: e.target.value}))} style={inputStyle} required />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <select value={createForm.type} onChange={(e)=>setCreateForm(prev=>({...prev, type: e.target.value}))} style={inputStyle}>
                    <option value="ClusterIP">ClusterIP</option>
                    <option value="NodePort">NodePort</option>
                    <option value="LoadBalancer">LoadBalancer</option>
                  </select>
                  <input placeholder="Cluster-IP (optional)" value={createForm.clusterIp} onChange={(e)=>setCreateForm(prev=>({...prev, clusterIp: e.target.value}))} style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input placeholder="Port" value={createForm.port} onChange={(e)=>setCreateForm(prev=>({...prev, port: e.target.value}))} style={inputStyle} />
                  <input placeholder="Target port" value={createForm.targetPort} onChange={(e)=>setCreateForm(prev=>({...prev, targetPort: e.target.value}))} style={inputStyle} />
                </div>
                <div className="modal-actions-group">
                  <button type="button" className="modal-action-btn secondary-btn" onClick={()=>setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="modal-action-btn primary-btn" disabled={creating}>{creating ? 'Creating…' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDetail.open && (
        <div className="modal-overlay" onClick={()=>setShowDetail({ open: false, service: null })}>
          <div className="modal-container" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-content success">
              <button className="modal-close-btn" onClick={()=>setShowDetail({ open: false, service: null })} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <h2 className="modal-title">Service details</h2>
              <div style={{ display: 'grid', gap: 10 }}>
                {renderDetailRow('NAME', showDetail.service?.name)}
                {renderDetailRow('TYPE', showDetail.service?.type)}
                {renderDetailRow('CLUSTER-IP', showDetail.service?.clusterIp)}
                {renderDetailRow('EXTERNAL-IP', showDetail.service?.externalIp)}
                {renderDetailRow('PORT(S)', showDetail.service?.port)}
                {renderDetailRow('AGE', showDetail.service?.age)}
                {renderDetailRow('SELECTOR', showDetail.service?.selector)}
              </div>
              <div className="modal-actions-group" style={{ marginTop: 12 }}>
                <button className="modal-action-btn primary-btn" onClick={()=>setShowDetail({ open: false, service: null })}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Services;

function ServiceStatCard({ title, primary, secondary, variant='total' }) {
  const palette = {
    total: { bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', fg: '#1e40af', ring: '#c7d2fe' },
    clusterip: { bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)', fg: '#155e75', ring: '#a5f3fc' },
    external: { bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', fg: '#166534', ring: '#bbf7d0' }
  }[variant] || { bg: '#f8fafc', fg: '#0f172a', ring: '#e5e7eb' };
  return (
    <div style={{ background: 'white', border: `1px solid ${palette.ring}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: palette.bg }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18, color: palette.fg }}>
            <path d="M4 19V5M10 19V9M16 19v-6M22 19V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{ color: palette.fg, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .4 }}>{title}</div>
      </div>
      <div style={{ padding: '10px 14px' }}>
        <div style={{ color: '#0f172a', fontSize: 22, fontWeight: 700 }}>{primary}</div>
        <div style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>{secondary}</div>
      </div>
    </div>
  );
}

function renderDetailRow(label, value) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 12px', background: '#f8fafc' }}>
      <div style={{ color: '#64748b' }}>{label}</div>
      <div style={{ color: '#0f172a', fontWeight: 600 }}>{value || '-'}</div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  outline: 'none',
  background: '#fff'
};

