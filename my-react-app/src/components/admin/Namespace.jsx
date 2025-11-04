import { useEffect, useState } from 'react';

function Namespace() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState({ open: false, ns: null });

  useEffect(() => { loadNamespaces(); }, []);

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

  async function loadNamespaces() {
    setLoading(true);
    try {
      // TODO: replace by real API: const res = await api.get('/cluster/namespaces'); setItems(res.data)
      await new Promise(r => setTimeout(r, 300));
      setItems([
        { name: 'default', status: 'Active', age: '42d' },
        { name: 'kube-system', status: 'Active', age: '42d' },
        { name: 'web', status: 'Active', age: '10d' },
        { name: 'staging', status: 'Active', age: '7d' },
      ]);
    } finally { setLoading(false); }
  }

  const filtered = items.filter(ns => ns.name.toLowerCase().includes(search.toLowerCase()));

  function computeStats(list) {
    const total = list.length;
    let active = 0;
    for (const ns of list) {
      if ((ns.status || '').toLowerCase() === 'active') active++;
    }
    const inactive = total - active;
    return { total, active, inactive };
  }

  function openActions(e, ns) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const estimatedWidth = 200;
    const top = rect.bottom + 8;
    const left = Math.max(12, Math.min(rect.right - estimatedWidth, window.innerWidth - estimatedWidth - 12));
    setMenuPos({ top, left });
    setOpenMenu(prev => prev === ns.name ? null : ns.name);
  }

  function askDelete(ns) {
    setConfirmDelete({ open: true, ns });
    setOpenMenu(null);
  }

  async function doDelete() {
    const ns = confirmDelete.ns;
    if (!ns) { setConfirmDelete({ open: false, ns: null }); return; }
    // TODO: await api.delete(`/cluster/namespaces/${ns.name}`)
    setItems(prev => prev.filter(i => i.name !== ns.name));
    setConfirmDelete({ open: false, ns: null });
  }

  async function createNamespace(e) {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreating(true);
    try {
      // TODO: await api.post('/cluster/namespaces', { name: createName.trim() })
      await new Promise(r => setTimeout(r, 300));
      setItems(prev => [{ name: createName.trim(), status: 'Active', age: '0d' }, ...prev]);
      setShowCreate(false);
      setCreateName('');
    } finally { setCreating(false); }
  }

  return (
    <div>
      {/* Summary */}
      {(() => { const s = computeStats(items); return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
          <NsStatCard title="Total namespaces" primary={`${s.total}`} secondary="All namespaces in cluster" variant="total" />
          <NsStatCard title="Active" primary={`${s.active}`} secondary="Active namespaces" variant="active" />
          <NsStatCard title="Inactive" primary={`${s.inactive}`} secondary="Inactive namespaces" variant="inactive" />
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
            placeholder="Search by namespace name..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 12, border: '1px solid #e5e7eb', outline: 'none', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
          />
        </div>
        <button
          className="modal-action-btn"
          style={{ width: 'auto', padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', boxShadow: '0 4px 12px rgba(37,99,235,0.35)', borderRadius: 10, border: 'none' }}
          onClick={() => setShowCreate(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18 }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
            <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Create namespace
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#334155' }}>
              {['Name', 'Status', 'Age', 'Actions'].map((h, i) => (
                <th key={h} style={{ textAlign: i === 0 ? 'left' : 'center', padding: '12px 14px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>No data</td></tr>
            ) : (
              filtered.map(ns => (
                <tr key={ns.name}>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{ns.name}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <span className={`status-badge status-${(ns.status||'').toLowerCase()==='active' ? 'running' : 'stopped'}`}>{ns.status}</span>
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', color: '#334155' }}>{ns.age}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                      <button
                        className="modal-action-btn"
                        aria-label="Open actions menu"
                        onClick={(e)=>openActions(e, ns)}
                        style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18, color: '#334155' }}>
                          <circle cx="12" cy="5" r="1.8" fill="currentColor"/>
                          <circle cx="12" cy="12" r="1.8" fill="currentColor"/>
                          <circle cx="12" cy="19" r="1.8" fill="currentColor"/>
                        </svg>
                      </button>
                      {openMenu === ns.name && (
                        <div
                          onClick={(e)=>e.stopPropagation()}
                          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)', minWidth: 180, zIndex: 1000, padding: 6 }}
                        >
                          <button
                            className="modal-action-btn error-btn"
                            style={{ width: '100%', padding: '10px 12px', justifyContent: 'flex-start', borderRadius: 12, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 10 }}
                            onClick={()=>askDelete(ns)}
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
              <h2 className="modal-title">Create namespace</h2>
              <form onSubmit={createNamespace} style={{ display: 'grid', gap: 12 }}>
                <input
                  placeholder="Namespace name"
                  value={createName}
                  onChange={(e)=>setCreateName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb', outline: 'none', background: '#fff' }}
                  required
                />
                <div className="modal-actions-group">
                  <button type="button" className="modal-action-btn secondary-btn" onClick={()=>setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="modal-action-btn primary-btn" disabled={creating}>{creating ? 'Creating…' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {confirmDelete.open && (
        <div className="modal-overlay" onClick={()=>setConfirmDelete({ open: false, ns: null })}>
          <div className="modal-container" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-content error">
              <button className="modal-close-btn" onClick={()=>setConfirmDelete({ open: false, ns: null })} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <h2 className="modal-title">Confirm delete</h2>
              <p className="modal-description">Are you sure you want to delete namespace "{confirmDelete.ns?.name}"? This action cannot be undone.</p>
              <div className="modal-actions-group">
                <button type="button" className="modal-action-btn secondary-btn" onClick={()=>setConfirmDelete({ open: false, ns: null })}>Cancel</button>
                <button type="button" className="modal-action-btn error-btn" onClick={doDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Namespace;

function NsStatCard({ title, primary, secondary, variant='total' }) {
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


