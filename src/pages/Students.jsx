import { useState, useEffect, useMemo } from 'react';
import { Users, GraduationCap, AlertTriangle, CheckCircle2, Search, SlidersHorizontal, Plus, MoreVertical, X, Pencil, Trash2 } from 'lucide-react';
import StatCard from '../components/StatCard';
import { getStudents, addStudent, updateStudent, deleteStudent, getAnalytics } from '../services/api';

const GRADE_OPTIONS = ['All Grades','7th Grade','8th Grade','9th Grade','10th Grade','11th Grade','12th Grade','Undergraduate','Postgraduate'];
const PERFORMANCE_OPTIONS = ['All Performance','High Performer','Average Performer','At Risk'];
const STATUS_OPTIONS = ['All Status','Low Risk','Moderate Risk','High Risk'];
const AVATAR_COLORS = ['bg-indigo-100 text-indigo-600','bg-blue-100 text-blue-600','bg-orange-100 text-orange-600','bg-green-100 text-green-600','bg-purple-100 text-purple-600','bg-pink-100 text-pink-600'];

function getInitials(name) { return (name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2); }
function getAvatarColor(name) { return AVATAR_COLORS[(name || 'A').charCodeAt(0) % AVATAR_COLORS.length]; }

const PERF_TONES = { 'High Performer': 'bg-green-100 text-green-700', 'Average Performer': 'bg-blue-100 text-blue-700', 'At Risk': 'bg-red-100 text-red-700' };
const RISK_TONES = { 'Low Risk': 'bg-green-100 text-green-700', 'Moderate Risk': 'bg-orange-100 text-orange-700', 'High Risk': 'bg-red-100 text-red-700' };

const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2.5 outline-none text-gray-700 text-sm";
const labelClass = "text-sm text-gray-600 block mb-1.5";

