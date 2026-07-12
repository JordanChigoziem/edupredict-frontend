import { useState, useEffect } from 'react';
import { PieChart, Calendar, Download, RefreshCw, Info, TrendingUp, AlertTriangle, Target, Trophy } from 'lucide-react';
import StatCard from '../components/StatCard';
import { getAnalytics } from '../services/api';

const factors = [
  { label: 'Attendance', color: '#22C55E' },
  { label: 'Study Hours', color: '#3B82F6' },
  { label: 'Previous GPA', color: '#8B5CF6' },
  { label: 'Assignments', color: '#F97316' },
  { label: 'Extracurricular Activities', color: '#EAB308' },
  { label: 'Sleep Hours', color: '#06B6D4' },
];

function DonutChart({ segments, centerLabel, centerValue, size = 130, strokeWidth = 22 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2, cy = size / 2;
  let cumulative = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.length === 0 ? (
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} />
      ) : segments.map((seg, i) => {
        const dash = (seg.value / 100) * circumference;
        const offset = -(cumulative / 100) * circumference;
        cumulative += seg.value;
        return (
          <circle key={i} cx={cx} cy={cy} r={radius} fill="none"
            stroke={seg.color} strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`} />
        );
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="16" fontWeight="700" fill="#1F2937">{centerValue}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#6B7280">{centerLabel}</text>
    </svg>
  );
}

function LineChart() {
  const width = 280, height = 160;
  const padL = 35, padR = 10, padT = 10, padB = 30;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const points = 15;
  const series = [
    { color: '#22C55E', values: Array(15).fill(0) },
    { color: '#3B82F6', values: Array(15).fill(0) },
    { color: '#EF4444', values: Array(15).fill(0) },
  ];
  const toX = (i) => padL + (i / (points - 1)) * chartW;
  const toY = (v) => padT + chartH - (v / 100) * chartH;
  const makePath = (values) => values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`).join(' ');
  const yTicks = [0, 25, 50, 75, 100];
  const xTickIdxs = [0, 3, 7, 11, 14];
  const xLabels = ['—', '—', '—', '—', '—'];
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={padL} y1={toY(v)} x2={width - padR} y2={toY(v)} stroke="#F3F4F6" strokeWidth="1" />
          <text x={padL - 4} y={toY(v) + 4} textAnchor="end" fontSize="8" fill="#9CA3AF">{v}%</text>
        </g>
      ))}
      {xTickIdxs.map((i, idx) => (
        <text key={i} x={toX(i)} y={height - 8} textAnchor="middle" fontSize="8" fill="#9CA3AF">{xLabels[idx]}</text>
      ))}
      {series.map((s, si) => (
        <g key={si}>
          <path d={makePath(s.values)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" />
          {s.values.map((v, i) => (
            <circle key={i} cx={toX(i)} cy={toY(v)} r="3" fill={s.color} />
          ))}
        </g>
      ))}
    </svg>
  );
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    getAnalytics().then(setAnalytics).catch(() => {});
  }, []);

  const total = analytics?.total_students || 0;
  const highPerformers = analytics?.high_performers || 0;
  const atRisk = analytics?.at_risk || 0;
  const moderateRisk = analytics?.moderate_risk || 0;
  const lowRisk = analytics?.low_risk || 0;

  const distributionSegments = total > 0 ? [
    { value: Math.round((highPerformers / total) * 100), color: '#22C55E' },
    { value: Math.round(((total - highPerformers - atRisk) / total) * 100), color: '#3B82F6' },
    { value: Math.round((atRisk / total) * 100), color: '#EF4444' },
  ].filter(s => s.value > 0) : [];

  const riskSegments = total > 0 ? [
    { value: Math.round((atRisk / total) * 100), color: '#EF4444' },
    { value: Math.round((moderateRisk / total) * 100), color: '#F97316' },
    { value: Math.round((lowRisk / total) * 100), color: '#22C55E' },
  ].filter(s => s.value > 0) : [];

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Analytics <PieChart size={22} className="text-indigo-500" />
          </h1>
          <p className="text-sm text-gray-500 mt-1">Explore key insights and trends in student performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 shadow-sm">
            <Calendar size={15} /> {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </button>
          <button className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 shadow-sm">
            <Download size={15} /> Export Report
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <StatCard icon={<TrendingUp size={18} className="text-indigo-600" />} iconBg="bg-indigo-100"
          label="Total Students" value={total || '—'} delta="Live data" deltaUp />
        <StatCard icon={<Target size={18} className="text-blue-600" />} iconBg="bg-blue-100"
          label="Avg Prediction Score"
          value={analytics?.overall_accuracy ? `${analytics.overall_accuracy}%` : '—'}
          delta="From predictions" deltaUp />
        <StatCard icon={<Trophy size={18} className="text-yellow-600" />} iconBg="bg-yellow-100"
          label="High Performers" value={highPerformers || '—'} delta="From predictions" deltaUp />
        <StatCard icon={<AlertTriangle size={18} className="text-orange-600" />} iconBg="bg-orange-100"
          label="At Risk Students" value={atRisk || '—'} delta="From predictions" deltaUp={false} />
        <StatCard icon={<Target size={18} className="text-green-600" />} iconBg="bg-green-100"
          label="Overall Accuracy"
          value={analytics?.overall_accuracy ? `${analytics.overall_accuracy}%` : '—'}
          delta="Avg confidence" deltaUp />
      </div>

      <div className="grid grid-cols-3 gap-5 mb-5">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-500" /> Performance Trend
            </h3>
            <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none text-gray-600">
              <option>Daily</option><option>Weekly</option><option>Monthly</option>
            </select>
          </div>
          <div className="flex items-center gap-3 mb-3">
            {[{ label: 'High Performers', color: '#22C55E' }, { label: 'Average Performers', color: '#3B82F6' }, { label: 'At Risk', color: '#EF4444' }].map((l) => (
              <div key={l.label} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                <span className="text-xs text-gray-500">{l.label}</span>
              </div>
            ))}
          </div>
          <LineChart />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Performance Distribution</h3>
          <div className="flex items-center gap-4">
            <DonutChart segments={distributionSegments} centerValue={total || '—'} centerLabel="Students" />
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'High Performers', color: '#22C55E', count: highPerformers },
                { label: 'Average Performers', color: '#3B82F6', count: total - highPerformers - atRisk },
                { label: 'Moderate Risk', color: '#F97316', count: moderateRisk },
                { label: 'High Risk', color: '#EF4444', count: atRisk },
              ].map((d) => (
                <div key={d.label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <div>
                    <p className="text-xs text-gray-600 leading-tight">{d.label}</p>
                    <p className="text-xs text-gray-400">{total > 0 ? d.count : '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Average Score by Grade</h3>
            <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none text-gray-600">
              <option>All Grades</option>
            </select>
          </div>
          <div className="flex items-end gap-2 h-36 px-2 pt-4 border-b border-gray-100">
            {['10th', '11th', '12th', '9th', '8th', '7th'].map((g, i) => (
              <div key={g} className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
                <span className="text-xs text-gray-400">—</span>
                <div className="w-full rounded-t-md bg-indigo-100" style={{ height: '8px' }} />
                <span className="text-xs text-gray-400">{g}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-5">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Key Factors Impacting Performance</h3>
          <div className="flex flex-col gap-3">
            {factors.map((f) => (
              <div key={f.label} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-32 shrink-0">{f.label}</span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ background: f.color, width: '0%' }} />
                </div>
                <span className="text-xs text-gray-400 w-6 text-right shrink-0">—</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 mt-4">
            <Info size={12} className="text-gray-400" />
            <p className="text-xs text-gray-400">Impact score shows correlation with performance</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Performance Heatmap</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="w-10" />
                  {['Math', 'Science', 'English', 'History', 'Comp Sci'].map((s) => (
                    <th key={s} className="text-center text-gray-500 font-normal pb-2 px-1">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['12th', '11th', '10th', '9th', '8th', '7th'].map((grade) => (
                  <tr key={grade}>
                    <td className="text-gray-500 pr-2 text-right">{grade}</td>
                    {[0, 1, 2, 3, 4].map((_, si) => (
                      <td key={si} className="p-0.5">
                        <div className="w-full h-7 rounded-sm bg-gray-100" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-3 px-1">
            <span className="text-xs text-gray-400">Low Performance</span>
            <div className="flex gap-0.5">
              {['#F87171', '#FCA5A5', '#FDE68A', '#BEF264', '#86EFAC'].map((c, i) => (
                <div key={i} className="w-6 h-2 rounded-sm" style={{ background: c }} />
              ))}
            </div>
            <span className="text-xs text-gray-400">High Performance</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Risk Level by Grade</h3>
            <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none text-gray-600">
              <option>All Grades</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <DonutChart segments={riskSegments} centerValue={atRisk || '—'} centerLabel="At Risk" />
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'High Risk', color: '#EF4444', count: atRisk },
                { label: 'Moderate Risk', color: '#F97316', count: moderateRisk },
                { label: 'Low Risk', color: '#22C55E', count: lowRisk },
              ].map((d) => (
                <div key={d.label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <div>
                    <p className="text-xs text-gray-600">{d.label}</p>
                    <p className="text-xs text-gray-400">{total > 0 ? d.count : '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-indigo-500">
          <Info size={13} /> Analytics are updated in real time with live data.
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          Last updated: {new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          <RefreshCw size={13} className="cursor-pointer hover:text-indigo-500" onClick={() => getAnalytics().then(setAnalytics).catch(() => {})} />
        </div>
      </div>
    </div>
  );
}
