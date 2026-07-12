import { useState, useRef, useEffect } from 'react';
import { FileText, BarChart3, Download, Users, Calendar, Plus, Share2, MoreVertical, Info, TrendingUp, AlertTriangle, Grid3x3, PieChart as PieChartIcon, X, Pencil, Trash2 } from 'lucide-react';
import StatCard from '../components/StatCard';
import { getReports, createReport, updateReport, deleteReport } from '../services/api';

const REPORT_TYPES = ['Performance Summary', 'Risk Analysis', 'Model Evaluation', 'Grade Analysis', 'Custom Report'];
const REPORT_COLORS = { 'Performance Summary': '#6366F1', 'Risk Analysis': '#F97316', 'Model Evaluation': '#3B82F6', 'Grade Analysis': '#22C55E', 'Custom Report': '#EF4444' };
const REPORT_TYPES_TONES = { 'Performance Summary': 'bg-indigo-100 text-indigo-700', 'Risk Analysis': 'bg-orange-100 text-orange-700', 'Model Evaluation': 'bg-blue-100 text-blue-700', 'Grade Analysis': 'bg-green-100 text-green-700', 'Custom Report': 'bg-red-100 text-red-700' };
const TYPE_ICONS = {
  'Performance Summary': { icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  'Risk Analysis': { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  'Model Evaluation': { icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
  'Grade Analysis': { icon: Grid3x3, color: 'text-green-600', bg: 'bg-green-50' },
  'Custom Report': { icon: PieChartIcon, color: 'text-red-600', bg: 'bg-red-50' },
};

const PURPOSES = [
  { icon: <TrendingUp size={14} className="text-indigo-500" />, iconBg: 'bg-indigo-50', label: 'Track overall performance', type: 'Performance Summary', color: '#6366F1' },
  { icon: <AlertTriangle size={14} className="text-orange-500" />, iconBg: 'bg-orange-50', label: 'Identify at-risk students', type: 'Risk Analysis', color: '#F97316' },
  { icon: <BarChart3 size={14} className="text-blue-500" />, iconBg: 'bg-blue-50', label: 'Evaluate model performance', type: 'Model Evaluation', color: '#3B82F6' },
  { icon: <Grid3x3 size={14} className="text-green-500" />, iconBg: 'bg-green-50', label: 'Analyze grade distribution', type: 'Grade Analysis', color: '#22C55E' },
  { icon: <PieChartIcon size={14} className="text-red-500" />, iconBg: 'bg-red-50', label: 'Other / Custom analysis', type: 'Custom Report', color: '#EF4444' },
];

const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2.5 outline-none text-gray-700 text-sm";
const labelClass = "text-sm text-gray-600 block mb-1.5";
const EMPTY_FORM = { name: '', type: '', fromDate: '', toDate: '', format: 'PDF', description: '' };

function ReportFormFields({ form, onChange }) {
  return (
    <div className="flex flex-col gap-4">
      <div><label className={labelClass}>Report Name *</label>
        <input type="text" placeholder="e.g. Term 1 Performance Summary" value={form.name} onChange={(e) => onChange('name', e.target.value)} className={inputClass} /></div>
      <div><label className={labelClass}>Report Type *</label>
        <select value={form.type} onChange={(e) => onChange('type', e.target.value)} className={inputClass}>
          <option value="">— Select type —</option>
          {REPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelClass}>From Date</label>
          <input type="date" value={form.fromDate} onChange={(e) => onChange('fromDate', e.target.value)} className={inputClass} /></div>
        <div><label className={labelClass}>To Date</label>
          <input type="date" value={form.toDate} onChange={(e) => onChange('toDate', e.target.value)} className={inputClass} /></div>
      </div>
      <div><label className={labelClass}>Format</label>
        <select value={form.format} onChange={(e) => onChange('format', e.target.value)} className={inputClass}>
          <option>PDF</option><option>Excel</option>
        </select></div>
      <div><label className={labelClass}>Description</label>
        <input type="text" placeholder="Short description" value={form.description} onChange={(e) => onChange('description', e.target.value)} className={inputClass} /></div>
    </div>
  );
}

function DonutChart({ segments, centerLabel, centerValue, size = 150, strokeWidth = 26 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2, cy = size / 2;
  let cumulative = 0;
  const total = segments.reduce((s, seg) => s + (seg.value || 0), 0);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} />
      ) : segments.map((seg, i) => {
        const pct = (seg.value / total) * 100;
        const dash = (pct / 100) * circumference;
        const offset = -(cumulative / 100) * circumference;
        cumulative += pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={radius} fill="none"
            stroke={seg.color} strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`} />
        );
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="#1F2937">{centerValue}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#6B7280">{centerLabel}</text>
    </svg>
  );
}

function AreaLineChart({ reports }) {
  const width = 300, height = 170;
  const padL = 30, padR = 10, padT = 15, padB = 30;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  // Group reports by day for last 30 days
  const now = new Date();
  const days = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (5 - i) * 5);
    return d;
  });

  const counts = days.map((day) => {
    const dayStr = day.toDateString();
    return reports.filter(r => {
      const rDate = new Date(r.generated_on || '');
      return !isNaN(rDate) && rDate.toDateString() === dayStr;
    }).length;
  });

  const maxV = Math.max(...counts, 5);
  const toX = (i) => padL + (i / (days.length - 1)) * chartW;
  const toY = (v) => padT + chartH - (v / maxV) * chartH;
  const linePath = counts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`).join(' ');
  const areaPath = `${linePath} L ${toX(counts.length - 1)} ${toY(0)} L ${toX(0)} ${toY(0)} Z`;
  const yTicks = [0, Math.round(maxV / 2), maxV];

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={padL} y1={toY(v)} x2={width - padR} y2={toY(v)} stroke="#F3F4F6" strokeWidth="1" />
          <text x={padL - 4} y={toY(v) + 3} textAnchor="end" fontSize="8" fill="#9CA3AF">{v}</text>
        </g>
      ))}
      {days.map((d, i) => (
        <text key={i} x={toX(i)} y={height - 8} textAnchor="middle" fontSize="7" fill="#9CA3AF">
          {d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
        </text>
      ))}
      <path d={areaPath} fill="#6366F1" opacity="0.08" />
      <path d={linePath} fill="none" stroke="#6366F1" strokeWidth="2" strokeLinejoin="round" />
      {counts.map((v, i) => (
        <circle key={i} cx={toX(i)} cy={toY(v)} r="3.5" fill="#6366F1" />
      ))}
    </svg>
  );
}

