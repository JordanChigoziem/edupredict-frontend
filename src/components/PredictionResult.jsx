import { Calendar } from 'lucide-react';
import neutralImg from '../assets/neutral.png';
import successImg from '../assets/success.png';
import atRiskImg from '../assets/atrisk.png';


export default function PredictionResult({ result }) {
  const factors = [
    { label: 'Attendance', color: '#22C55E' },
    { label: 'Study Hours', color: '#3B82F6' },
    { label: 'Previous GPA', color: '#8B5CF6' },
    { label: 'Assignments', color: '#F97316' },
    { label: 'Extracurricular', color: '#EAB308' },
  ];

  const distribution = [
    { label: 'High Performers', pct: '—', color: '#22C55E' },
    { label: 'Average Performers', pct: '—', color: '#3B82F6' },
    { label: 'At Risk', pct: '—', color: '#EF4444' },
  ];

  // Image + color swap logic
  const hasResult = result && result.grade !== undefined;
  const isAtRisk = hasResult && result.grade < 10;
  const isPass = hasResult && result.grade >= 10;

  const illustrationImg = !hasResult ? neutralImg : isPass ? successImg : atRiskImg;
  const illustrationBg = !hasResult ? 'bg-gray-50' : isPass ? 'bg-green-50' : 'bg-red-50';
  const gaugeColor = !hasResult ? '#D1D5DB' : isPass ? '#22C55E' : '#EF4444';
  const scoreText = hasResult ? `${result.grade.toFixed(1)}` : '—';
  const scoreLabel = !hasResult ? 'No result' : isPass ? 'Pass' : 'At Risk';
  const scoreLabelColor = !hasResult ? 'text-gray-300' : isPass ? 'text-green-500' : 'text-red-500';
  const scoreValueColor = !hasResult ? 'text-gray-300' : isPass ? 'text-green-600' : 'text-red-500';
  const performLabel = !hasResult ? '—' : isPass ? 'High' : 'At Risk';
  const performColor = !hasResult ? 'text-gray-300' : isPass ? 'text-green-500 font-bold' : 'text-red-500 font-bold';

  // Gauge arc calculation
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const fillPct = hasResult ? Math.min(result.grade / 20, 1) : 0;
  const dashArray = `${fillPct * circumference} ${circumference}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 h-full min-h-full flex flex-col">
      <h2 className="font-bold text-gray-800 mb-5">Prediction Result</h2>

      <div className="flex flex-col gap-8 flex-1">

        {/* ── TOP ROW ── */}
        <div className="flex items-center gap-6">

          {/* Circular gauge */}
          <div className="relative shrink-0 w-32 h-32 flex items-center justify-center">
            <svg width="128" height="128" viewBox="0 0 128 128" className="absolute top-0 left-0">
              <circle cx="64" cy="64" r="52" fill="none" stroke="#E5E7EB" strokeWidth="12" />
              <circle
                cx="64" cy="64" r="52"
                fill="none"
                stroke={gaugeColor}
                strokeWidth="12"
                strokeDasharray={dashArray}
                strokeLinecap="round"
                transform="rotate(-90 64 64)"
              />
            </svg>
            <div className="flex flex-col items-center z-10">
              <span className={`text-2xl font-bold ${scoreValueColor}`}>{scoreText}</span>
              <span className={`text-xs mt-0.5 text-center ${scoreLabelColor}`}>{scoreLabel}</span>
            </div>
          </div>

          {/* Prediction text + confidence */}
          <div className="flex flex-col gap-3 flex-1">
            <p className="text-xs text-gray-600 leading-relaxed">
              The model predicts this student is likely to perform{' '}
              <span className={performColor}>{performLabel}</span>
            </p>
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 w-fit">
              <span className="text-xs text-gray-500">Confidence Score</span>
              <span className={`text-sm font-bold ${scoreValueColor}`}>
                {hasResult ? `${Math.round(fillPct * 100)}%` : '—'}
              </span>
            </div>
          </div>

          {/* Illustration — swaps based on result */}
          <div className="relative shrink-0">
            <div className={`w-24 h-24 rounded-full ${illustrationBg} flex items-center justify-center overflow-hidden`}>
              <img
                src={illustrationImg}
                alt="performance illustration"
                className="w-full h-full object-contain"
              />
            </div>
            <div
              className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}
            >
              ↑
            </div>
          </div>
        </div>

        {/* ── BOTTOM ROW ── */}
        <div className="grid grid-cols-2 gap-6 flex-1 mt-6">

          {/* Key Factors */}
          <div>
            <h3 className="text-xs font-semibold text-gray-800 mb-4">
              Key Factors Affecting Performance
            </h3>
            <div className="flex flex-col gap-5">
              {factors.map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-24 shrink-0">{f.label}</span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full w-0 rounded-full" style={{ background: f.color }} />
                  </div>
                  <span className="text-xs text-gray-400 w-5 text-right shrink-0">—</span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Distribution */}
          <div className="flex flex-col">
            <h3 className="text-xs font-semibold text-gray-800 mb-4">
              Performance Distribution
            </h3>
            <div className="flex items-center gap-4">
              <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
                <circle cx="50" cy="50" r="36" fill="none" stroke="#E5E7EB" strokeWidth="18" />
              </svg>
              <div className="flex flex-col gap-3">
                {distribution.map((d) => (
                  <div key={d.label} className="flex items-start gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ background: d.color }} />
                    <div>
                      <p className="text-xs text-gray-600 leading-tight">{d.label}</p>
                      <p className="text-xs text-gray-300">{d.pct}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-4">
              <Calendar size={12} />
              Updated: —
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}