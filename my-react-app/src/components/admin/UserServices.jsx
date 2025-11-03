import { useEffect, useState } from 'react';
import '../user/Dashboard.css';

function UserServices() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState({ open: false, user: null, services: [] });
  const [openMenuUser, setOpenMenuUser] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [hoverAction, setHoverAction] = useState(null);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    function handleDocClick() { setOpenMenuUser(null); }
    function handleScrollOrResize() { setOpenMenuUser(null); }
    document.addEventListener('click', handleDocClick);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('click', handleDocClick);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // TODO: Thay bằng API thật
      await new Promise(r => setTimeout(r, 300));
      setRows([
        { fullname: 'Nguyễn Văn A', username: 'nguyenvana', total: 5, active: 4, inactive: 1 },
        { fullname: 'Trần Thị B', username: 'tranthib', total: 3, active: 2, inactive: 1 },
        { fullname: 'Lê Văn C', username: 'levanc', total: 2, active: 0, inactive: 2 },
      ]);
    } finally { setLoading(false); }
  }

  const filtered = rows.filter(r =>
    r.username.toLowerCase().includes(search.toLowerCase()) ||
    r.fullname.toLowerCase().includes(search.toLowerCase())
  );

  function computeStats(list) {
    return list.reduce((acc, cur) => {
      acc.total += (cur.total || 0);
      acc.running += (cur.active || 0);
      acc.stopped += (cur.inactive || 0);
      return acc;
    }, { total: 0, running: 0, stopped: 0 });
  }

  async function openDetail(user) {
    await new Promise(r => setTimeout(r, 200));
    const mockServices = [
      { name: 'web-portal', status: 'active' },
      { name: 'api-service', status: 'active' },
      { name: 'landing-page', status: 'inactive' },
    ];
    setDetail({ open: true, user, services: mockServices });
  }

  return (
    <div>
      {/* Summary */}
      {(() => { const s = computeStats(rows); return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)' }}>
                <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18, color: '#3730a3' }}>
                  <path d="M4 19V5M10 19V9M16 19v-6M22 19V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ color: '#3730a3', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .4 }}>Total services</div>
            </div>
            <div style={{ padding: '10px 14px' }}>
              <div style={{ color: '#0f172a', fontSize: 22, fontWeight: 700 }}>{s.total}</div>
              <div style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>All services across users</div>
            </div>
          </div>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)' }}>
                <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18, color: '#155e75' }}>
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ color: '#155e75', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .4 }}>Active</div>
            </div>
            <div style={{ padding: '10px 14px' }}>
              <div style={{ color: '#0f172a', fontSize: 22, fontWeight: 700 }}>{s.running}</div>
              <div style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>Services currently running</div>
            </div>
          </div>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)' }}>
                <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18, color: '#b91c1c' }}>
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ color: '#b91c1c', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .4 }}>Inactive</div>
            </div>
            <div style={{ padding: '10px 14px' }}>
              <div style={{ color: '#0f172a', fontSize: 22, fontWeight: 700 }}>{s.stopped}</div>
              <div style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>Services currently inactive</div>
            </div>
          </div>
        </div>
      ); })()}

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#64748b' }}>
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search by username or full name..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 12, border: '1px solid #e5e7eb', outline: 'none', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
          />
        </div>  
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#334155' }}>
              {['Full name', 'Username', 'Total services', 'Active', 'Inactive', 'Actions'].map((h, i) => (
                <th key={h} style={{ textAlign: i < 2 ? 'left' : 'center', padding: '12px 14px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>No data</td></tr>
            ) : (
              filtered.map(u => (
                <tr key={u.username}>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{u.fullname}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{u.username}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{u.total}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>{u.active}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', color: '#dc2626', fontWeight: 600 }}>{u.inactive}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                      <button
                        className="modal-action-btn"
                        aria-label="Mở menu hành động"
                        onClick={(e)=>{
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const estimatedWidth = 200;
                          const top = rect.bottom + 8;
                          const left = Math.max(12, Math.min(rect.right - estimatedWidth, window.innerWidth - estimatedWidth - 12));
                          setMenuPos({ top, left });
                          setOpenMenuUser(prev => prev === u.username ? null : u.username);
                        }}
                        style={{
                          width: 36,
                          height: 36,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          borderRadius: 10,
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18, color: '#334155' }}>
                          <circle cx="12" cy="5" r="1.8" fill="currentColor"/>
                          <circle cx="12" cy="12" r="1.8" fill="currentColor"/>
                          <circle cx="12" cy="19" r="1.8" fill="currentColor"/>
                        </svg>
                      </button>

                      {openMenuUser === u.username && (
                        <div
                          onClick={(e)=>e.stopPropagation()}
                          style={{
                            position: 'fixed',
                            top: menuPos.top,
                            left: menuPos.left,
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: 12,
                            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
                            minWidth: 180,
                            zIndex: 1000,
                            padding: 6
                          }}
                        >
                          <button
                            className="modal-action-btn primary-btn"
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              justifyContent: 'flex-start',
                              borderRadius: 12,
                              background: hoverAction==='detail' ? '#e0f2fe' : '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              transition: 'all .15s ease',
                              transform: hoverAction==='detail' ? 'translateX(2px)' : 'translateX(0)'
                            }}
                            onMouseEnter={()=>setHoverAction('detail')}
                            onMouseLeave={()=>setHoverAction(null)}
                            onClick={()=>{ setOpenMenuUser(null); openDetail(u); }}
                          >
                            <span style={{ width: 26, height: 26, borderRadius: 8, background: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 1px #bfdbfe' }}>
                              <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16 }}>
                                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </span>
                            Xem chi tiết
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

      {/* Detail modal */}
      {detail.open && (
        <div className="modal-overlay" onClick={()=>setDetail({ open: false, user: null, services: [] })}>
          <div className="modal-container" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-content success">
              <button className="modal-close-btn" onClick={()=>setDetail({ open: false, user: null, services: [] })} aria-label="Đóng">
                <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <h2 className="modal-title">Dịch vụ của {detail.user?.username}</h2>
              <div style={{ marginBottom: 12, color: '#64748b' }}>{detail.user?.fullname}</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {detail.services.map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px' }}>
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>{s.name}</span>
                    <span className={`status-badge status-${s.status === 'active' ? 'running' : 'stopped'}`}>{s.status}</span>
                  </div>
                ))}
              </div>
              <div className="modal-actions-group" style={{ marginTop: 12 }}>
                <button className="modal-action-btn primary-btn" onClick={()=>setDetail({ open: false, user: null, services: [] })}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserServices;