export default function Reports({ showToast }) {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Report Types');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showAllReports, setShowAllReports] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [form, setForm] = useState(EMPTY_FORM);
  const datePickerRef = useRef(null);

  const load = () => getReports().then(setReports).catch(() => {});
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) setShowDatePicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleFormChange = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  const handleCreate = async () => {
    if (!form.name.trim() || !form.type) { showToast('Please fill in report name and type.'); return; }
    const range = form.fromDate && form.toDate ? `${formatDate(form.fromDate)} – ${formatDate(form.toDate)}` : '—';
    try {
      await createReport({ name: form.name.trim(), type: form.type, description: form.description, dateRange: range, format: form.format });
      await load();
      setForm(EMPTY_FORM);
      setShowCreateModal(false);
      showToast('Report created successfully.');
    } catch (err) { showToast(err.message || 'Failed to create report'); }
  };

  const handleEdit = async () => {
    const range = form.fromDate && form.toDate ? `${formatDate(form.fromDate)} – ${formatDate(form.toDate)}` : null;
    try {
      await updateReport(editingId, { name: form.name, type: form.type, description: form.description, dateRange: range, format: form.format });
      await load();
      setEditingId(null);
      setForm(EMPTY_FORM);
      showToast('Report updated.');
    } catch (err) { showToast(err.message || 'Failed to update report'); }
  };

  const handleDelete = async () => {
    try {
      await deleteReport(deletingId);
      await load();
      setDeletingId(null);
      showToast('Report deleted.');
    } catch (err) { showToast(err.message || 'Failed to delete report'); }
  };

  const handleDownload = (r) => {
    const content = [`EduPredict — ${r.name}`, `Type: ${r.type}`, `Date Range: ${r.date_range}`, `Generated On: ${r.generated_on}`, `Generated By: ${r.generated_by}`, ``, `Description: ${r.description}`, ``, `— Report data populates once connected to live system. —`].join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${r.name.replace(/\s+/g, '_')}.txt`; a.click();
    URL.revokeObjectURL(url);
    showToast('Report downloaded.');
  };

  const handleShare = (r) => {
    navigator.clipboard.writeText(`EduPredict Report: ${r.name} (${r.type}) — Generated ${r.generated_on}`).then(() => showToast('Copied to clipboard.')).catch(() => showToast('Could not copy.'));
  };

  const filtered = reports.filter((r) => {
    const matchSearch = (r.name || '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'All Report Types' || r.type === typeFilter;
    return matchSearch && matchType;
  });

  // Compute real chart data
  const overviewSegments = REPORT_TYPES.map((type) => ({
    label: type, color: REPORT_COLORS[type], value: reports.filter(r => r.type === type).length,
  })).filter(s => s.value > 0);

  const purposeData = PURPOSES.map((p) => {
    const count = reports.filter(r => r.type === p.type).length;
    const pct = reports.length > 0 ? Math.round((count / reports.length) * 100) : 0;
    return { ...p, pct, count };
  });

  const ReportRow = ({ r, index }) => {
    const typeData = TYPE_ICONS[r.type] || TYPE_ICONS['Custom Report'];
    const TypeIcon = typeData.icon;
    return (
      <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
        <td className="py-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${typeData.bg} shrink-0`}>
              <TypeIcon size={16} className={typeData.color} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{r.name}</p>
              <p className="text-xs text-gray-400">{r.description}</p>
            </div>
          </div>
        </td>
        <td className="py-4"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${REPORT_TYPES_TONES[r.type] || 'bg-gray-100 text-gray-500'}`}>{r.type}</span></td>
        <td className="py-4 text-xs text-gray-500">{r.generated_on}</td>
        <td className="py-4 text-xs text-gray-500">{r.date_range}</td>
        <td className="py-4 text-xs text-gray-500">{r.generated_by}</td>
        <td className="py-4">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit ${r.format === 'PDF' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            <FileText size={11} /> {r.format}
          </span>
        </td>
        <td className="py-4">
          <div className="flex items-center gap-1 relative">
            <button onClick={() => handleDownload(r)} title="Download" className="text-gray-400 hover:text-indigo-600 p-1 rounded hover:bg-gray-100"><Download size={15} /></button>
            <button onClick={() => handleShare(r)} title="Share" className="text-gray-400 hover:text-indigo-600 p-1 rounded hover:bg-gray-100"><Share2 size={15} /></button>
            <button onClick={() => setOpenMenuId(openMenuId === r.id ? null : r.id)} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"><MoreVertical size={15} /></button>
            {openMenuId === r.id && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-32 z-20">
                <button onClick={() => { setForm({ name: r.name, type: r.type, fromDate: '', toDate: '', format: r.format, description: r.description || '' }); setEditingId(r.id); setOpenMenuId(null); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"><Pencil size={13} /> Edit</button>
                <button onClick={() => { setDeletingId(r.id); setOpenMenuId(null); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"><Trash2 size={13} /> Delete</button>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">Reports <FileText size={22} className="text-indigo-500" /></h1>
        <p className="text-sm text-gray-500 mt-1">Generate, view and download insightful reports about student performance.</p>
      </div>

      <div className="flex gap-5 mb-6">
        <StatCard icon={<FileText size={20} className="text-indigo-600" />} iconBg="bg-indigo-100" label="Total Reports" value={reports.length || '—'} delta="Live from database" deltaUp />
        <StatCard icon={<BarChart3 size={20} className="text-blue-600" />} iconBg="bg-blue-100" label="Reports Generated" value={reports.length || '—'} delta="All time" deltaUp />
        <StatCard icon={<Download size={20} className="text-orange-600" />} iconBg="bg-orange-100" label="Downloads" value="—" delta="Track downloads" deltaUp />
        <StatCard icon={<Users size={20} className="text-green-600" />} iconBg="bg-green-100" label="Shared Reports" value="—" delta="Via clipboard" deltaUp />
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white shadow-sm flex-1 max-w-xs">
          <FileText size={14} className="text-gray-400 shrink-0" />
          <input type="text" placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="outline-none text-sm text-gray-700 flex-1 placeholder:text-gray-400" />
        </div>

        <div className="relative" ref={datePickerRef}>
          <button onClick={() => setShowDatePicker((s) => !s)}
            className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 bg-white shadow-sm">
            <Calendar size={15} />
            {dateRange.from && dateRange.to ? `${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}` : 'Select date range'}
          </button>
          {showDatePicker && (
            <div className="absolute top-12 left-0 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-30 w-72">
              <p className="text-xs font-semibold text-gray-700 mb-3">Filter by date created</p>
              <div className="flex flex-col gap-3">
                <div><label className="text-xs text-gray-500 block mb-1">From</label>
                  <input type="date" value={dateRange.from} onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))} className={inputClass} /></div>
                <div><label className="text-xs text-gray-500 block mb-1">To</label>
                  <input type="date" value={dateRange.to} onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))} className={inputClass} /></div>
                <div className="flex gap-2">
                  <button onClick={() => setDateRange({ from: '', to: '' })} className="flex-1 border border-gray-200 rounded-lg py-2 text-xs text-gray-600 hover:bg-gray-50">Clear</button>
                  <button onClick={() => setShowDatePicker(false)} className="flex-1 text-white font-semibold py-2 rounded-lg text-xs" style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>Apply</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white shadow-sm ml-auto">
          <option>All Report Types</option>
          {REPORT_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <button onClick={() => { setForm(EMPTY_FORM); setShowCreateModal(true); }}
          className="flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-lg text-sm"
          style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>
          <Plus size={16} /> Create New Report
        </button>
      </div>

      {/* Charts row — now shows real data */}
      <div className="grid grid-cols-3 gap-5 mb-5">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Reports Overview</h3>
          <div className="flex items-center gap-4">
            <DonutChart segments={overviewSegments} centerValue={reports.length || '—'} centerLabel="Total Reports" />
            <div className="flex flex-col gap-2">
              {REPORT_TYPES.map((type) => {
                const count = reports.filter(r => r.type === type).length;
                return (
                  <div key={type} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: REPORT_COLORS[type] }} />
                    <div>
                      <p className="text-xs text-gray-600 leading-tight">{type}</p>
                      <p className="text-xs text-gray-400">{count > 0 ? count : '—'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {reports.length === 0 && (
            <div className="flex items-center gap-1 mt-3 bg-indigo-50 rounded-lg px-3 py-2">
              <Info size={12} className="text-indigo-400 shrink-0" />
              <p className="text-xs text-indigo-500">Create a report to see statistics here.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Reports Generated Over Time</h3>
          </div>
          <AreaLineChart reports={reports} />
          {reports.length === 0 && (
            <p className="text-xs text-gray-400 text-center mt-2">No reports yet — create one to see trends.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Reports by Purpose</h3>
          <div className="flex flex-col gap-4">
            {purposeData.map((p) => (
              <div key={p.label} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.iconBg} shrink-0`}>{p.icon}</div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">{p.label}</p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ background: p.color, width: `${p.pct}%` }} />
                  </div>
                </div>
                <span className="text-xs text-gray-500 shrink-0">{p.pct > 0 ? `${p.pct}%` : '—'}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 mt-4 bg-indigo-50 rounded-lg px-3 py-2">
            <Info size={12} className="text-indigo-400 shrink-0" />
            <p className="text-xs text-indigo-500">Reports help you make data-driven decisions.</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-800">Recent Reports</h2>
          <button onClick={() => setShowAllReports(true)} className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 shadow-sm">View All Reports</button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="pb-3 font-medium">Report Name</th>
              <th className="pb-3 font-medium">Type</th>
              <th className="pb-3 font-medium">Generated On</th>
              <th className="pb-3 font-medium">Date Range</th>
              <th className="pb-3 font-medium">Generated By</th>
              <th className="pb-3 font-medium">Format</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400 italic">
                {reports.length === 0 ? 'No reports yet — click "Create New Report" to get started.' : 'No results found.'}
              </td></tr>
            ) : filtered.slice(0, 5).map((r) => <ReportRow key={r.id} r={r} index={r.id} />)}
          </tbody>
        </table>
        {filtered.length > 0 && <p className="text-xs text-gray-400 mt-4">Showing {Math.min(filtered.length, 5)} of {filtered.length} reports</p>}
      </div>

      {/* View All Dialog */}
      {showAllReports && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-5xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">All Reports ({reports.length})</h2>
              <button onClick={() => setShowAllReports(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="pb-3 font-medium">Report Name</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Generated On</th>
                    <th className="pb-3 font-medium">Date Range</th>
                    <th className="pb-3 font-medium">Generated By</th>
                    <th className="pb-3 font-medium">Format</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr><td colSpan={7} className="py-8 text-center text-xs text-gray-400 italic">No reports yet.</td></tr>
                  ) : reports.map((r) => <ReportRow key={r.id} r={r} index={r.id} />)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-gray-800">Create New Report</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <p className="text-xs text-gray-400 mb-5">Configure your report and generate it instantly.</p>
            <ReportFormFields form={form} onChange={handleFormChange} />
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} className="flex-1 text-white font-semibold py-2.5 rounded-lg text-sm" style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>Generate Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-gray-800">Edit Report</h2>
              <button onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <p className="text-xs text-gray-400 mb-5">Update the details of this report.</p>
            <ReportFormFields form={form} onChange={handleFormChange} />
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleEdit} className="flex-1 text-white font-semibold py-2.5 rounded-lg text-sm" style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3 mx-auto"><Trash2 size={22} className="text-red-500" /></div>
            <h2 className="font-bold text-gray-800 mb-1">Delete Report?</h2>
            <p className="text-xs text-gray-400 mb-5">Are you sure? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50">No, Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-lg text-sm">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
