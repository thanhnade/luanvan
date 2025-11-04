import { useEffect, useState } from 'react';

function ClusterOverview() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    nodes: 0,
    pods: 0,
    cpuTotal: 0, // cores
    cpuUsed: 0,  // cores
    memTotal: 0, // GiB
    memUsed: 0,  // GiB
  });
  const [chartType, setChartType] = useState('donut'); // 'donut' | 'bar' | 'gauge'

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      // TODO: Replace by real API calls (e.g., /api/cluster/overview)
      await new Promise(r => setTimeout(r, 400));
      setStats({ nodes: 5, pods: 142, cpuTotal: 32, cpuUsed: 18.6, memTotal: 128, memUsed: 81.3 });
    } finally {
      setLoading(false);
    }
  }

  const cpuPct = stats.cpuTotal ? Math.min(100, Math.round((stats.cpuUsed / stats.cpuTotal) * 100)) : 0;
  const memPct = stats.memTotal ? Math.min(100, Math.round((stats.memUsed / stats.memTotal) * 100)) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
        <ChartToggle label="Donut" variant="donut" active={chartType==='donut'} onClick={()=>setChartType('donut')} />
        <ChartToggle label="Bar" variant="bar" active={chartType==='bar'} onClick={()=>setChartType('bar')} />
        <ChartToggle label="Gauge" variant="gauge" active={chartType==='gauge'} onClick={()=>setChartType('gauge')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
        <StatCard title="Nodes" primary={`${stats.nodes}`} description="Total cluster nodes" variant="nodes" />
        <StatCard title="Pods" primary={`${stats.pods}`} description="Total running pods" variant="pods" />
        <StatCard title="CPU" primary={`${stats.cpuUsed} / ${stats.cpuTotal} cores`} description={`${cpuPct}% utilized`} variant="cpu" />
        <StatCard title="Memory" primary={`${stats.memUsed} / ${stats.memTotal} GiB`} description={`${memPct}% utilized`} variant="mem" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {chartType === 'donut' && (
          <>
            <DonutPanel title="CPU utilization" percent={cpuPct} accent="#2563eb" />
            <DonutPanel title="Memory utilization" percent={memPct} accent="#16a34a" />
          </>
        )}
        {chartType === 'bar' && (
          <>
            <BarPanel title="CPU utilization" percent={cpuPct} accent="#2563eb" />
            <BarPanel title="Memory utilization" percent={memPct} accent="#16a34a" />
          </>
        )}
        {chartType === 'gauge' && (
          <>
            <GaugePanel title="CPU utilization" percent={cpuPct} accent="#2563eb" />
            <GaugePanel title="Memory utilization" percent={memPct} accent="#16a34a" />
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, primary, description, variant }) {
  const palette = {
    nodes: { bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', fg: '#1e40af', ring: '#bfdbfe' },
    pods: { bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)', fg: '#155e75', ring: '#a5f3fc' },
    cpu: { bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', fg: '#4c1d95', ring: '#ddd6fe' },
    mem: { bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', fg: '#166534', ring: '#bbf7d0' },
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
        <div style={{ color: '#0f172a', fontSize: 20, fontWeight: 700 }}>{primary}</div>
        <div style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>{description}</div>
      </div>
    </div>
  );
}

function ChartToggle({ label, variant='donut', active, onClick }) {
  const palette = {
    donut: { bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', fg: '#1e40af', ring: '#c7d2fe' },
    bar:   { bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', fg: '#4c1d95', ring: '#ddd6fe' },
    gauge: { bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)', fg: '#155e75', ring: '#a5f3fc' }
  }[variant] || { bg: '#f8fafc', fg: '#334155', ring: '#e5e7eb' };
  const icon = variant === 'donut' ? (
    <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16 }}>
      <path d="M12 2a10 10 0 1 0 10 10h-8a2 2 0 0 1-2-2V2z" fill="currentColor"/>
      <circle cx="12" cy="12" r="6" fill="#fff"/>
    </svg>
  ) : variant === 'bar' ? (
    <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16 }}>
      <path d="M4 20V8M10 20V4M16 20v-6M22 20v-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16 }}>
      <path d="M4 12a8 8 0 1 1 16 0" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M12 12l5-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
  return (
    <button
      onClick={onClick}
      className="modal-action-btn"
      style={{
        width: 'auto', padding: '8px 12px', borderRadius: 999,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: active ? palette.bg : '#ffffff',
        color: palette.fg,
        border: `1px solid ${active ? palette.ring : '#e5e7eb'}`,
        boxShadow: active ? '0 6px 18px rgba(37, 99, 235, 0.15)' : '0 1px 2px rgba(0,0,0,0.04)',
        transition: 'all .15s ease'
      }}
    >
      <span style={{ display: 'inline-flex', color: palette.fg }}>{icon}</span>
      <span style={{ fontWeight: 700 }}>{label}</span>
    </button>
  );
}

function UsagePanel({ title, percent, accent }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ color: '#0f172a', fontWeight: 700 }}>{title}</div>
        <div style={{ color: '#0f172a', fontWeight: 700 }}>{percent}%</div>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: '#eef2f7', overflow: 'hidden' }}>
        <div style={{ width: `${percent}%`, height: '100%', background: accent, transition: 'width .3s ease' }} />
      </div>
    </div>
  );
}

function DonutPanel({ title, percent, accent }) {
  const size = 140;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (percent / 100) * circumference;
  const rest = circumference - dash;
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size/2} ${size/2})`}>
          <circle cx={size/2} cy={size/2} r={radius} stroke="#eef2f7" strokeWidth={stroke} fill="none" />
          <circle cx={size/2} cy={size/2} r={radius} stroke={accent} strokeWidth={stroke} fill="none" strokeDasharray={`${dash} ${rest}`} strokeLinecap="round" />
        </g>
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" style={{ fontWeight: 700, fill: '#0f172a' }}>{percent}%</text>
      </svg>
      <div>
        <div style={{ color: '#0f172a', fontWeight: 700 }}>{title}</div>
        <div style={{ color: '#64748b', fontSize: 13 }}>Utilization</div>
      </div>
    </div>
  );
}

function BarPanel({ title, percent, accent }) {
  return (
    <UsagePanel title={title} percent={percent} accent={accent} />
  );
}

function GaugePanel({ title, percent, accent }) {
  const size = 180;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const startAngle = Math.PI; // 180°
  const endAngle = Math.PI + Math.PI; // 360°
  const angle = startAngle + (percent / 100) * Math.PI;
  const arc = describeArc(size/2, size/2, r, 180, 180 + percent * 1.8);

  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, textAlign: 'center' }}>
      <div style={{ color: '#0f172a', fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <svg width={size} height={size/1.6} viewBox={`0 0 ${size} ${size/1.6}`}
        style={{ display: 'block', margin: '0 auto' }}>
        <path d={describeArc(size/2, size/2, r, 180, 360)} stroke="#eef2f7" strokeWidth={stroke} fill="none" />
        <path d={arc} stroke={accent} strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={4} fill={accent} />
      </svg>
      <div style={{ color: '#0f172a', fontWeight: 700 }}>{percent}%</div>
    </div>
  );
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const angle = (angleDeg - 90) * Math.PI / 180.0;
  return { x: cx + (r * Math.cos(angle)), y: cy + (r * Math.sin(angle)) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', start.x, start.y,
    'A', r, r, 0, largeArcFlag, 0, end.x, end.y
  ].join(' ');
}

export default ClusterOverview;


