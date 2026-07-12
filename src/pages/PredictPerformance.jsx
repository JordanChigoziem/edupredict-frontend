import { useState, useEffect } from 'react';
import { TrendingUp, User, Info, HelpCircle, Sparkles, Calendar, ChevronRight, ChevronLeft, Plus, X, MoreVertical } from 'lucide-react';
import neutralImg from '../assets/neutral.png';
import successImg from '../assets/success.png';
import atRiskImg from '../assets/atrisk.png';
import { predict, getPredictions, getStudents, addStudent } from '../services/api';

const STEP_LABELS = ['Academic Information', 'Student Profile', 'Lifestyle & Wellbeing'];
const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2.5 outline-none text-gray-700 text-sm";
const labelClass = "text-sm text-gray-600 block mb-1.5";

function Field({ label, children }) {
  return <div><label className={labelClass}>{label}</label>{children}</div>;
}
function NumberInput({ value, onChange, placeholder = '—', suffix }) {
  return (
    <div className="flex items-center border border-gray-200 rounded-lg px-3">
      <input type="number" placeholder={placeholder} value={value} onChange={onChange}
        className="flex-1 py-2.5 outline-none text-gray-700 w-full text-sm" />
      {suffix && <span className="text-sm text-gray-400 shrink-0">{suffix}</span>}
    </div>
  );
}
function SelectInput({ value, onChange, options }) {
  return (
    <select value={value} onChange={onChange} className={inputClass}>
      <option value="">—</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

const LEVEL_5 = [{ value: '1', label: 'Very Low' }, { value: '2', label: 'Low' }, { value: '3', label: 'Medium' }, { value: '4', label: 'High' }, { value: '5', label: 'Very High' }];
const QUALITY_5 = [{ value: '1', label: 'Very Poor' }, { value: '2', label: 'Poor' }, { value: '3', label: 'Fair' }, { value: '4', label: 'Good' }, { value: '5', label: 'Excellent' }];
const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];

// Factor weights for bar display based on feature importance
function computeFactorBars(fields, result) {
  if (!result) return null;
  const attendance = parseFloat(fields.attendance) || 0;
  const studyHours = parseFloat(fields.studyHours) || 0;
  const gpa = parseFloat(fields.gpa) || 0;
  const assignments = parseFloat(fields.assignments) || 0;
  const sleepHours = parseFloat(fields.sleepHours) || 0;
  return [
    { label: 'Attendance', color: '#22C55E', pct: Math.min(attendance, 100) },
    { label: 'Study Hours', color: '#3B82F6', pct: Math.min((studyHours / 20) * 100, 100) },
    { label: 'Previous GPA', color: '#8B5CF6', pct: Math.min((gpa / 4.0) * 100, 100) },
    { label: 'Assignments', color: '#F97316', pct: Math.min(assignments, 100) },
    { label: 'Sleep Hours', color: '#EAB308', pct: Math.min((sleepHours / 10) * 100, 100) },
  ];
}

function computeDistribution(predictions) {
  if (!predictions || predictions.length === 0) return null;
  const high = predictions.filter(p => p.performance === 'High Performer').length;
  const atRisk = predictions.filter(p => p.performance === 'At Risk').length;
  const avg = predictions.length - high - atRisk;
  const total = predictions.length;
  return [
    { label: 'High Performers', color: '#22C55E', pct: Math.round((high / total) * 100), count: high },
    { label: 'Average Performers', color: '#3B82F6', pct: Math.round((avg / total) * 100), count: avg },
    { label: 'At Risk', color: '#EF4444', pct: Math.round((atRisk / total) * 100), count: atRisk },
  ];
}

function DonutChart({ segments, centerLabel, centerValue, size = 90, strokeWidth = 16 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2, cy = size / 2;
  let cumulative = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {!segments || segments.length === 0 ? (
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} />
      ) : segments.map((seg, i) => {
        const dash = (seg.pct / 100) * circumference;
        const offset = -(cumulative / 100) * circumference;
        cumulative += seg.pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={radius} fill="none"
            stroke={seg.color} strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`} />
        );
      })}
      {centerValue && (
        <>
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1F2937">{centerValue}</text>
          <text x={cx} y={cy + 9} textAnchor="middle" fontSize="7" fill="#6B7280">{centerLabel}</text>
        </>
      )}
    </svg>
  );
}

export default function PredictPerformance({ showToast }) {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [showAllPredictions, setShowAllPredictions] = useState(false);
  const [students, setStudents] = useState([]);
  const [predictions, setPredictions] = useState([]);

  const [fields, setFields] = useState({
    studyHours: '', attendance: '', gpa: '', assignments: '',
    pastFailures: '', currentGrade: '', studyEnvironment: '', learningStyle: '', academicGoal: '',
    selectedStudent: '', age: '', gender: '', gradeLevel: '', schoolType: '', guardianType: '',
    parentalEducation: '', familySize: '', addressType: '',
    sleepHours: '', extracurricular: '', goingOut: '', motivationLevel: 50,
    healthStatus: '', freeTime: '', internet: '', workdayAlcohol: '', weekendAlcohol: '',
    romanticRelationship: '', familyRelationship: '',
  });

  useEffect(() => {
    getStudents().then(setStudents).catch(() => {});
    getPredictions().then(setPredictions).catch(() => {});
  }, []);

  const set = (key) => (e) => setFields((p) => ({ ...p, [key]: e.target.value }));

  const handleAddStudentInline = async () => {
    if (!newStudentName.trim()) return;
    try {
      await addStudent({ name: newStudentName.trim() });
      const updated = await getStudents();
      setStudents(updated);
      setFields((p) => ({ ...p, selectedStudent: newStudentName.trim() }));
      setNewStudentName('');
      setShowAddStudent(false);
      showToast('Student added successfully.');
    } catch (err) { showToast(err.message || 'Failed to add student'); }
  };

  const handlePredict = async () => {
    const { studyHours, attendance, gpa, assignments } = fields;
    if (!studyHours || !attendance || !gpa || !assignments) {
      showToast('Please ensure Study Hours, Attendance, GPA and Assignments are filled (Step 1).');
      return;
    }
    setLoading(true);
    try {
      const absences = Math.max(0, Math.round((1 - parseFloat(attendance) / 100) * 30));
      const studytime = parseFloat(studyHours) > 10 ? 4 : parseFloat(studyHours) > 5 ? 3 : parseFloat(studyHours) > 2 ? 2 : 1;
      const g1g2 = fields.currentGrade ? parseFloat(fields.currentGrade) : Math.round((parseFloat(gpa) / 4.0) * 20);

      const payload = {
        school: 'GP',
        sex: fields.gender === 'male' ? 'M' : 'F',
        address: fields.addressType === 'rural' ? 'R' : 'U',
        famsize: fields.familySize === 'small' ? 'LE3' : 'GT3',
        Pstatus: 'T',
        Mjob: 'other', Fjob: 'other', reason: 'home',
        guardian: fields.guardianType || 'mother',
        schoolsup: 'no', famsup: 'yes', paid: 'no',
        activities: fields.extracurricular === 'yes' ? 'yes' : 'no',
        nursery: 'yes', higher: 'yes',
        internet: fields.internet === 'yes' ? 'yes' : 'no',
        romantic: fields.romanticRelationship === 'yes' ? 'yes' : 'no',
        subject: 'Math',
        age: parseFloat(fields.age) || 17,
        Medu: 2, Fedu: 2, traveltime: 1,
        studytime,
        failures: parseFloat(fields.pastFailures) || 0,
        famrel: parseFloat(fields.familyRelationship) || 4,
        freetime: parseFloat(fields.freeTime) || 3,
        goout: parseFloat(fields.goingOut) || 2,
        Dalc: parseFloat(fields.workdayAlcohol) || 1,
        Walc: parseFloat(fields.weekendAlcohol) || 1,
        health: parseFloat(fields.healthStatus) || 4,
        absences,
        G1: g1g2,
        G2: g1g2,
        selectedStudent: fields.selectedStudent,
        gradeLevel: fields.gradeLevel,
      };

      const res = await predict(payload);
      setResult({ ...res, inputFields: { ...fields } });
      const updatedPredictions = await getPredictions();
      setPredictions(updatedPredictions);
      showToast('Prediction complete!');
    } catch (err) {
      showToast(err.message || 'Prediction failed. Please try again.');
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
  const performLabel = !hasResult ? '—' : isPass ? 'High' : 'At Risk';
  const performColor = !hasResult ? 'text-gray-300' : isPass ? 'text-green-500 font-bold' : 'text-red-500 font-bold';
  const badgeBg = !hasResult ? 'bg-gray-100 text-gray-400' : isPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  const badgeText = !hasResult ? '— Pending' : isPass ? '↑ High Performance Predicted' : '↓ At Risk Predicted';

  const factorBars = hasResult ? computeFactorBars(result.inputFields, result) : null;
  const distSegments = computeDistribution(predictions);

  const PredictionRow = ({ p }) => (
    <tr className="border-b border-gray-50">
      <td className="py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
            {(p.student_name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <p className="font-medium text-gray-800 text-xs">{p.student_name}</p>
            <p className="text-xs text-gray-400">{p.grade_level || '—'}</p>
          </div>
        </div>
      </td>
      <td className="py-4 text-xs text-gray-500 max-w-xs">{p.input_summary}</td>
      <td className="py-4">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${p.performance === 'High Performer' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {p.performance}
        </span>
      </td>
      <td className="py-4 text-xs text-gray-500">{p.confidence}</td>
      <td className="py-4 text-xs text-gray-500">{p.predicted_on}</td>
      <td className="py-4">
        <button className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"><MoreVertical size={15} /></button>
      </td>
    </tr>
  );

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Predict Performance <TrendingUp size={22} className="text-indigo-500" />
          </h1>
          <p className="text-sm text-gray-500 mt-1">Enter student details to predict academic performance using our ML model.</p>
        </div>
        <button className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 shadow-sm">
          <HelpCircle size={16} /> How it works
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-6">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${i < step ? 'bg-indigo-600 border-indigo-600 text-white' : i === step ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-gray-200 text-gray-300 bg-white'}`}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs mt-1 text-center whitespace-nowrap ${i === step ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-4 mx-1 ${i < step ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-1">
            <User size={18} className="text-indigo-500" />
            <h2 className="font-semibold text-gray-800">{STEP_LABELS[step]}</h2>
          </div>
          <p className="text-xs text-gray-400 mb-5">
            {step === 0 && 'Provide academic details to help the model assess performance.'}
            {step === 1 && 'Select or add a student and provide background information.'}
            {step === 2 && 'Share lifestyle and wellbeing factors that influence performance.'}
          </p>

          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Study Hours per Week"><NumberInput value={fields.studyHours} onChange={set('studyHours')} suffix="hrs" /></Field>
              <Field label="Attendance (%)"><NumberInput value={fields.attendance} onChange={set('attendance')} suffix="%" /></Field>
              <Field label="Previous GPA"><NumberInput value={fields.gpa} onChange={set('gpa')} suffix="/4.0" /></Field>
              <Field label="Assignments Submitted (%)"><NumberInput value={fields.assignments} onChange={set('assignments')} suffix="%" /></Field>
              <Field label="Number of Past Failures"><NumberInput value={fields.pastFailures} onChange={set('pastFailures')} /></Field>
              <Field label="Current Period Grade (if available)"><NumberInput value={fields.currentGrade} onChange={set('currentGrade')} suffix="/20" /></Field>
              <Field label="Study Environment"><SelectInput value={fields.studyEnvironment} onChange={set('studyEnvironment')} options={[{value:'home',label:'Home'},{value:'library',label:'Library'},{value:'school',label:'School'},{value:'mixed',label:'Mixed'}]} /></Field>
              <Field label="Preferred Learning Style"><SelectInput value={fields.learningStyle} onChange={set('learningStyle')} options={[{value:'visual',label:'Visual'},{value:'auditory',label:'Auditory'},{value:'reading',label:'Reading/Writing'},{value:'kinesthetic',label:'Kinesthetic'}]} /></Field>
              <Field label="Academic Goal"><SelectInput value={fields.academicGoal} onChange={set('academicGoal')} options={[{value:'pass',label:'Pass the course'},{value:'distinction',label:'Get a distinction'},{value:'scholarship',label:'Win a scholarship'},{value:'career',label:'Career advancement'}]} /></Field>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>Select Student</label>
                {!showAddStudent ? (
                  <select value={fields.selectedStudent}
                    onChange={(e) => { if (e.target.value === '__add__') { setShowAddStudent(true); } else { setFields((p) => ({ ...p, selectedStudent: e.target.value })); } }}
                    className={inputClass}>
                    <option value="">— Select a student —</option>
                    {students.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                    <option value="__add__">+ Add New Student</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <input type="text" placeholder="Enter student name..." value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddStudentInline()}
                      className={`${inputClass} flex-1`} autoFocus />
                    <button onClick={handleAddStudentInline} className="px-4 py-2.5 rounded-lg text-white text-sm" style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}><Plus size={16} /></button>
                    <button onClick={() => setShowAddStudent(false)} className="px-3 py-2.5 rounded-lg border border-gray-200 text-gray-500"><X size={16} /></button>
                  </div>
                )}
                {fields.selectedStudent && <p className="text-xs text-indigo-500 mt-1">✓ Selected: {fields.selectedStudent}</p>}
              </div>
              <Field label="Age"><NumberInput value={fields.age} onChange={set('age')} /></Field>
              <Field label="Gender"><SelectInput value={fields.gender} onChange={set('gender')} options={[{value:'male',label:'Male'},{value:'female',label:'Female'},{value:'other',label:'Other'},{value:'prefer_not',label:'Prefer not to say'}]} /></Field>
              <Field label="Grade / Year Level"><SelectInput value={fields.gradeLevel} onChange={set('gradeLevel')} options={['7th Grade','8th Grade','9th Grade','10th Grade','11th Grade','12th Grade','Undergraduate','Postgraduate'].map(v=>({value:v,label:v}))} /></Field>
              <Field label="School Type"><SelectInput value={fields.schoolType} onChange={set('schoolType')} options={[{value:'public',label:'Public'},{value:'private',label:'Private'},{value:'international',label:'International'},{value:'homeschool',label:'Homeschool'}]} /></Field>
              <Field label="Guardian Type"><SelectInput value={fields.guardianType} onChange={set('guardianType')} options={[{value:'mother',label:'Mother'},{value:'father',label:'Father'},{value:'both',label:'Both Parents'},{value:'other',label:'Other'}]} /></Field>
              <Field label="Parental Education"><SelectInput value={fields.parentalEducation} onChange={set('parentalEducation')} options={[{value:'none',label:'None'},{value:'primary',label:'Primary'},{value:'highschool',label:'High School'},{value:'undergraduate',label:'Undergraduate'},{value:'graduate',label:'Graduate'},{value:'postgraduate',label:'Postgraduate'}]} /></Field>
              <Field label="Family Size"><SelectInput value={fields.familySize} onChange={set('familySize')} options={[{value:'small',label:'1–3 members'},{value:'medium',label:'4–6 members'},{value:'large',label:'7+ members'}]} /></Field>
              <Field label="Home Address Type"><SelectInput value={fields.addressType} onChange={set('addressType')} options={[{value:'urban',label:'Urban'},{value:'rural',label:'Rural'},{value:'suburban',label:'Suburban'}]} /></Field>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Sleep Hours per Night"><NumberInput value={fields.sleepHours} onChange={set('sleepHours')} suffix="hrs" /></Field>
              <Field label="Extracurricular Activities"><SelectInput value={fields.extracurricular} onChange={set('extracurricular')} options={YES_NO} /></Field>
              <Field label="Going Out with Friends"><SelectInput value={fields.goingOut} onChange={set('goingOut')} options={LEVEL_5} /></Field>
              <Field label="Health Status"><SelectInput value={fields.healthStatus} onChange={set('healthStatus')} options={QUALITY_5} /></Field>
              <Field label="Free Time After School"><SelectInput value={fields.freeTime} onChange={set('freeTime')} options={LEVEL_5} /></Field>
              <Field label="Internet Access"><SelectInput value={fields.internet} onChange={set('internet')} options={YES_NO} /></Field>
              <Field label="Workday Alcohol"><SelectInput value={fields.workdayAlcohol} onChange={set('workdayAlcohol')} options={LEVEL_5} /></Field>
              <Field label="Weekend Alcohol"><SelectInput value={fields.weekendAlcohol} onChange={set('weekendAlcohol')} options={LEVEL_5} /></Field>
              <Field label="Romantic Relationship"><SelectInput value={fields.romanticRelationship} onChange={set('romanticRelationship')} options={YES_NO} /></Field>
              <Field label="Family Relationship Quality"><SelectInput value={fields.familyRelationship} onChange={set('familyRelationship')} options={QUALITY_5} /></Field>
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelClass}>Motivation Level</label>
                  <span className="text-sm text-indigo-600 font-medium">{fields.motivationLevel <= 33 ? 'Low' : fields.motivationLevel <= 66 ? 'Medium' : 'High'}</span>
                </div>
                <input type="range" min="0" max="100" value={fields.motivationLevel} onChange={set('motivationLevel')} className="w-full accent-indigo-600" />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            {step > 0 ? (
              <button onClick={() => setStep((s) => s - 1)} className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                <ChevronLeft size={16} /> Back
              </button>
            ) : <div />}
            {step < 2 ? (
              <button onClick={() => setStep((s) => s + 1)} className="flex items-center gap-2 text-white font-semibold px-6 py-2.5 rounded-lg text-sm" style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handlePredict} disabled={loading} className="flex items-center gap-2 text-white font-bold px-6 py-2.5 rounded-lg text-sm disabled:opacity-60" style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>
                <Sparkles size={16} /> {loading ? 'Predicting...' : 'Predict Performance'}
              </button>
            )}
          </div>
          {step === 2 && (
            <div className="flex items-center gap-2 text-xs text-indigo-500 mt-3">
              <Info size={14} /> All inputs are used by the ML model to generate an accurate prediction.
            </div>
          )}
        </div>

        {/* Result panel */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
          <h2 className="font-bold text-gray-800 mb-5">Prediction Result</h2>
          <div className="flex flex-col gap-6 flex-1">
            <div className="flex items-start gap-4">
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
              <div className="flex-1 flex flex-col gap-2">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full w-fit flex items-center gap-1 ${badgeBg}`}>
                  <TrendingUp size={12} /> {badgeText}
                </span>
                <p className="text-xs text-gray-600 leading-relaxed">
                  The model predicts this student is likely to perform <span className={performColor}>{performLabel}</span>
                </p>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 w-fit">
                  <span className="text-xs text-gray-500">Confidence Score</span>
                  <span className={`text-sm font-bold ${scoreValueColor}`}>{hasResult ? result.confidence : '—'}</span>
                </div>
              </div>
              <div className="relative shrink-0">
                <div className={`w-20 h-20 rounded-full ${illustrationBg} flex items-center justify-center overflow-hidden`}>
                  <img src={illustrationImg} alt="result" className="w-full h-full object-contain" />
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>↑</div>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="grid grid-cols-2 gap-6 flex-1">
              {/* Key factors — now fills after prediction */}
              <div>
                <h3 className="text-xs font-semibold text-gray-800 mb-4">Key Factors Affecting Performance</h3>
                <div className="flex flex-col gap-4">
                  {(factorBars || [
                    { label: 'Attendance', color: '#22C55E', pct: 0 },
                    { label: 'Study Hours', color: '#3B82F6', pct: 0 },
                    { label: 'Previous GPA', color: '#8B5CF6', pct: 0 },
                    { label: 'Assignments', color: '#F97316', pct: 0 },
                    { label: 'Sleep Hours', color: '#EAB308', pct: 0 },
                  ]).map((f) => (
                    <div key={f.label} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-24 shrink-0">{f.label}</span>
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ background: f.color, width: `${f.pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right shrink-0">
                        {f.pct > 0 ? `${Math.round(f.pct)}%` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance distribution — fills from real prediction history */}
              <div className="flex flex-col">
                <h3 className="text-xs font-semibold text-gray-800 mb-4">Performance Distribution</h3>
                <div className="flex items-center gap-4">
                  <DonutChart segments={distSegments || []} centerValue={predictions.length || '—'} centerLabel="Total" />
                  <div className="flex flex-col gap-3">
                    {(distSegments || [
                      { label: 'High Performers', color: '#22C55E', pct: 0, count: '—' },
                      { label: 'Average Performers', color: '#3B82F6', pct: 0, count: '—' },
                      { label: 'At Risk', color: '#EF4444', pct: 0, count: '—' },
                    ]).map((d) => (
                      <div key={d.label} className="flex items-start gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ background: d.color }} />
                        <div>
                          <p className="text-xs text-gray-600 leading-tight">{d.label}</p>
                          <p className="text-xs text-gray-400">{d.pct > 0 ? `${d.pct}% (${d.count})` : '—'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-4">
                  <Calendar size={12} /> Predicted on: {hasResult ? result.predicted_on : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Predictions */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-800">Recent Predictions</h2>
          <button onClick={() => setShowAllPredictions(true)} className="text-sm text-indigo-600 font-medium hover:underline">View All Predictions →</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="pb-3 font-medium">Student Name</th>
              <th className="pb-3 font-medium">Input Summary</th>
              <th className="pb-3 font-medium">Prediction</th>
              <th className="pb-3 font-medium">Confidence</th>
              <th className="pb-3 font-medium">Predicted On</th>
              <th className="pb-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {predictions.slice(0, 5).length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-xs text-gray-400 italic">No predictions yet — complete the form and click Predict Performance.</td></tr>
            ) : predictions.slice(0, 5).map((p, i) => <PredictionRow key={i} p={p} />)}
          </tbody>
        </table>
      </div>

      {/* View All Dialog */}
      {showAllPredictions && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">All Predictions ({predictions.length})</h2>
              <button onClick={() => setShowAllPredictions(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="pb-3 font-medium">Student Name</th>
                    <th className="pb-3 font-medium">Input Summary</th>
                    <th className="pb-3 font-medium">Prediction</th>
                    <th className="pb-3 font-medium">Confidence</th>
                    <th className="pb-3 font-medium">Predicted On</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-xs text-gray-400 italic">No predictions yet.</td></tr>
                  ) : predictions.map((p, i) => <PredictionRow key={i} p={p} />)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
