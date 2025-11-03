import { useEffect, useState } from 'react';

function UserAccounts() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ fullname: '', username: '', role: 'user', status: 'active', password: '', confirmPassword: '' });
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, user: null });
  const [openMenuUserId, setOpenMenuUserId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, placement: 'down' }); // fixed-positioned dropdown

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    function handleDocClick() {
      setOpenMenuUserId(null);
    }
    function handleScrollOrResize() {
      // đóng menu khi scroll/resize để tránh lệch vị trí
      setOpenMenuUserId(null);
    }
    document.addEventListener('click', handleDocClick);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  function computeStats(list) {
    const stats = {
      total: list.length,
      totalActive: 0,
      totalInactive: 0,
      userActive: 0,
      userInactive: 0,
      adminActive: 0,
      adminInactive: 0,
    };
    for (const u of list) {
      const isActive = (u.status || '').toLowerCase() === 'active';
      const isAdmin = (u.role || '').toLowerCase() === 'admin';
      if (isActive) stats.totalActive++; else stats.totalInactive++;
      if (isAdmin) {
        if (isActive) stats.adminActive++; else stats.adminInactive++;
      } else {
        if (isActive) stats.userActive++; else stats.userInactive++;
      }
    }
    return stats;
  }

  async function loadUsers() {
    setLoading(true);
    try {
      // TODO: Thay thế bằng API thật: const res = await api.get('/users'); setUsers(res.data)
      await new Promise(r => setTimeout(r, 300));
      setUsers([
        { id: 1, fullname: 'Nguyễn Văn A', username: 'nguyenvana', role: 'admin', status: 'active' },
        { id: 2, fullname: 'Trần Thị B', username: 'tranthib', role: 'user', status: 'active' },
        { id: 3, fullname: 'Lê Văn C', username: 'levanc', role: 'user', status: 'inactive' }
      ]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));

  function openCreate() {
    setForm({ fullname: '', username: '', role: 'user', status: 'active', password: '', confirmPassword: '' });
    setShowCreate(true);
  }

  function openEdit(user) {
    setEditing(user);
    setForm({ fullname: user.fullname, username: user.username, role: user.role, status: user.status, password: '', confirmPassword: '' });
    setShowEdit(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.fullname.trim() || !form.username.trim()) return;
    if (!form.password || !form.confirmPassword) return;
    if (form.password !== form.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }
    setSubmitting(true);
    try {
      // TODO: API tạo user: await api.post('/users', {...})
      await new Promise(r => setTimeout(r, 300));
      const { password, confirmPassword, ...rest } = form;
      const newUser = { id: Math.max(0, ...users.map(u => u.id)) + 1, ...rest };
      setUsers(prev => [newUser, ...prev]);
      setShowCreate(false);
    } finally { setSubmitting(false); }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editing) return;
    if (form.password || form.confirmPassword) {
      if (form.password !== form.confirmPassword) {
        alert('Mật khẩu xác nhận không khớp');
        return;
      }
    }
    setSubmitting(true);
    try {
      // TODO: API cập nhật user: await api.put(`/users/${editing.id}`, {...})
      await new Promise(r => setTimeout(r, 300));
      const { password, confirmPassword, ...rest } = form;
      setUsers(prev => prev.map(u => u.id === editing.id ? { ...u, ...rest } : u));
      setShowEdit(false);
      setEditing(null);
    } finally { setSubmitting(false); }
  }

  function openDelete(user) {
    setConfirmDelete({ open: true, user });
  }

  async function confirmDeleteUser() {
    const user = confirmDelete.user;
    if (!user) {
      setConfirmDelete({ open: false, user: null });
      return;
    }
    // TODO: API xóa user: await api.delete(`/users/${user.id}`)
    setUsers(prev => prev.filter(u => u.id !== user.id));
    setConfirmDelete({ open: false, user: null });
  }

  return (
    <div>
      {/* Stats summary */}
      {(() => { const s = computeStats(users); return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
      <StatCard variant="total" title="Total accounts" primary={`${s.total}`} secondary={`Active: ${s.totalActive} • Inactive: ${s.totalInactive}`} />
      <StatCard variant="user" title="User accounts" primary={`${s.userActive + s.userInactive}`} secondary={`Active: ${s.userActive} • Inactive: ${s.userInactive}`} />
      <StatCard variant="admin" title="Admin accounts" primary={`${s.adminActive + s.adminInactive}`} secondary={`Active: ${s.adminActive} • Inactive: ${s.adminInactive}`} />
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
            placeholder="Search by username..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 38px', borderRadius: 12,
              border: '1px solid #e5e7eb', outline: 'none', background: '#fff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
          />
        </div>
        <button
          className="modal-action-btn"
          style={{
            width: 'auto', padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', boxShadow: '0 4px 12px rgba(16,185,129,0.35)', borderRadius: 10, border: 'none'
          }}
          onClick={openCreate}
        >
          <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18 }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
            <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add account
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#334155' }}>
            {['ID', 'Full name', 'Username', 'Role', 'Status', 'Actions'].map((h, i) => (
                <th key={h} style={{ textAlign: i === 0 ? 'left' : 'center', padding: '12px 14px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #e5e7eb' }}>{h}</th>
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
                <tr key={u.id}>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{u.id}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{u.fullname}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{u.username}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', textTransform: 'capitalize' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: (u.role||'').toLowerCase()==='admin' ? '#dbeafe' : '#f1f5f9',
                      color: (u.role||'').toLowerCase()==='admin' ? '#1d4ed8' : '#334155',
                      border: '1px solid ' + ((u.role||'').toLowerCase()==='admin' ? '#93c5fd' : '#e2e8f0'),
                      padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600
                    }}>
                      {(u.role||'').toLowerCase()==='admin' ? (
                        <svg viewBox="0 0 24 24" fill="none" style={{ width: 14, height: 14 }}>
                          <path d="M12 2l3 7h7l-5.5 4 2.5 7-7-4-7 4 2.5-7L2 9h7l3-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" style={{ width: 14, height: 14 }}>
                          <path d="M16 14a4 4 0 1 0-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      )}
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <span className={`status-badge status-${u.status === 'active' ? 'running' : 'stopped'}`}>{u.status}</span>
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                      <button
                        className="modal-action-btn"
                        aria-label="Open actions menu"
                        onClick={(e)=>{
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const estimatedHeight = 120; // ước lượng menu cao ~120px
                          const estimatedWidth = 200;
                          const spaceBelow = window.innerHeight - rect.bottom;
                          const placement = spaceBelow < estimatedHeight + 12 ? 'up' : 'down';
                          const top = placement === 'down' ? (rect.bottom + 8) : (rect.top - estimatedHeight - 8);
                          const left = Math.max(12, Math.min(rect.right - estimatedWidth, window.innerWidth - estimatedWidth - 12));
                          setMenuPos({ top, left, placement });
                          setOpenMenuUserId(prev => prev === u.id ? null : u.id);
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
                      {openMenuUserId === u.id && (
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
                            maxHeight: 240,
                            overflowY: 'auto',
                            zIndex: 1000,
                            padding: 6
                          }}
                        >
                          <button
                            className="modal-action-btn secondary-btn"
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              justifyContent: 'flex-start',
                              borderRadius: 10,
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            onClick={()=>{ setOpenMenuUserId(null); openEdit(u); }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16, marginRight: 8 }}>
                              <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Edit
                          </button>
                          <div style={{ height: 6 }} />
                          <button
                            className="modal-action-btn error-btn"
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              justifyContent: 'flex-start',
                              borderRadius: 10,
                              background: '#fef2f2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            onClick={()=>{ setOpenMenuUserId(null); openDelete(u); }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16, marginRight: 8 }}>
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
              <button className="modal-close-btn" onClick={()=>setShowCreate(false)} aria-label="Đóng">
                <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <h2 className="modal-title">Add account</h2>
              <form onSubmit={handleCreate} style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input placeholder="Full name" value={form.fullname} onChange={(e)=>setForm({...form, fullname: e.target.value})} style={inputStyle} required />
                  <input placeholder="Username" value={form.username} onChange={(e)=>setForm({...form, username: e.target.value})} style={inputStyle} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input type="password" placeholder="Password" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} style={inputStyle} required />
                  <input type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={(e)=>setForm({...form, confirmPassword: e.target.value})} style={inputStyle} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <select value={form.role} onChange={(e)=>setForm({...form, role: e.target.value})} style={inputStyle}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select value={form.status} onChange={(e)=>setForm({...form, status: e.target.value})} style={inputStyle}>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>
                <div className="modal-actions-group">
                  <button type="button" className="modal-action-btn secondary-btn" onClick={()=>setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="modal-action-btn primary-btn" disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="modal-overlay" onClick={()=>setShowEdit(false)}>
          <div className="modal-container" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-content success">
              <button className="modal-close-btn" onClick={()=>setShowEdit(false)} aria-label="Đóng">
                <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <h2 className="modal-title">Edit account</h2>
              <form onSubmit={handleUpdate} style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input placeholder="Full name" value={form.fullname} onChange={(e)=>setForm({...form, fullname: e.target.value})} style={inputStyle} required />
                  <input placeholder="Username" value={form.username} onChange={(e)=>setForm({...form, username: e.target.value})} style={inputStyle} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input type="password" placeholder="New password (leave blank to keep)" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} style={inputStyle} />
                  <input type="password" placeholder="Confirm new password" value={form.confirmPassword} onChange={(e)=>setForm({...form, confirmPassword: e.target.value})} style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <select value={form.role} onChange={(e)=>setForm({...form, role: e.target.value})} style={inputStyle}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select value={form.status} onChange={(e)=>setForm({...form, status: e.target.value})} style={inputStyle}>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>
                <div className="modal-actions-group">
                  <button type="button" className="modal-action-btn secondary-btn" onClick={()=>setShowEdit(false)}>Cancel</button>
                  <button type="submit" className="modal-action-btn primary-btn" disabled={submitting}>{submitting ? 'Saving…' : 'Save changes'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {confirmDelete.open && (
        <div className="modal-overlay" onClick={()=>setConfirmDelete({ open: false, user: null })}>
          <div className="modal-container" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-content error">
              <button className="modal-close-btn" onClick={()=>setConfirmDelete({ open: false, user: null })} aria-label="Đóng">
                <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <h2 className="modal-title">Confirm delete</h2>
              <p className="modal-description">Are you sure you want to delete account {confirmDelete.user?.username}? This action cannot be undone.</p>
              <div className="modal-actions-group">
                <button type="button" className="modal-action-btn secondary-btn" onClick={()=>setConfirmDelete({ open: false, user: null })}>Cancel</button>
                <button type="button" className="modal-action-btn error-btn" onClick={confirmDeleteUser}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
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

export default UserAccounts;

function StatCard({ title, primary, secondary, variant='total' }) {
  const palette = {
    total: { bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', fg: '#3730a3', ring: '#c7d2fe' },
    user: { bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)', fg: '#155e75', ring: '#a5f3fc' },
    admin: { bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', fg: '#1e40af', ring: '#bfdbfe' },
  }[variant] || { bg: '#f8fafc', fg: '#0f172a', ring: '#e5e7eb' };

  const icon = variant === 'admin' ? (
    <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18, color: palette.fg }}>
      <path d="M12 2l3 7h7l-5.5 4 2.5 7-7-4-7 4 2.5-7L2 9h7l3-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) : variant === 'user' ? (
    <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18, color: palette.fg }}>
      <path d="M16 14a4 4 0 1 0-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18, color: palette.fg }}>
      <path d="M4 19V5M10 19V9M16 19v-6M22 19V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div style={{ background: 'white', border: `1px solid ${palette.ring}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: palette.bg }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)' }}>
          {icon}
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


