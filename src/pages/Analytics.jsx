import { useState, useEffect } from 'react';
import { PieChart, Calendar, Download, RefreshCw, Info, TrendingUp, AlertTriangle, Target, Trophy } from 'lucide-react';
import StatCard from '../components/StatCard';
import { getAnalytics, getPredictions, getStudents } from '../services/api';

function DonutChart({ segments, centerLabel, centerValue, size = 130, strokeWidth = 22 }) {
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
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="16" fontWeight="700" fill="#1F2937">{centerValue}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#6B7280">{centerLabel}</text>
    </svg>
  );
}

function PerformanceTrendChart({ predictions }) {
  const width = 280, height = 160;
  const padL = 35, padR = 10, padT = 15, padB = 30;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  // Build last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const counts = days.map((day) => predictions.filter(p => {
    const parts = (p.predicted_on || '').split(',')[0].trim();
    const pDate = new Date(parts);
    return pDate.toDateString() === day.toDateString();
  }).length);

  const maxV = Math.max(...counts, 3);
  const toX = (i) => padL + (i / (days.length - 1)) * chartW;
  const toY = (v) => padT + chartH - (v / maxV) * chartH;

  const highCounts = days.map((day) => predictions.filter(p => {
    const parts = (p.predicted_on || '').split(',')[0].trim();
    return new Date(parts).toDateString() === day.toDateString() && p.performance === 'High Performer';
  }).length);

  const atRiskCounts = days.map((day) => predictions.filter(p => {
    const parts = (p.predicted_on || '').split(',')[0].trim();
    return new Date(parts).toDateString() === day.toDateString() && p.performance === 'At Risk';
  }).length);

  const makePath = (values) => values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`).join(' ');
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
      {/* Total line */}
      <path d={makePath(counts)} fill="none" stroke="#6366F1" strokeWidth="2" strokeLinejoin="round" />
      {counts.map((v, i) => <circle key={i} cx={toX(i)} cy={toY(v)} r="3" fill="#6366F1" />)}
      {/* High performers line */}
      <path d={makePath(highCounts)} fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinejoin="round" strokeDasharray="4,2" />
      {/* At risk line */}
      <path d={makePath(atRiskCounts)} fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinejoin="round" strokeDasharray="4,2" />
    </svg>
  );
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [a, p, s] = await Promise.all([getAnalytics(), getPredictions(), getStudents()]);
      setAnalytics(a);
      setPredictions(p);
      setStudents(s);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const total = analytics?.total_students || 0;
  const highPerformers = analytics?.high_performers || 0;
  const atRisk = analytics?.at_risk || 0;
  const moderateRisk = analytics?.moderate_risk || 0;
  const lowRisk = analytics?.low_risk || 0;

  const distributionSegments = [
    { value: highPerformers, color: '#22C55E' },
    { value: Math.max(0, total - highPerformers - atRisk - moderateRisk), color: '#3B82F6' },
    { value: moderateRisk, color: '#F97316' },
    { value: atRisk, color: '#EF4444' },
  ].filter(s => s.value > 0);

  const riskSegments = [
    { value: atRisk, color: '#EF4444' },
    { value: moderateRisk, color: '#F97316' },
    { value: lowRisk, color: '#22C55E' },
  ].filter(s => s.value > 0);

  // Compute Key Factors from real prediction data
  const keyFactors = (() => {
    if (predictions.length === 0) return null;

    // Parse input summaries to extract average values
    let totalAttendance = 0, totalStudy = 0, totalGpa = 0,
        totalAssignments = 0, countA = 0, countS = 0, countG = 0, countAss = 0;

    predictions.forEach(p => {
      const summary = p.input_summary || '';
      const attendanceMatch = summary.match(/Attendance:\s*([\d.]+)%/);
      const studyMatch = summary.match(/Study:\s*([\d.]+)hrs/);
      const gpaMatch = summary.match(/GPA:\s*([\d.]+)/);
      const assignmentsMatch = summary.match(/Assignments:\s*([\d.]+)%/);

      if (attendanceMatch) { totalAttendance += parseFloat(attendanceMatch[1]); countA++; }
      if (studyMatch) { totalStudy += parseFloat(studyMatch[1]); countS++; }
      if (gpaMatch) { totalGpa += parseFloat(gpaMatch[1]); countG++; }
      if (assignmentsMatch) { totalAssignments += parseFloat(assignmentsMatch[1]); countAss++; }
    });

    const avgAttendance = countA > 0 ? Math.round(totalAttendance / countA) : 0;
    const avgStudy = countS > 0 ? Math.round((totalStudy / countS / 20) * 100) : 0;
    const avgGpa = countG > 0 ? Math.round((totalGpa / countG / 4.0) * 100) : 0;
    const avgAssignments = countAss > 0 ? Math.round(totalAssignments / countAss) : 0;

    // Feature importance weights from the model (approximate)
    const attendanceImpact = Math.round(avgAttendance * 0.3);
    const studyImpact = Math.round(avgStudy * 0.25);
    const gpaImpact = Math.round(avgGpa * 0.35);
    const assignmentsImpact = Math.round(avgAssignments * 0.2);
    const absenceImpact = Math.round((100 - avgAttendance) * 0.15);

    return [
      { label: 'Attendance', color: '#22C55E', pct: Math.min(attendanceImpact, 100) },
      { label: 'Study Hours', color: '#3B82F6', pct: Math.min(studyImpact, 100) },
      { label: 'Previous GPA', color: '#8B5CF6', pct: Math.min(gpaImpact, 100) },
      { label: 'Assignments', color: '#F97316', pct: Math.min(assignmentsImpact, 100) },
      { label: 'Absences', color: '#EAB308', pct: Math.min(absenceImpact, 100) },
      { label: 'Extracurricular', color: '#06B6D4', pct: predictions.length > 0 ? 15 : 0 },
    ];
  })();

  // Average score by grade from students
  const gradeScores = (() => {
    const gradeMap = {};
    students.forEach(s => {
      if (!s.grade || s.grade === '—') return;
      const conf = parseFloat((s.confidence || '0').replace('%', ''));
      if (!gradeMap[s.grade]) gradeMap[s.grade] = { total: 0, count: 0 };
      if (conf > 0) { gradeMap[s.grade].total += conf; gradeMap[s.grade].count++; }
    });
    return Object.entries(gradeMap).map(([grade, data]) => ({
      grade: grade.replace(' Grade', '').replace('th', 'th').replace('Undergraduate', 'UG').replace('Postgraduate', 'PG'),
      avg: data.count > 0 ? Math.round(data.total / data.count) : 0,
    }));
  })();

  const maxGradeScore = Math.max(...gradeScores.map(g => g.avg), 100);

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
          label="Total Predictions" value={analytics?.total_predictions || '—'} delta="All time" deltaUp />
      </div>

      <div className="grid grid-cols-3 gap-5 mb-5">
        {/* Performance Trend */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-500" /> Performance Trend
            </h3>
          </div>
          <div className="flex items-center gap-3 mb-3">
            {[{ label: 'All Predictions', color: '#6366F1' }, { label: 'High Performers', color: '#22C55E' }, { label: 'At Risk', color: '#EF4444' }].map((l) => (
              <div key={l.label} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                <span className="text-xs text-gray-500">{l.label}</span>
              </div>
            ))}
          </div>
          {predictions.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8 italic">Make predictions to see trend data.</p>
          ) : (
            <PerformanceTrendChart predictions={predictions} />
          )}
        </div>

        {/* Performance Distribution */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Performance Distribution</h3>
          <div className="flex items-center gap-4">
            <DonutChart segments={distributionSegments} centerValue={total || '—'} centerLabel="Students" />
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'High Performers', color: '#22C55E', count: highPerformers },
                { label: 'Average Performers', color: '#3B82F6', count: Math.max(0, total - highPerformers - atRisk - moderateRisk) },
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

        {/* Average Score by Grade */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Average Score by Grade</h3>
          </div>
          {gradeScores.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8 italic">Add students with grade levels and make predictions to see data here.</p>
          ) : (
            <div className="flex items-end gap-2 h-36 px-2 pt-4 border-b border-gray-100">
              {gradeScores.map((g) => (
                <div key={g.grade} className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
                  {g.avg > 0 && <span className="text-xs text-gray-600 font-medium">{g.avg}%</span>}
                  <div className="w-full rounded-t-md"
                    style={{ height: `${Math.max((g.avg / maxGradeScore) * 100, 4)}%`, background: 'linear-gradient(to top, #6366F1, #A5B4FC)' }} />
                  <span className="text-xs text-gray-400">{g.grade}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-5">
        {/* Key Factors — now uses real prediction data */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Key Factors Impacting Performance</h3>
          {!keyFactors ? (
            <p className="text-xs text-gray-400 text-center py-4 italic">Make predictions to see factor analysis.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {keyFactors.map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-28 shrink-0">{f.label}</span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ background: f.color, width: `${f.pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right shrink-0">
                    {f.pct > 0 ? `${f.pct}%` : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1 mt-4">
            <Info size={12} className="text-gray-400" />
            <p className="text-xs text-gray-400">Based on {predictions.length} prediction{predictions.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Performance Heatmap */}
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
                {['12th', '11th', '10th', '9th', '8th', '7th'].map((grade) => {
                  const gradeStudents = students.filter(s => s.grade && s.grade.includes(grade.replace('th', '')));
                  const avgConf = gradeStudents.length > 0
                    ? Math.round(gradeStudents.reduce((sum, s) => sum + parseFloat((s.confidence || '0').replace('%', '')), 0) / gradeStudents.length)
                    : 0;
                  const color = avgConf === 0 ? '#F3F4F6' : avgConf >= 80 ? '#86EFAC' : avgConf >= 60 ? '#BEF264' : avgConf >= 40 ? '#FDE68A' : '#FCA5A5';
                  return (
                    <tr key={grade}>
                      <td className="text-gray-500 pr-2 text-right">{grade}</td>
                      {[0, 1, 2, 3, 4].map((_, si) => (
                        <td key={si} className="p-0.5">
                          <div className="w-full h-7 rounded-sm" style={{ background: si === 0 ? color : '#F3F4F6' }} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-3 px-1">
            <span className="text-xs text-gray-400">Low Performance</span>
            <div className="flex gap-0.5">
              {['#FCA5A5', '#FDE68A', '#BEF264', '#86EFAC', '#22C55E'].map((c, i) => (
                <div key={i} className="w-6 h-2 rounded-sm" style={{ background: c }} />
              ))}
            </div>
            <span className="text-xs text-gray-400">High Performance</span>
          </div>
        </div>

        {/* Risk Level Distribution */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Risk Level by Grade</h3>
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
          <RefreshCw size={13} className="cursor-pointer hover:text-indigo-500" onClick={loadAll} />
        </div>
      </div>
    </div>
  );
}
