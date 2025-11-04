import { useEffect, useState } from 'react';

function Nodes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ ip: '', name: '', roles: 'worker', version: 'v1.30.2' });
  const [showDetail, setShowDetail] = useState({ open: false, node: null });

  useEffect(() => { loadNodes(); }, []);

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

  async function loadNodes() {
    setLoading(true);
    try {
      // TODO: replace with real API: const res = await api.get('/cluster/nodes'); setItems(res.data)
      await new Promise(r => setTimeout(r, 300));
      setItems([
        { ip: '172.16.1.10', name: 'master-1', status: 'Ready', roles: 'control-plane,master', age: '42d', version: 'v1.30.2' },
        { ip: '172.16.1.11', name: 'worker-1', status: 'Ready', roles: 'worker', age: '28d', version: 'v1.30.2' },
        { ip: '172.16.1.12', name: 'worker-2', status: 'NotReady', roles: 'worker', age: '13d', version: 'v1.30.2' },
      ]);
    } finally { setLoading(false); }
  }

  const filtered = items.filter(n =>
    (n.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.ip || '').toLowerCase().includes(search.toLowerCase())
  );

  function computeStats(list) {
    const total = list.length;
    let ready = 0;
    for (const n of list) {
      if ((n.status || '').toLowerCase() === 'ready') ready++;
    }
    const notReady = total - ready;
    return { total, ready, notReady };
  }

  function openActions(e, node) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const estimatedWidth = 200;
    const top = rect.bottom + 8;
    const left = Math.max(12, Math.min(rect.right - estimatedWidth, window.innerWidth - estimatedWidth - 12));
    setMenuPos({ top, left });
    setOpenMenu(prev => prev === node.name ? null : node.name);
  }

  function openDetail(node) {
    setShowDetail({ open: true, node });
    setOpenMenu(null);
  }

  async function createNode(e) {
    e.preventDefault();
    if (!createForm.ip.trim() || !createForm.name.trim()) return;
    setCreating(true);
    try {
      await new Promise(r => setTimeout(r, 300));
      setItems(prev => [
        { ip: createForm.ip.trim(), name: createForm.name.trim(), status: 'Ready', roles: createForm.roles, age: '0d', version: createForm.version },
        ...prev
      ]);
      setShowCreate(false);
      setCreateForm({ ip: '', name: '', roles: 'worker', version: 'v1.30.2' });
    } finally { setCreating(false); }
  }

  return (
    <div>
      {/* Summary */}
      {(() => { const s = computeStats(items); return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
          <NodeStatCard title="Total nodes" primary={`${s.total}`} secondary="All nodes in cluster" variant="total" />
          <NodeStatCard title="Ready" primary={`${s.ready}`} secondary="Healthy nodes" variant="ready" />
          <NodeStatCard title="NotReady" primary={`${s.notReady}`} secondary="Unhealthy nodes" variant="notready" />
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
            placeholder="Search by name or IP..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 12, border: '1px solid #e5e7eb', outline: 'none', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
          />
        </div>
        <button
          className="modal-action-btn"
          onClick={()=>setShowCreate(true)}
          style={{ width: 'auto', padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', boxShadow: '0 4px 12px rgba(16,185,129,0.35)', borderRadius: 10, border: 'none' }}
        >
          <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18 }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
            <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Create node
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#334155' }}>
              {['IP', 'Name', 'Status', 'Roles', 'Age', 'Version', 'Actions'].map((h, i) => (
                <th key={h} style={{ textAlign: i <= 1 ? 'left' : 'center', padding: '12px 14px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>No data</td></tr>
            ) : (
              filtered.map(node => (
                <tr key={node.name}>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{node.ip}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{node.name}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <span className={`status-badge status-${(node.status||'').toLowerCase()==='ready' ? 'running' : 'stopped'}`}>{node.status}</span>
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', color: '#334155' }}>{node.roles}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', color: '#334155' }}>{node.age}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', color: '#334155' }}>{node.version}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                      <button
                        className="modal-action-btn"
                        aria-label="Open actions menu"
                        onClick={(e)=>openActions(e, node)}
                        style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18, color: '#334155' }}>
                          <circle cx="12" cy="5" r="1.8" fill="currentColor"/>
                          <circle cx="12" cy="12" r="1.8" fill="currentColor"/>
                          <circle cx="12" cy="19" r="1.8" fill="currentColor"/>
                        </svg>
                      </button>
                      {openMenu === node.name && (
                        <div
                          onClick={(e)=>e.stopPropagation()}
                          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)', minWidth: 180, zIndex: 1000, padding: 6 }}
                        >
                          <button
                            className="modal-action-btn secondary-btn"
                            style={{ width: '100%', padding: '10px 12px', justifyContent: 'flex-start', borderRadius: 12, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 10 }}
                            onClick={()=>openDetail(node)}
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
              <h2 className="modal-title">Create node</h2>
              <form onSubmit={createNode} style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input placeholder="IP address" value={createForm.ip} onChange={(e)=>setCreateForm(prev=>({...prev, ip: e.target.value}))} style={inputStyle} required />
                  <input placeholder="Node name" value={createForm.name} onChange={(e)=>setCreateForm(prev=>({...prev, name: e.target.value}))} style={inputStyle} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <select value={createForm.roles} onChange={(e)=>setCreateForm(prev=>({...prev, roles: e.target.value}))} style={inputStyle}>
                    <option value="worker">worker</option>
                    <option value="control-plane,master">control-plane,master</option>
                  </select>
                  <input placeholder="Version" value={createForm.version} onChange={(e)=>setCreateForm(prev=>({...prev, version: e.target.value}))} style={inputStyle} />
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
        <div className="modal-overlay" onClick={()=>setShowDetail({ open: false, node: null })}>
          <div className="modal-container" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-content success">
              <button className="modal-close-btn" onClick={()=>setShowDetail({ open: false, node: null })} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <h2 className="modal-title">Node details</h2>
              <div style={{ display: 'grid', gap: 10 }}>
                {renderDetailRow('IP', showDetail.node?.ip)}
                {renderDetailRow('Name', showDetail.node?.name)}
                {renderDetailRow('Status', showDetail.node?.status)}
                {renderDetailRow('Roles', showDetail.node?.roles)}
                {renderDetailRow('Age', showDetail.node?.age)}
                {renderDetailRow('Version', showDetail.node?.version)}
              </div>
              <div className="modal-actions-group" style={{ marginTop: 12 }}>
                <button className="modal-action-btn primary-btn" onClick={()=>setShowDetail({ open: false, node: null })}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Nodes;

function NodeStatCard({ title, primary, secondary, variant='total' }) {
  const palette = {
    total: { bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', fg: '#1e40af', ring: '#c7d2fe' },
    ready: { bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)', fg: '#155e75', ring: '#a5f3fc' },
    notready: { bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', fg: '#b91c1c', ring: '#fecaca' }
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


