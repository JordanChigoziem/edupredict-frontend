import { useState, useEffect } from 'react';
import { Users, TrendingUp, BarChart3, CheckCircle2, Lightbulb, Sparkles } from 'lucide-react';
import StatCard from '../components/StatCard';
import { getAnalytics, predict } from '../services/api';
import neutralImg from '../assets/neutral.png';
import successImg from '../assets/success.png';
import atRiskImg from '../assets/atrisk.png';

const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2.5 outline-none text-gray-700 text-sm";

export default function Dashboard({ showToast }) {
  const [analytics, setAnalytics] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState({
    studyHours: '', attendance: '', gpa: '', assignments: '', extracurricular: ''
  });

  useEffect(() => {
    getAnalytics().then(setAnalytics).catch(() => {});
  }, []);

  const set = (key) => (e) => setFields((p) => ({ ...p, [key]: e.target.value }));

  const handlePredict = async () => {
    const { studyHours, attendance, gpa, assignments } = fields;
    if (!studyHours || !attendance || !gpa || !assignments) {
      showToast('Please fill in all fields before predicting.');
      return;
    }

    setLoading(true);
    try {
      // Build a proper payload matching the model's expected features
      const absences = Math.max(0, Math.round((1 - parseFloat(attendance) / 100) * 30));
      const studytime = parseFloat(studyHours) > 10 ? 4 : parseFloat(studyHours) > 5 ? 3 : parseFloat(studyHours) > 2 ? 2 : 1;

      const res = await predict({
        // Categorical features with sensible defaults
        school: 'GP', sex: 'F', address: 'U', famsize: 'GT3', Pstatus: 'T',
        Mjob: 'other', Fjob: 'other', reason: 'home', guardian: 'mother',
        schoolsup: 'no', famsup: 'yes', paid: 'no',
        activities: fields.extracurricular === 'yes' ? 'yes' : 'no',
        nursery: 'yes', higher: 'yes', internet: 'yes', romantic: 'no',
        subject: 'Math',
        // Numeric features
        age: 17, Medu: 2, Fedu: 2, traveltime: 1,
        studytime,
        failures: 0,
        famrel: 4, freetime: 3, goout: 2,
        Dalc: 1, Walc: 1, health: 4,
        absences,
        // Grade inputs — convert GPA (0-4) to G3 scale (0-20)
        G1: Math.round((parseFloat(gpa) / 4.0) * 20),
        G2: Math.round((parseFloat(gpa) / 4.0) * 20),
        selectedStudent: '',
        gradeLevel: '',
      });
      setResult(res);
      const updated = await getAnalytics();
      setAnalytics(updated);
    } catch (err) {
      showToast('Prediction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hasResult = result && result.predicted_grade !== undefined;
  const isPass = hasResult && result.predicted_grade >= 10;
  const fillPct = hasResult ? Math.min(result.predicted_grade / 20, 1) : 0;
  const circumference = 2 * Math.PI * 52;
  const dashArray = `${fillPct * circumference} ${circumference}`;
  const gaugeColor = !hasResult ? '#D1D5DB' : isPass ? '#22C55E' : '#EF4444';
  const illustrationImg = !hasResult ? neutralImg : isPass ? successImg : atRiskImg;
  const illustrationBg = !hasResult ? 'bg-gray-50' : isPass ? 'bg-green-50' : 'bg-red-50';
  const scoreText = hasResult ? result.predicted_grade.toFixed(1) : '—';
  const scoreLabel = !hasResult ? 'No result' : isPass ? 'High Performer' : 'At Risk';
  const scoreLabelColor = !hasResult ? 'text-gray-300' : isPass ? 'text-green-500' : 'text-red-500';
  const scoreValueColor = !hasResult ? 'text-gray-300' : isPass ? 'text-green-600' : 'text-red-500';

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Welcome back, Admin 👋</h1>
      <p className="text-gray-500 mt-1 mb-6">Here's what's happening with your students today.</p>

      <div className="flex gap-5 mb-6">
        <StatCard icon={<Users size={20} className="text-indigo-600" />} iconBg="bg-indigo-100"
          label="Total Students" value={analytics?.total_students || '—'} delta="Live from database" deltaUp />
        <StatCard icon={<TrendingUp size={20} className="text-blue-600" />} iconBg="bg-blue-100"
          label="Predicted High Performers" value={analytics?.high_performers || '—'} delta="From predictions" deltaUp />
        <StatCard icon={<BarChart3 size={20} className="text-orange-600" />} iconBg="bg-orange-100"
          label="At Risk Students" value={analytics?.at_risk || '—'} delta="From predictions" deltaUp={false} />
        <StatCard icon={<CheckCircle2 size={20} className="text-green-600" />} iconBg="bg-green-100"
          label="Overall Accuracy"
          value={analytics?.overall_accuracy ? `${analytics.overall_accuracy}%` : '—'}
          delta={analytics?.total_predictions ? `Based on ${analytics.total_predictions} predictions` : 'Run predictions to see'}
          deltaUp />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="flex flex-col gap-6">
          {/* Quick predict form */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={20} className="text-indigo-600" />
              <h2 className="font-semibold text-gray-800">Predict Student Performance</h2>
            </div>
            <p className="text-sm text-gray-500 mb-5">Enter student details to predict academic performance.</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1.5">Study Hours per Week</label>
                <div className="flex items-center border border-gray-200 rounded-lg px-3">
                  <input type="number" placeholder="—" value={fields.studyHours} onChange={set('studyHours')}
                    className="flex-1 py-2.5 outline-none text-gray-700 text-sm" />
                  <span className="text-sm text-gray-400">hrs</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1.5">Attendance (%)</label>
                <div className="flex items-center border border-gray-200 rounded-lg px-3">
                  <input type="number" placeholder="—" value={fields.attendance} onChange={set('attendance')}
                    className="flex-1 py-2.5 outline-none text-gray-700 text-sm" />
                  <span className="text-sm text-gray-400">%</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1.5">Previous GPA</label>
                <div className="flex items-center border border-gray-200 rounded-lg px-3">
                  <input type="number" placeholder="—" value={fields.gpa} onChange={set('gpa')}
                    className="flex-1 py-2.5 outline-none text-gray-700 text-sm" />
                  <span className="text-sm text-gray-400">/4.0</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1.5">Assignments Submitted (%)</label>
                <div className="flex items-center border border-gray-200 rounded-lg px-3">
                  <input type="number" placeholder="—" value={fields.assignments} onChange={set('assignments')}
                    className="flex-1 py-2.5 outline-none text-gray-700 text-sm" />
                  <span className="text-sm text-gray-400">%</span>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="text-sm text-gray-600 block mb-1.5">Extracurricular Activities</label>
              <select value={fields.extracurricular} onChange={set('extracurricular')} className={inputClass}>
                <option value="">—</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <button onClick={handlePredict} disabled={loading}
              className="w-full text-white font-bold text-base py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>
              <Sparkles size={18} />
              {loading ? 'Predicting...' : 'Predict Performance'}
            </button>
          </div>

          {/* Tip banner */}
          <div className="bg-indigo-50 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center bg-indigo-300">
              <Lightbulb size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">AI + Education = Better Tomorrow</p>
              <p className="text-xs text-gray-500">Leverage machine learning to help every <br /> student reach their full potential.</p>
            </div>
          </div>
        </div>

        {/* Prediction Result */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 h-full flex flex-col">
          <h2 className="font-bold text-gray-800 mb-5">Prediction Result</h2>

          <div className="flex items-start gap-4 mb-6">
            <div className="relative shrink-0 w-32 h-32 flex items-center justify-center">
              <svg width="128" height="128" viewBox="0 0 128 128" className="absolute top-0 left-0">
                <circle cx="64" cy="64" r="52" fill="none" stroke="#E5E7EB" strokeWidth="12" />
                <circle cx="64" cy="64" r="52" fill="none" stroke={gaugeColor} strokeWidth="12"
                  strokeDasharray={dashArray} strokeLinecap="round" transform="rotate(-90 64 64)" />
              </svg>
              <div className="flex flex-col items-center z-10">
                <span className={`text-2xl font-bold ${scoreValueColor}`}>{scoreText}</span>
                <span className={`text-xs mt-0.5 text-center ${scoreLabelColor}`}>{scoreLabel}</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-3">
              <p className="text-sm text-gray-600">
                The model predicts this student is likely to perform{' '}
                <span className={`font-bold ${hasResult ? (isPass ? 'text-green-500' : 'text-red-500') : 'text-gray-300'}`}>
                  {hasResult ? (isPass ? 'High' : 'At Risk') : '—'}
                </span>
              </p>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 w-fit">
                <span className="text-xs text-gray-500">Confidence Score</span>
                <span className={`text-sm font-bold ${scoreValueColor}`}>
                  {hasResult ? result.confidence : '—'}
                </span>
              </div>
              {hasResult && (
                <div className={`text-xs font-semibold px-3 py-1.5 rounded-lg w-fit ${isPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {isPass ? '↑ High Performance Predicted' : '↓ At Risk Predicted'}
                </div>
              )}
            </div>

            <div className="relative shrink-0">
              <div className={`w-20 h-20 rounded-full ${illustrationBg} flex items-center justify-center overflow-hidden`}>
                <img src={illustrationImg} alt="result" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>

          {!hasResult && (
            <p className="text-sm text-gray-400 italic text-center mt-4">
              No prediction yet — fill out the form on the left.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
