import { useState, useEffect } from 'react';
import { Database, BarChart3, Users, CheckCircle2, Search, Plus, Eye, EyeOff, MoreVertical, Info, X, Pencil, Trash2 } from 'lucide-react';
import StatCard from '../components/StatCard';
import { getDatasets, addDataset, updateDataset, deleteDataset } from '../services/api';

const SOURCE_TONES = {
  'School System': 'bg-indigo-100 text-indigo-700',
  'LMS': 'bg-orange-100 text-orange-700',
  'Third Party': 'bg-green-100 text-green-700',
  'Manual Upload': 'bg-blue-100 text-blue-700',
};

const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2.5 outline-none text-gray-700 text-sm";
const labelClass = "text-sm text-gray-600 block mb-1.5";

function DonutChart({ segments, centerLabel, centerValue, size = 120, strokeWidth = 20 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2, cy = size / 2;
  let cumulative = 0;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
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
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="13" fontWeight="700" fill="#1F2937">{centerValue}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#6B7280">{centerLabel}</text>
    </svg>
  );
}

const EMPTY_FORM = { name: '', description: '', source: 'School System', records: '—', features: '—', status: 'Active' };

export default function Dataset({ showToast }) {
  const [datasets, setDatasets] = useState([]);
  const [hidden, setHidden] = useState({});
  const [openMenu, setOpenMenu] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');

  const load = () => getDatasets().then(setDatasets).catch(() => {});
  useEffect(() => { load(); }, []);

  const filtered = datasets.filter((d) =>
    (d.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = datasets.filter((d) => d.status === 'Active').length;

  // Compute quality distribution from real dataset quality scores
  const qualitySegments = (() => {
    const excellent = datasets.filter(d => d.quality_score >= 90).length;
    const good = datasets.filter(d => d.quality_score >= 70 && d.quality_score < 90).length;
    const fair = datasets.filter(d => d.quality_score >= 50 && d.quality_score < 70).length;
    const poor = datasets.filter(d => d.quality_score < 50 && d.quality_score > 0).length;
    return [
      { label: 'Excellent (90-100%)', color: '#22C55E', value: excellent, count: excellent },
      { label: 'Good (70-89%)', color: '#3B82F6', value: good, count: good },
      { label: 'Fair (50-69%)', color: '#F97316', value: fair, count: fair },
      { label: 'Poor (<50%)', color: '#EF4444', value: poor, count: poor },
    ];
  })();

  // Compute source breakdown from real data
  const sourceSegments = (() => {
    const counts = {};
    datasets.forEach(d => { counts[d.source] = (counts[d.source] || 0) + 1; });
    const sourceColors = { 'School System': '#6366F1', 'LMS': '#3B82F6', 'Third Party': '#22C55E', 'Manual Upload': '#F97316' };
    return Object.entries(counts).map(([source, count]) => ({
      label: source, color: sourceColors[source] || '#9CA3AF', value: count, count,
    }));
  })();

  const avgQuality = datasets.length > 0
    ? Math.round(datasets.filter(d => d.quality_score > 0).reduce((s, d) => s + d.quality_score, 0) / (datasets.filter(d => d.quality_score > 0).length || 1))
    : 0;

  const toggleHide = (id) => setHidden((p) => ({ ...p, [id]: !p[id] }));

  const handleAdd = async () => {
    if (!form.name.trim()) { showToast('Dataset name is required'); return; }
    try {
      await addDataset(form);
      await load();
      setShowAddModal(false);
      setForm(EMPTY_FORM);
      showToast('Dataset added successfully.');
    } catch (err) { showToast(err.message || 'Failed to add dataset'); }
  };

  const handleEdit = async () => {
    try {
      await updateDataset(editingId, form);
      await load();
      setEditingId(null);
      setForm(EMPTY_FORM);
      showToast('Dataset updated.');
    } catch (err) { showToast(err.message || 'Failed to update dataset'); }
  };

  const handleDelete = async () => {
    try {
      await deleteDataset(deletingId);
      await load();
      setDeletingId(null);
      showToast('Dataset deleted.');
    } catch (err) { showToast(err.message || 'Failed to delete dataset'); }
  };

  const openEdit = (d) => {
    setForm({ name: d.name, description: d.description || '', source: d.source, records: d.records, features: d.features, status: d.status });
    setEditingId(d.id);
    setOpenMenu(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">Dataset <Database size={22} className="text-indigo-500" /></h1>
        <p className="text-sm text-gray-500 mt-1">Manage and explore the datasets used to train and evaluate our machine learning models.</p>
      </div>

      <div className="flex gap-5 mb-6">
        <StatCard icon={<Database size={20} className="text-indigo-600" />} iconBg="bg-indigo-100" label="Total Datasets" value={datasets.length || '—'} delta="—" deltaUp />
        <StatCard icon={<BarChart3 size={20} className="text-blue-600" />} iconBg="bg-blue-100" label="Total Records" value="1,044" delta="UCI dataset" deltaUp />
        <StatCard icon={<Users size={20} className="text-orange-600" />} iconBg="bg-orange-100" label="Features / Attributes" value="34" delta="No change" deltaUp />
        <StatCard icon={<CheckCircle2 size={20} className="text-green-600" />} iconBg="bg-green-100" label="Active Datasets" value={activeCount || '—'} delta={`${datasets.length - activeCount} inactive`} deltaUp />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs bg-white shadow-sm">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input type="text" placeholder="Search datasets..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none text-sm text-gray-700 flex-1 placeholder:text-gray-400" />
          </div>
          <button onClick={() => { setForm(EMPTY_FORM); setShowAddModal(true); }}
            className="flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-lg text-sm ml-auto"
            style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>
            <Plus size={16} /> Add Dataset
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="pb-3 font-medium">Dataset Name</th>
              <th className="pb-3 font-medium">Source</th>
              <th className="pb-3 font-medium">Records</th>
              <th className="pb-3 font-medium">Features</th>
              <th className="pb-3 font-medium">Last Updated</th>
              <th className="pb-3 font-medium">Quality Score</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-sm text-gray-400 italic">
                {datasets.length === 0 ? 'No datasets yet.' : 'No results found.'}
              </td></tr>
            ) : filtered.map((d) => (
              <tr key={d.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${hidden[d.id] ? 'opacity-40' : ''}`}>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0"><Database size={16} /></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{d.name}</p>
                      <p className="text-xs text-gray-400">{d.description}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4"><span className={`text-xs font-semibold px-3 py-1 rounded-full ${SOURCE_TONES[d.source] || 'bg-gray-100 text-gray-500'}`}>{d.source}</span></td>
                <td className="py-4 text-sm text-gray-500">{d.records}</td>
                <td className="py-4 text-sm text-gray-500">{d.features}</td>
                <td className="py-4 text-xs text-gray-500">{d.last_updated}</td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">{d.quality_score > 0 ? `${d.quality_score}%` : '—'}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-20">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${d.quality_score}%` }} />
                    </div>
                  </div>
                </td>
                <td className="py-4"><span className={`text-xs font-semibold px-3 py-1 rounded-full ${d.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{d.status}</span></td>
                <td className="py-4">
                  <div className="flex items-center gap-1 relative">
                    <button onClick={() => toggleHide(d.id)} title={hidden[d.id] ? 'Show' : 'Hide'}
                      className="text-gray-400 hover:text-indigo-600 p-1 rounded hover:bg-gray-100">
                      {hidden[d.id] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button onClick={() => setOpenMenu(openMenu === d.id ? null : d.id)} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
                      <MoreVertical size={15} />
                    </button>
                    {openMenu === d.id && (
                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-32 z-20">
                        <button onClick={() => openEdit(d)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"><Pencil size={13} /> Edit</button>
                        <button onClick={() => { setDeletingId(d.id); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"><Trash2 size={13} /> Delete</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-4">Showing {filtered.length} of {datasets.length} datasets</p>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Dataset Overview</h3>
          {[
            { label: 'Total Datasets', value: datasets.length || '—' },
            { label: 'Active Datasets', value: activeCount || '—' },
            { label: 'Total Records', value: '1,044' },
            { label: 'Total Features', value: '34' },
            { label: 'Avg Quality Score', value: avgQuality > 0 ? `${avgQuality}%` : '—' },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-500">{row.label}</span>
              <span className="text-xs font-semibold text-gray-700">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Data Quality Overview — now uses real data */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Data Quality Overview</h3>
          <div className="flex items-center gap-4">
            <DonutChart
              segments={qualitySegments}
              centerValue={avgQuality > 0 ? `${avgQuality}%` : '—'}
              centerLabel="Avg Score"
            />
            <div className="flex flex-col gap-2.5">
              {qualitySegments.map((d) => (
                <div key={d.label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <div>
                    <p className="text-xs text-gray-600 leading-tight">{d.label}</p>
                    <p className="text-xs text-gray-400">{d.count} dataset{d.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Source Breakdown — now uses real data */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Data Source Breakdown</h3>
          <div className="flex items-center gap-4">
            <DonutChart
              segments={sourceSegments}
              centerValue={datasets.length || '—'}
              centerLabel="Sources"
            />
            <div className="flex flex-col gap-2.5">
              {sourceSegments.length > 0 ? sourceSegments.map((d) => (
                <div key={d.label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <div>
                    <p className="text-xs text-gray-600 leading-tight">{d.label}</p>
                    <p className="text-xs text-gray-400">{d.count} dataset{d.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              )) : (
                [{ label: 'School System', color: '#6366F1' }, { label: 'LMS', color: '#3B82F6' }, { label: 'Third Party', color: '#22C55E' }, { label: 'Manual Upload', color: '#F97316' }].map(d => (
                  <div key={d.label} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    <p className="text-xs text-gray-600">{d.label}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 bg-indigo-50 rounded-lg px-3 py-2">
            <Info size={12} className="text-indigo-400 shrink-0" />
            <p className="text-xs text-indigo-500">Ensure data is updated regularly to maintain model accuracy.</p>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Add New Dataset</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div><label className={labelClass}>Dataset Name *</label><input type="text" placeholder="e.g. Student Academic Performance" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} /></div>
              <div><label className={labelClass}>Description</label><input type="text" placeholder="Brief description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={inputClass} /></div>
              <div><label className={labelClass}>Source</label>
                <select value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))} className={inputClass}>
                  <option>School System</option><option>LMS</option><option>Third Party</option><option>Manual Upload</option>
                </select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>Records</label><input type="text" placeholder="e.g. 1,044" value={form.records} onChange={(e) => setForm((p) => ({ ...p, records: e.target.value }))} className={inputClass} /></div>
                <div><label className={labelClass}>Features</label><input type="text" placeholder="e.g. 34" value={form.features} onChange={(e) => setForm((p) => ({ ...p, features: e.target.value }))} className={inputClass} /></div>
              </div>
              <div><label className={labelClass}>Status</label>
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className={inputClass}>
                  <option>Active</option><option>Inactive</option>
                </select></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdd} className="flex-1 text-white font-semibold py-2.5 rounded-lg text-sm" style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>Add Dataset</button>
            </div>
          </div>
        </div>
      )}

      {editingId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Edit Dataset</h2>
              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div><label className={labelClass}>Dataset Name *</label><input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} /></div>
              <div><label className={labelClass}>Description</label><input type="text" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={inputClass} /></div>
              <div><label className={labelClass}>Source</label>
                <select value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))} className={inputClass}>
                  <option>School System</option><option>LMS</option><option>Third Party</option><option>Manual Upload</option>
                </select></div>
              <div><label className={labelClass}>Status</label>
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className={inputClass}>
                  <option>Active</option><option>Inactive</option>
                </select></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingId(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleEdit} className="flex-1 text-white font-semibold py-2.5 rounded-lg text-sm" style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {deletingId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3 mx-auto"><Trash2 size={22} className="text-red-500" /></div>
            <h2 className="font-bold text-gray-800 mb-1">Delete Dataset?</h2>
            <p className="text-xs text-gray-400 mb-2">Deleting this dataset may reduce prediction accuracy.</p>
            <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2 mb-5">⚠️ Warning: This action cannot be undone and may affect model performance.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-lg text-sm">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
