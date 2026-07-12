import { Sparkles } from 'lucide-react';

export default function PredictForm({ onPredict }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={20} className="text-indigo-600" />
        <h2 className="font-bold text-gray-800">Predict Student Performance</h2>
      </div>
      <p className="text-sm text-gray-500 mb-5">Enter student details to predict academic performance.</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm font-bold block mb-1.5">Study Hours per Week</label>
          <div className="flex items-center border border-gray-200 rounded-lg px-3">
            <input type="number" placeholder="—" className="flex-1 py-2.5 outline-none text-gray-700 w-full" />
            <span className="text-sm text-gray-400">hrs</span>
          </div>
        </div>
        <div>
          <label className="text-sm font-bold block mb-1.5">Attendance (%)</label>
          <div className="flex items-center border border-gray-200 rounded-lg px-3">
            <input type="number" placeholder="—" className="flex-1 py-2.5 outline-none text-gray-700 w-full" />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
        <div>
          <label className="text-sm font-bold block mb-1.5">Previous GPA</label>
          <div className="flex items-center border border-gray-200 rounded-lg px-3">
            <input type="number" placeholder="—" className="flex-1 py-2.5 outline-none text-gray-700 w-full" />
            <span className="text-sm text-gray-400">/4.0</span>
          </div>
        </div>
        <div>
          <label className="text-sm font-bold block mb-1.5">Assignments Submitted (%)</label>
          <div className="flex items-center border border-gray-200 rounded-lg px-3">
            <input type="number" placeholder="—" className="flex-1 py-2.5 outline-none text-gray-700 w-full" />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
      </div>

      <div className="mb-5">
        <label className="text-sm font-bold block mb-1.5">Extracurricular Activities</label>
        <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 outline-none text-gray-700">
          <option value="">—</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>

      <button
        onClick={onPredict}
        className="w-full text-white font-bold text-base py-4 rounded-xl flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}
      >
        <Sparkles size={18} />
        Predict Performance
      </button>
    </div>
  );
}