export default function Students({ headerSearch = '', showToast }) {
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [localSearch, setLocalSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All Grades');
  const [performanceFilter, setPerformanceFilter] = useState('All Performance');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [editForm, setEditForm] = useState({ name: '', email: '', grade: '' });
  const pageSize = 6;

  const load = async () => {
    const [s, a] = await Promise.all([getStudents(), getAnalytics()]);
    setStudents(s);
    setAnalytics(a);
  };

  useEffect(() => { load(); }, []);

  // Re-fetch when header search changes (search via API)
  useEffect(() => {
    if (headerSearch) {
      getStudents({ search: headerSearch }).then(setStudents).catch(() => {});
    } else {
      getStudents().then(setStudents).catch(() => {});
    }
  }, [headerSearch]);

  const activeSearch = localSearch;

  const filtered = useMemo(() => students.filter((s) => {
    const matchSearch = !activeSearch ||
      (s.name || '').toLowerCase().includes(activeSearch.toLowerCase()) ||
      (s.student_id || '').toLowerCase().includes(activeSearch.toLowerCase());
    const matchGrade = gradeFilter === 'All Grades' || s.grade === gradeFilter;
    const matchPerf = performanceFilter === 'All Performance' || s.performance === performanceFilter;
    const matchStatus = statusFilter === 'All Status' || s.risk_level === statusFilter;
    return matchSearch && matchGrade && matchPerf && matchStatus;
  }), [students, activeSearch, gradeFilter, performanceFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const highPerformers = students.filter((s) => s.performance === 'High Performer').length;
  const atRisk = students.filter((s) => s.risk_level === 'High Risk').length;
  const avgAccuracy = analytics?.overall_accuracy ? `${analytics.overall_accuracy}%` : '—';

  const handleAdd = async () => {
    if (!newName.trim()) { showToast('Student name is required'); return; }
    try {
      await addStudent({ name: newName.trim(), email: newEmail.trim(), grade: newGrade });
      await load();
      setNewName(''); setNewEmail(''); setNewGrade('');
      setShowAddModal(false);
      showToast('Student added successfully.');
    } catch (err) { showToast(err.message || 'Failed to add student'); }
  };

  const handleEdit = async () => {
    try {
      await updateStudent(editingStudent.id, editForm);
      await load();
      setEditingStudent(null);
      showToast('Student updated.');
    } catch (err) { showToast(err.message || 'Failed to update student'); }
  };

  const handleDelete = async () => {
    try {
      await deleteStudent(deletingId);
      await load();
      setDeletingId(null);
      showToast('Student deleted.');
    } catch (err) { showToast(err.message || 'Failed to delete student'); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">Students <Users size={22} className="text-gray-500" /></h1>
        <p className="text-sm text-gray-500 mt-1">View and manage student information and performance data.</p>
      </div>

      <div className="flex gap-5 mb-6">
        <StatCard icon={<Users size={20} className="text-indigo-600" />} iconBg="bg-indigo-100" label="Total Students" value={students.length || '—'} delta="Live from database" deltaUp />
        <StatCard icon={<GraduationCap size={20} className="text-blue-600" />} iconBg="bg-blue-100" label="High Performers" value={highPerformers || '—'} delta="From predictions" deltaUp />
        <StatCard icon={<AlertTriangle size={20} className="text-orange-600" />} iconBg="bg-orange-100" label="At Risk Students" value={atRisk || '—'} delta="From predictions" deltaUp={false} />
        <StatCard icon={<CheckCircle2 size={20} className="text-green-600" />} iconBg="bg-green-100"
          label="Average Accuracy" value={avgAccuracy}
          delta={analytics?.total_predictions ? `Based on ${analytics.total_predictions} predictions` : 'Run predictions to see'}
          deltaUp />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-48 bg-white shadow-sm">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input type="text" placeholder="Search by name or ID..." value={localSearch}
              onChange={(e) => { setLocalSearch(e.target.value); setCurrentPage(1); }}
              className="outline-none text-sm text-gray-700 flex-1 placeholder:text-gray-400" />
            {localSearch && <button onClick={() => setLocalSearch('')} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>}
          </div>
          <select value={gradeFilter} onChange={(e) => { setGradeFilter(e.target.value); setCurrentPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white shadow-sm">
            {GRADE_OPTIONS.map((g) => <option key={g}>{g}</option>)}
          </select>
          <select value={performanceFilter} onChange={(e) => { setPerformanceFilter(e.target.value); setCurrentPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white shadow-sm">
            {PERFORMANCE_OPTIONS.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white shadow-sm">
            {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 shadow-sm">
            <SlidersHorizontal size={16} /> Filters
          </button>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-lg text-sm ml-auto"
            style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>
            <Plus size={16} /> Add Student
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="pb-3 font-medium">Student</th>
              <th className="pb-3 font-medium">Student ID</th>
              <th className="pb-3 font-medium">Grade</th>
              <th className="pb-3 font-medium">Performance</th>
              <th className="pb-3 font-medium">Risk Level</th>
              <th className="pb-3 font-medium">Last Prediction</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400 italic">
                {students.length === 0 ? 'No students yet — add a student using the button above.' : 'No results found for your search or filters.'}
              </td></tr>
            ) : paginated.map((s) => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(s.name)}`}>
                      {getInitials(s.name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 text-sm text-gray-500">{s.student_id}</td>
                <td className="py-4 text-sm text-gray-500">{s.grade}</td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    {s.performance ? <span className={`text-xs font-semibold px-3 py-1 rounded-full ${PERF_TONES[s.performance] || 'bg-gray-100 text-gray-500'}`}>{s.performance}</span> : <span className="text-xs text-gray-300">—</span>}
                    {s.confidence && <span className="text-xs text-gray-500">{s.confidence}</span>}
                  </div>
                </td>
                <td className="py-4">
                  {s.risk_level ? <span className={`text-xs font-semibold px-3 py-1 rounded-full ${RISK_TONES[s.risk_level] || 'bg-gray-100 text-gray-500'}`}>{s.risk_level}</span> : <span className="text-xs text-gray-300">—</span>}
                </td>
                <td className="py-4 text-xs text-gray-500">{s.last_prediction}</td>
                <td className="py-4">
                  <div className="flex items-center gap-1 relative">
                    <button onClick={() => setOpenMenu(openMenu === s.id ? null : s.id)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                      <MoreVertical size={18} />
                    </button>
                    {openMenu === s.id && (
                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-32 z-20">
                        <button onClick={() => { setEditForm({ name: s.name, email: s.email || '', grade: s.grade || '' }); setEditingStudent(s); setOpenMenu(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"><Pencil size={13} /> Edit</button>
                        <button onClick={() => { setDeletingId(s.id); setOpenMenu(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"><Trash2 size={13} /> Delete</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-xs text-gray-400">Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} students</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40">‹</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-lg border text-sm font-medium ${currentPage === p ? 'text-white border-transparent' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  style={currentPage === p ? { background: 'linear-gradient(to right, #6366F1, #A5B4FC)' } : {}}>
                  {p}
                </button>
              ))}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40">›</button>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Add New Student</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div><label className={labelClass}>Full Name *</label>
                <input type="text" placeholder="e.g. John Doe" value={newName} onChange={(e) => setNewName(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Email Address</label>
                <input type="email" placeholder="e.g. john@school.edu" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Grade / Year Level</label>
                <select value={newGrade} onChange={(e) => setNewGrade(e.target.value)} className={inputClass}>
                  <option value="">— Select grade —</option>
                  {GRADE_OPTIONS.slice(1).map((g) => <option key={g} value={g}>{g}</option>)}
                </select></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdd} className="flex-1 text-white font-semibold py-2.5 rounded-lg text-sm" style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>Add Student</button>
            </div>
          </div>
        </div>
      )}

      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Edit Student</h2>
              <button onClick={() => setEditingStudent(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div><label className={labelClass}>Full Name</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} /></div>
              <div><label className={labelClass}>Email</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} className={inputClass} /></div>
              <div><label className={labelClass}>Grade</label>
                <select value={editForm.grade} onChange={(e) => setEditForm((p) => ({ ...p, grade: e.target.value }))} className={inputClass}>
                  <option value="">— Select grade —</option>
                  {GRADE_OPTIONS.slice(1).map((g) => <option key={g} value={g}>{g}</option>)}
                </select></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingStudent(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleEdit} className="flex-1 text-white font-semibold py-2.5 rounded-lg text-sm" style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {deletingId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3 mx-auto"><Trash2 size={22} className="text-red-500" /></div>
            <h2 className="font-bold text-gray-800 mb-1">Delete Student?</h2>
            <p className="text-xs text-gray-400 mb-5">This will permanently remove the student and their prediction history.</p>
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
