import { useState, useEffect } from 'react';
import { Box, Trophy, TrendingUp, CheckCircle2, Search, Plus, Eye, EyeOff, MoreVertical, Info, Layers, Clock, Activity, Trees, GitBranch, Ruler, LineChart, Rocket, Zap, Brain, X, Pencil, Trash2 } from 'lucide-react';
import StatCard from '../components/StatCard';
import { getModels, trainModel, updateModel, deleteModel } from '../services/api';

const ICON_MAP = {
  'Random Forest': { Icon: Trees, color: 'text-green-600', bg: 'bg-green-50' },
  'Decision Tree': { Icon: GitBranch, color: 'text-blue-600', bg: 'bg-blue-50' },
  'SVM': { Icon: Ruler, color: 'text-purple-600', bg: 'bg-purple-50' },
  'Linear Regression': { Icon: LineChart, color: 'text-orange-600', bg: 'bg-orange-50' },
  'XGBoost': { Icon: Rocket, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'LightGBM': { Icon: Zap, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  'MLP Regressor': { Icon: Brain, color: 'text-pink-600', bg: 'bg-pink-50' },
};

const STATUS_TONES = { Deployed: 'bg-green-100 text-green-700', Trained: 'bg-blue-100 text-blue-700', Training: 'bg-orange-100 text-orange-700' };
const TYPE_TONES = { Regression: 'bg-green-50 text-green-600', Classification: 'bg-cyan-50 text-cyan-600' };
const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2.5 outline-none text-gray-700 text-sm";
const labelClass = "text-sm text-gray-600 block mb-1.5";

const ALGORITHMS = ['Random Forest','Decision Tree','SVM','Linear Regression','XGBoost','LightGBM','MLP Regressor'];
const DATASETS = ['Student Academic Performance','Student Demographics','Assignment & Assessment Data','Attendance Records','Behavior & Engagement Data'];
const EMPTY_TRAIN = { name: '', algorithm: '', dataset: 'Student Academic Performance', target: 'Final Grade (0-20)', split: '75 / 25' };

export default function Models({ showToast }) {
  const [models, setModels] = useState([]);
  const [hidden, setHidden] = useState({});
  const [openMenu, setOpenMenu] = useState(null);
  const [showTrainModal, setShowTrainModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [trainForm, setTrainForm] = useState(EMPTY_TRAIN);
  const [editName, setEditName] = useState('');

  const load = () => getModels().then(setModels).catch(() => {});
  useEffect(() => { load(); }, []);

  const toggleHide = (id) => setHidden((p) => ({ ...p, [id]: !p[id] }));

  const handleTrain = async () => {
    if (!trainForm.name.trim() || !trainForm.algorithm) { showToast('Please fill in model name and algorithm.'); return; }
    try {
      await trainModel({ name: trainForm.name.trim(), algorithm: trainForm.algorithm, dataset: trainForm.dataset });
      await load();
      setShowTrainModal(false);
      setTrainForm(EMPTY_TRAIN);
      showToast('Model training started successfully.');
    } catch (err) { showToast(err.message || 'Failed to start training'); }
  };

  const handleEdit = async () => {
    try {
      await updateModel(editingId, { name: editName });
      await load();
      setEditingId(null);
      showToast('Model updated.');
    } catch (err) { showToast(err.message || 'Failed to update model'); }
  };

  const handleDelete = async () => {
    try {
      await deleteModel(deletingId);
      await load();
      setDeletingId(null);
      showToast('Model deleted.');
    } catch (err) { showToast(err.message || 'Failed to delete model'); }
  };

  const deployed = models.find((m) => m.status === 'Deployed');
  const avgR2 = models.filter((m) => m.r2_score && m.r2_score !== '—')
    .reduce((sum, m, _, arr) => sum + parseFloat(m.r2_score) / arr.length, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">Models <Box size={22} className="text-indigo-500" /></h1>
        <p className="text-sm text-gray-500 mt-1">Manage, compare and deploy machine learning models.</p>
      </div>

      <div className="flex gap-5 mb-6">
        <StatCard icon={<Layers size={20} className="text-indigo-600" />} iconBg="bg-indigo-100" label="Total Models" value={models.length || '—'} delta="—" deltaUp />
        <StatCard icon={<Trophy size={20} className="text-blue-600" />} iconBg="bg-blue-100" label="Best Model (Active)" value={deployed?.name || '—'} delta={deployed ? `R² = ${deployed.r2_score}` : '—'} deltaUp />
        <StatCard icon={<TrendingUp size={20} className="text-orange-600" />} iconBg="bg-orange-100" label="Average R² Score" value={avgR2 > 0 ? avgR2.toFixed(2) : '—'} delta="Across trained models" deltaUp />
        <StatCard icon={<CheckCircle2 size={20} className="text-green-600" />} iconBg="bg-green-100" label="Models in Production" value={deployed ? '1' : '—'} delta="No change" deltaUp />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs bg-white shadow-sm">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input type="text" placeholder="Search models..." className="outline-none text-sm text-gray-700 flex-1 placeholder:text-gray-400" />
          </div>
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white shadow-sm ml-auto">
            <option>All Types</option><option>Regression</option><option>Classification</option>
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white shadow-sm">
            <option>All Status</option><option>Deployed</option><option>Trained</option><option>Training</option>
          </select>
          <button onClick={() => setShowTrainModal(true)}
            className="flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-lg text-sm"
            style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>
            <Plus size={16} /> Train New Model
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="pb-3 font-medium">Model Name</th>
              <th className="pb-3 font-medium">Type</th>
              <th className="pb-3 font-medium">Algorithm</th>
              <th className="pb-3 font-medium">R² Score</th>
              <th className="pb-3 font-medium">MAE</th>
              <th className="pb-3 font-medium">RMSE</th>
              <th className="pb-3 font-medium">Trained On</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Last Trained</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {models.length === 0 ? (
              <tr><td colSpan={10} className="py-12 text-center text-sm text-gray-400 italic">No models yet.</td></tr>
            ) : models.map((m) => {
              const iconData = ICON_MAP[m.algorithm] || ICON_MAP['MLP Regressor'];
              const IconComp = iconData.Icon;
              return (
                <tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${hidden[m.id] ? 'opacity-40' : ''}`}>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${m.icon_bg || iconData.bg} shrink-0`}>
                        <IconComp size={18} className={m.icon_color || iconData.color} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{m.name}</p>
                        <p className="text-xs text-gray-400">{m.algorithm} model</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_TONES[m.model_type]}`}>{m.model_type}</span></td>
                  <td className="py-4 text-sm text-gray-600">{m.algorithm}</td>
                  <td className="py-4 text-sm font-bold text-gray-600">{m.r2_score}</td>
                  <td className="py-4 text-sm text-gray-500">{m.mae}</td>
                  <td className="py-4 text-sm text-gray-500">{m.rmse}</td>
                  <td className="py-4 text-xs text-gray-500 max-w-28">{m.trained_on}</td>
                  <td className="py-4"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_TONES[m.status] || 'bg-gray-100 text-gray-500'}`}>{m.status}</span></td>
                  <td className="py-4 text-xs text-gray-500">{m.last_trained}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-1 relative">
                      <button onClick={() => toggleHide(m.id)} title={hidden[m.id] ? 'Show' : 'Hide'}
                        className="text-gray-400 hover:text-indigo-600 p-1 rounded hover:bg-gray-100">
                        {hidden[m.id] ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button onClick={() => setOpenMenu(openMenu === m.id ? null : m.id)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
                        <MoreVertical size={15} />
                      </button>
                      {openMenu === m.id && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-32 z-20">
                          <button onClick={() => { setEditName(m.name); setEditingId(m.id); setOpenMenu(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                            <Pencil size={13} /> Edit
                          </button>
                          <button onClick={() => { setDeletingId(m.id); setOpenMenu(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-4">Showing 1 to {models.length} of {models.length} models</p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Model Performance Comparison</h3>
          </div>
          <div className="flex items-end gap-2 h-32 px-1 pt-4 border-b border-gray-100">
            {models.slice(0, 7).map((m, i) => {
              const iconData = ICON_MAP[m.algorithm] || ICON_MAP['MLP Regressor'];
              const r2 = parseFloat(m.r2_score);
              const height = r2 > 0 ? Math.round(r2 * 100) : 8;
              return (
                <div key={m.id} className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
                  {r2 > 0 && <span className="text-xs text-gray-600 font-medium">{m.r2_score}</span>}
                  <div className="w-6 rounded-t-md" style={{ height: `${height}px`, background: '#6366F1' }} />
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-1 mt-4 bg-indigo-50 rounded-lg px-3 py-2">
            <Info size={12} className="text-indigo-400 shrink-0" />
            <p className="text-xs text-indigo-500">Higher R² score indicates better model performance.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Model Types Distribution</h3>
          <div className="flex flex-col gap-2.5">
            {[
              { label: 'Regression', color: '#22C55E', count: models.filter(m => m.model_type === 'Regression').length },
              { label: 'Classification', color: '#8B5CF6', count: models.filter(m => m.model_type === 'Classification').length },
            ].map((d) => (
              <div key={d.label} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                <p className="text-xs text-gray-600">{d.label} ({d.count})</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Model Overview</h3>
          {[
            { icon: <Layers size={14} />, label: 'Total Models', value: models.length },
            { icon: <CheckCircle2 size={14} />, label: 'Deployed Models', value: models.filter(m => m.status === 'Deployed').length },
            { icon: <Activity size={14} />, label: 'In Training', value: models.filter(m => m.status === 'Training').length },
            { icon: <Clock size={14} />, label: 'Last Activity', value: models[0]?.last_trained || '—' },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-2 text-gray-500">{row.icon}<span className="text-xs">{row.label}</span></div>
              <span className="text-xs font-semibold text-gray-700">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Train Modal */}
      {showTrainModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-gray-800">Train New Model</h2>
              <button onClick={() => setShowTrainModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <p className="text-xs text-gray-400 mb-5">Configure and start training a new prediction model.</p>
            <div className="flex flex-col gap-4">
              <div><label className={labelClass}>Model Name *</label>
                <input type="text" placeholder="e.g. My Custom Random Forest" value={trainForm.name}
                  onChange={(e) => setTrainForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} /></div>
              <div><label className={labelClass}>Algorithm *</label>
                <select value={trainForm.algorithm} onChange={(e) => setTrainForm((p) => ({ ...p, algorithm: e.target.value }))} className={inputClass}>
                  <option value="">— Select algorithm —</option>
                  {ALGORITHMS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select></div>
              <div><label className={labelClass}>Training Dataset *</label>
                <select value={trainForm.dataset} onChange={(e) => setTrainForm((p) => ({ ...p, dataset: e.target.value }))} className={inputClass}>
                  {DATASETS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select></div>
              <div><label className={labelClass}>Target Variable</label>
                <select value={trainForm.target} onChange={(e) => setTrainForm((p) => ({ ...p, target: e.target.value }))} className={inputClass}>
                  <option>Final Grade (0-20)</option><option>Pass / Fail</option><option>Risk Level</option>
                </select></div>
              <div><label className={labelClass}>Train / Test Split</label>
                <select value={trainForm.split} onChange={(e) => setTrainForm((p) => ({ ...p, split: e.target.value }))} className={inputClass}>
                  <option>75 / 25</option><option>80 / 20</option><option>70 / 30</option>
                </select></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowTrainModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleTrain} className="flex-1 text-white font-semibold py-2.5 rounded-lg text-sm"
                style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>Start Training</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Edit Model</h2>
              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div><label className={labelClass}>Model Name</label>
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} /></div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditingId(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleEdit} className="flex-1 text-white font-semibold py-2.5 rounded-lg text-sm"
                style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deletingId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3 mx-auto">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h2 className="font-bold text-gray-800 mb-1">Delete Model?</h2>
            <p className="text-xs text-gray-400 mb-2">Are you sure you want to delete this model?</p>
            <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2 mb-5">
              ⚠️ Warning: Deleting this model may slow down or reduce the accuracy of predictions if it is currently in use.
            </p>
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
