import { useEffect, useState } from 'react';

function Servers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', ip: '', port: '22', role: 'worker', username: '', password: '', status: 'inactive' });
  const [showDetail, setShowDetail] = useState({ open: false, server: null });
  const [showTerminal, setShowTerminal] = useState({ open: false, server: null });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, server: null });

  useEffect(() => { loadServers(); }, []);

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

  async function loadServers() {
    setLoading(true);
    try {
      // TODO: replace with real API
      await new Promise(r => setTimeout(r, 300));
      setItems([
        { name: 'master-1', ip: '172.16.1.10', port: '22', role: 'control-plane', username: 'ubuntu', password: '••••••', status: 'active' },
        { name: 'worker-1', ip: '172.16.1.11', port: '22', role: 'worker', username: 'ubuntu', password: '••••••', status: 'active' },
        { name: 'worker-2', ip: '172.16.1.12', port: '22', role: 'worker', username: 'ubuntu', password: '••••••', status: 'inactive' },
      ]);
    } finally { setLoading(false); }
  }

  const filtered = items.filter(s =>
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.ip || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.role || '').toLowerCase().includes(search.toLowerCase())
  );

  function computeStats(list) {
    const total = list.length;
    let active = 0;
    for (const s of list) {
      if ((s.status || '').toLowerCase() === 'active') active++;
    }
    const inactive = total - active;
    return { total, active, inactive };
  }

  function openActions(e, server) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const estimatedWidth = 200;
    const top = rect.bottom + 8;
    const left = Math.max(12, Math.min(rect.right - estimatedWidth, window.innerWidth - estimatedWidth - 12));
    setMenuPos({ top, left });
    setOpenMenu(prev => prev === server.name ? null : server.name);
  }

  function openTerminal(server) {
    setShowTerminal({ open: true, server });
    setOpenMenu(null);
  }

  function openDelete(server) {
    setConfirmDelete({ open: true, server });
    setOpenMenu(null);
  }

  async function createServer(e) {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.ip.trim()) return;
    setCreating(true);
    try {
      await new Promise(r => setTimeout(r, 300));
      setItems(prev => [
        { ...createForm, password: '••••••' },
        ...prev
      ]);
      setShowCreate(false);
      setCreateForm({ name: '', ip: '', port: '22', role: 'worker', username: '', password: '', status: 'inactive' });
    } finally { setCreating(false); }
  }

  async function confirmDeleteServer() {
    const server = confirmDelete.server;
    if (!server) { setConfirmDelete({ open: false, server: null }); return; }
    await new Promise(r => setTimeout(r, 200));
    setItems(prev => prev.filter(s => s.name !== server.name));
    setConfirmDelete({ open: false, server: null });
  }

  return (
    <div>
      {(() => { const s = computeStats(items); return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
          <ServerStatCard title="Total servers" primary={`${s.total}`} secondary="All registered servers" variant="total" />
          <ServerStatCard title="Active" primary={`${s.active}`} secondary="Servers reachable/active" variant="active" />
          <ServerStatCard title="Inactive" primary={`${s.inactive}`} secondary="Servers not active" variant="inactive" />
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
            placeholder="Search by name, IP or role..."
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
          Add server
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#334155' }}>
              {['Name', 'IP', 'Port', 'Role', 'Username', 'Password', 'Status', 'Actions'].map((h, i) => (
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
              filtered.map(server => (
                <tr key={server.name}>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', color: '#0f172a', fontWeight: 600 }}>{server.name}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{server.ip}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{server.port}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', textTransform: 'capitalize' }}>{server.role}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{server.username}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{server.password}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <span className={`status-badge status-${(server.status||'').toLowerCase()==='active' ? 'running' : 'stopped'}`}>{server.status}</span>
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                      <button
                        className="modal-action-btn"
                        aria-label="Open actions menu"
                        onClick={(e)=>openActions(e, server)}
                        style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18, color: '#334155' }}>
                          <circle cx="12" cy="5" r="1.8" fill="currentColor"/>
                          <circle cx="12" cy="12" r="1.8" fill="currentColor"/>
                          <circle cx="12" cy="19" r="1.8" fill="currentColor"/>
                        </svg>
                      </button>
                      {openMenu === server.name && (
                        <div
                          onClick={(e)=>e.stopPropagation()}
                          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)', minWidth: 200, zIndex: 1000, padding: 6 }}
                        >
                          <button
                            className="modal-action-btn secondary-btn"
                            style={{ width: '100%', padding: '10px 12px', justifyContent: 'flex-start', borderRadius: 12, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 10 }}
                            onClick={()=>openTerminal(server)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16 }}>
                              <path d="M4 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M14 20h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Open terminal
                          </button>
                          <div style={{ height: 6 }} />
                          <button
                            className="modal-action-btn error-btn"
                            style={{ width: '100%', padding: '10px 12px', justifyContent: 'flex-start', borderRadius: 12, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 10 }}
                            onClick={()=>openDelete(server)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16 }}>
                              <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6M10 10v8M14 10v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M9 6l1-2h4l1 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Delete
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
              <h2 className="modal-title">Add server</h2>
              <form onSubmit={createServer} style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input placeholder="Name" value={createForm.name} onChange={(e)=>setCreateForm(prev=>({...prev, name: e.target.value}))} style={inputStyle} required />
                  <input placeholder="IP address" value={createForm.ip} onChange={(e)=>setCreateForm(prev=>({...prev, ip: e.target.value}))} style={inputStyle} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input placeholder="Port" value={createForm.port} onChange={(e)=>setCreateForm(prev=>({...prev, port: e.target.value}))} style={inputStyle} />
                  <select value={createForm.role} onChange={(e)=>setCreateForm(prev=>({...prev, role: e.target.value}))} style={inputStyle}>
                    <option value="worker">worker</option>
                    <option value="control-plane">control-plane</option>
                    <option value="etcd">etcd</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input placeholder="Username" value={createForm.username} onChange={(e)=>setCreateForm(prev=>({...prev, username: e.target.value}))} style={inputStyle} />
                  <input type="password" placeholder="Password" value={createForm.password} onChange={(e)=>setCreateForm(prev=>({...prev, password: e.target.value}))} style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <select value={createForm.status} onChange={(e)=>setCreateForm(prev=>({...prev, status: e.target.value}))} style={inputStyle}>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>
                <div className="modal-actions-group">
                  <button type="button" className="modal-action-btn secondary-btn" onClick={()=>setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="modal-action-btn primary-btn" disabled={creating}>{creating ? 'Adding…' : 'Add'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showTerminal.open && (
        <div className="modal-overlay" onClick={()=>setShowTerminal({ open: false, server: null })}>
          <div className="modal-container" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-content success">
              <button className="modal-close-btn" onClick={()=>setShowTerminal({ open: false, server: null })} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <h2 className="modal-title">Terminal (preview)</h2>
              <div style={{ color: '#64748b', marginBottom: 12 }}>Server: {showTerminal.server?.name} ({showTerminal.server?.ip})</div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, minHeight: 180, padding: 12, background: '#0b1020', color: '#e5e7eb', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: 13 }}>
                $ ssh {showTerminal.server?.username}@{showTerminal.server?.ip}
                <br />
                # Terminal integration coming soon…
              </div>
              <div className="modal-actions-group" style={{ marginTop: 12 }}>
                <button className="modal-action-btn primary-btn" onClick={()=>setShowTerminal({ open: false, server: null })}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete.open && (
        <div className="modal-overlay" onClick={()=>setConfirmDelete({ open: false, server: null })}>
          <div className="modal-container" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-content error">
              <button className="modal-close-btn" onClick={()=>setConfirmDelete({ open: false, server: null })} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <h2 className="modal-title">Confirm delete</h2>
              <p className="modal-description">Are you sure you want to delete server "{confirmDelete.server?.name}"?</p>
              <div className="modal-actions-group">
                <button type="button" className="modal-action-btn secondary-btn" onClick={()=>setConfirmDelete({ open: false, server: null })}>Cancel</button>
                <button type="button" className="modal-action-btn error-btn" onClick={confirmDeleteServer}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Servers;

function ServerStatCard({ title, primary, secondary, variant='total' }) {
  const palette = {
    total: { bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', fg: '#1e40af', ring: '#c7d2fe' },
    active: { bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)', fg: '#155e75', ring: '#a5f3fc' },
    inactive: { bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', fg: '#b91c1c', ring: '#fecaca' }
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

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  outline: 'none',
  background: '#fff'
};
