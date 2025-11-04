import { useEffect, useState } from 'react';

function Cluster() {
  const [inCluster, setInCluster] = useState([]);
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIn, setSelectedIn] = useState({});
  const [selectedAvail, setSelectedAvail] = useState({});
  const [confirm, setConfirm] = useState({ open: false, type: null });
  const [notice, setNotice] = useState({ open: false, message: '' });
  const [terminal, setTerminal] = useState({ open: false, logs: '' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      // TODO: Replace with real APIs
      await new Promise(r => setTimeout(r, 250));
      setInCluster([
        { name: 'master-1', ip: '172.16.1.10', role: 'control-plane', status: 'READY' },
        { name: 'worker-1', ip: '172.16.1.11', role: 'worker', status: 'READY' },
      ]);
      setAvailable([
        { name: 'worker-2', ip: '172.16.1.12', role: 'worker', status: 'IDLE' },
        { name: 'edge-1', ip: '172.16.1.13', role: 'worker', status: 'IDLE' },
      ]);
      setSelectedIn({});
      setSelectedAvail({});
    } finally { setLoading(false); }
  }

  const filteredIn = inCluster.filter(s => (s.name+s.ip+s.role).toLowerCase().includes(search.toLowerCase()));
  const filteredAvail = available.filter(s => (s.name+s.ip+s.role).toLowerCase().includes(search.toLowerCase()));

  function toggle(mapSetter, map, key) { mapSetter({ ...map, [key]: !map[key] }); }
  function openConfirm(type) { setConfirm({ open: true, type }); }

  async function handleConfirm() {
    const type = confirm.type;
    setConfirm({ open: false, type: null });
    await new Promise(r => setTimeout(r, 250));

    if (type === 'create' || type === 'add') {
      const chosen = filteredAvail.filter(s => selectedAvail[s.name]);
      setInCluster(prev => [...prev, ...chosen.map(s => ({ ...s, status: 'READY' }))]);
      setAvailable(prev => prev.filter(s => !selectedAvail[s.name]));
      setSelectedAvail({});
      setNotice({ open: true, message: type === 'create' ? `Created cluster with ${chosen.length} node(s).` : `Added ${chosen.length} server(s) to cluster.` });
    }

    if (type === 'remove') {
      const chosen = filteredIn.filter(s => selectedIn[s.name]);
      setAvailable(prev => [...prev, ...chosen.map(s => ({ ...s, status: 'IDLE' }))]);
      setInCluster(prev => prev.filter(s => !selectedIn[s.name]));
      setSelectedIn({});
      setNotice({ open: true, message: `Removed ${chosen.length} server(s) from cluster.` });
    }

    if (type === 'reset') {
      setAvailable(prev => [...prev, ...inCluster.map(s => ({ ...s, status: 'IDLE' }))]);
      setInCluster([]);
      setSelectedAvail({});
      setSelectedIn({});
      setNotice({ open: true, message: 'Cluster has been reset.' });
    }

    if (type === 'delete') {
      setInCluster([]);
      setNotice({ open: true, message: 'Cluster has been deleted.' });
    }
  }

  function openTerminal() {
    // TODO: hook to real stream logs or interactive shell
    const sample = [
      '$ kubectl get nodes',
      'NAME        STATUS   ROLES           AGE   VERSION',
      'master-1    Ready    control-plane   42d   v1.30.2',
      'worker-1    Ready    worker          28d   v1.30.2',
      '',
      '$ kubectl get pods -A | head -5',
      'NAMESPACE   NAME                                READY   STATUS    AGE',
      'kube-system coredns-abc                        1/1     Running   42d',
    ].join('\n');
    setTerminal({ open: true, logs: sample });
  }

  const stats = { total: inCluster.length + available.length, inCount: inCluster.length, avail: available.length };

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard title="Total servers" value={stats.total} description="All registered servers" color="#4f46e5" />
        <StatCard title="In cluster" value={stats.inCount} description="Nodes joined in cluster" color="#0891b2" />
        <StatCard title="Available" value={stats.avail} description="Servers not in any cluster" color="#059669" />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <SearchBox value={search} onChange={setSearch} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <ActionButton color="blue" onClick={()=>openConfirm('create')} icon="+" label="Create cluster" />
          <ActionButton color="amber" onClick={()=>openConfirm('reset')} icon="↻" label="Reset" />
          <ActionButton color="red" onClick={()=>openConfirm('delete')} icon="×" label="Delete" />
          <ActionButton color="green" onClick={()=>openConfirm('add')} icon="+" label="Add nodes" />
          <ActionButton color="blue" onClick={openTerminal} icon=">_" label="Open terminal" />
        </div>
      </div>

      {/* Lists */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ServerListCard
          title="In cluster"
          subtitle={`${filteredIn.length} node${filteredIn.length !== 1 ? 's' : ''} active`}
          action={Object.keys(selectedIn).some(k=>selectedIn[k]) && (
            <DangerMiniButton onClick={()=>openConfirm('remove')} label="Remove selected" />
          )}
          servers={filteredIn}
          loading={loading}
          empty="No nodes in cluster"
          selected={selectedIn}
          onToggle={(name)=>toggle(setSelectedIn, selectedIn, name)}
        />

        <ServerListCard
          title="Available servers"
          subtitle={`${filteredAvail.length} server${filteredAvail.length !== 1 ? 's' : ''} ready to join`}
          servers={filteredAvail}
          loading={loading}
          empty="No available servers"
          selected={selectedAvail}
          onToggle={(name)=>toggle(setSelectedAvail, selectedAvail, name)}
        />
      </div>

      {/* Confirm Modal */}
      {confirm.open && (
        <div className="modal-overlay" onClick={()=>setConfirm({ open: false, type: null })}>
          <div className="modal-container" onClick={(e)=>e.stopPropagation()}>
            <div className={`modal-content ${confirm.type==='delete' ? 'error' : 'success'}`}>
              <button className="modal-close-btn" onClick={()=>setConfirm({ open: false, type: null })} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <h2 className="modal-title">Confirm action</h2>
              <p className="modal-description">
                {confirm.type === 'create' && 'Proceed to create a new cluster from selected servers?'}
                {confirm.type === 'reset' && 'Reset current cluster? All nodes will be detached.'}
                {confirm.type === 'delete' && 'Delete current cluster? This action cannot be undone.'}
                {confirm.type === 'add' && 'Add selected servers to the cluster?'}
                {confirm.type === 'remove' && 'Remove selected nodes from the cluster?'}
              </p>
              <div className="modal-actions-group">
                <button type="button" className="modal-action-btn secondary-btn" onClick={()=>setConfirm({ open: false, type: null })}>Cancel</button>
                <button type="button" className={`modal-action-btn ${confirm.type==='delete' ? 'error-btn' : 'primary-btn'}`} onClick={handleConfirm}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notice Modal */}
      {notice.open && (
        <div className="modal-overlay" onClick={()=>setNotice({ open: false, message: '' })}>
          <div className="modal-container" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-content success">
              <button className="modal-close-btn" onClick={()=>setNotice({ open: false, message: '' })} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <h2 className="modal-title">Completed</h2>
              <p className="modal-description">{notice.message}</p>
              <div className="modal-actions-group">
                <button type="button" className="modal-action-btn primary-btn" onClick={()=>setNotice({ open: false, message: '' })}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Modal */}
      {terminal.open && (
        <div className="modal-overlay" onClick={()=>setTerminal({ open: false, logs: '' })}>
          <div className="modal-container" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-content success">
              <button className="modal-close-btn" onClick={()=>setTerminal({ open: false, logs: '' })} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <h2 className="modal-title">Cluster terminal</h2>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, background: '#0b1020', color: '#e5e7eb', padding: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: 13, minHeight: 220, whiteSpace: 'pre-wrap' }}>
                {terminal.logs}
              </div>
              <div className="modal-actions-group" style={{ marginTop: 12 }}>
                <button className="modal-action-btn secondary-btn" onClick={()=>setTerminal({ open: false, logs: '' })}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cluster;

function SearchBox({ value, onChange }) {
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 300, maxWidth: 600 }}>
      <svg viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, color: '#94a3b8', pointerEvents: 'none' }}>
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
        <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <input
        type="text"
        placeholder="Search servers by name, IP, or role..."
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        onFocus={(e)=>e.target.style.borderColor='#3b82f6'}
        onBlur={(e)=>e.target.style.borderColor='#e5e7eb'}
        style={{ width: '100%', padding: '12px 14px 12px 44px', borderRadius: 12, border: '2px solid #e5e7eb', outline: 'none', background: '#ffffff', fontSize: 14, color: '#1e293b', transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      />
    </div>
  );
}

function StatCard({ title, value, description, color }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)', transition: 'all 0.2s ease' }}
      onMouseEnter={(e)=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)'; }}
      onMouseLeave={(e)=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)'; }}
    >
      <div style={{ background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`, padding: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', color }}>
          <svg viewBox="0 0 24 24" fill="none" style={{ width: 24, height: 24 }}>
            <path d="M4 19V5M10 19V9M16 19v-6M22 19V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#64748b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{title}</div>
          <div style={{ color: '#0f172a', fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{value}</div>
        </div>
      </div>
      <div style={{ padding: '16px 20px', background: '#fafafa', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>{description}</div>
      </div>
    </div>
  );
}

function ServerListCard({ title, subtitle, action, servers, loading, empty, selected, onToggle }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)' }}>
      <div style={{ padding: '18px 20px', borderBottom: '2px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to right, #fafafa 0%, #ffffff 100%)' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginBottom: 4 }}>{title}</div>
          {subtitle && <div style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: 'linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%)' }}>
              <th style={thStyle}>Select</th>
              <th style={{ ...thStyle, textAlign: 'left' }}>Name</th>
              <th style={{ ...thStyle, textAlign: 'left' }}>IP Address</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : servers.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>{empty}</td></tr>
            ) : (
              servers.map(s => (
                <tr key={s.name} style={{ transition: 'all 0.15s ease' }} onMouseEnter={(e)=>{e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.transform='scale(1.002)';}} onMouseLeave={(e)=>{e.currentTarget.style.background='transparent'; e.currentTarget.style.transform='scale(1)';}}>
                  <td style={tdStyle}><input type="checkbox" checked={!!selected[s.name]} onChange={()=>onToggle(s.name)} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#2563eb' }} /></td>
                  <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 700, color: '#0f172a' }}>{s.name}</td>
                  <td style={{ ...tdStyle, textAlign: 'left', color: '#475569', fontFamily: 'ui-monospace, monospace' }}>{s.ip}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}><RoleTag value={s.role} /></td>
                  <td style={tdStyle}><StatusBadge value={s.status === 'READY' ? 'READY' : 'IDLE'} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoleTag({ value }) {
  const isControlPlane = value === 'control-plane';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, textTransform: 'capitalize', background: isControlPlane ? '#ede9fe' : '#f1f5f9', color: isControlPlane ? '#7c3aed' : '#475569', border: `1px solid ${isControlPlane ? '#c4b5fd' : '#e2e8f0'}` }}>{value.replace('-', ' ')}</span>
  );
}

function StatusBadge({ value }) {
  const isReady = value === 'READY';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: isReady ? '#dcfce7' : '#fee2e2', color: isReady ? '#166534' : '#b91c1c', border: `1px solid ${isReady ? '#86efac' : '#fecaca'}`, boxShadow: `0 1px 2px ${isReady ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}` }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: isReady ? '#16a34a' : '#dc2626', boxShadow: isReady ? '0 0 8px rgba(34,197,94,0.4)' : '0 0 8px rgba(239,68,68,0.4)' }} />
      {value}
    </span>
  );
}

function ActionButton({ color, label, icon, onClick }) {
  const config = { blue: { bg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', shadow: 'rgba(37,99,235,0.4)' }, amber: { bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', shadow: 'rgba(245,158,11,0.4)' }, red: { bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', shadow: 'rgba(239,68,68,0.4)' }, green: { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', shadow: 'rgba(16,185,129,0.4)' } }[color] || { bg: '#3b82f6', shadow: 'rgba(59,130,246,0.4)' };
  return (<button onClick={onClick} style={{ padding: '12px 20px', background: config.bg, color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: `0 4px 12px ${config.shadow}`, display: 'inline-flex', alignItems: 'center', gap: 8 }} onMouseEnter={(e)=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 6px 20px ${config.shadow}`; }} onMouseLeave={(e)=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 4px 12px ${config.shadow}`; }}>{icon && <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>}{label}</button>);
}

function DangerMiniButton({ onClick, label }) { return (<button onClick={onClick} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(239,68,68,0.25)' }} onMouseEnter={(e)=>{ e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(239,68,68,0.35)'; }} onMouseLeave={(e)=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(239,68,68,0.25)'; }}>{label}</button>); }

const thStyle = { padding: '14px 16px', fontSize: 12, fontWeight: 700, color: '#475569', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #e5e7eb' };
const tdStyle = { padding: '16px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', transition: 'all 0.15s ease' };