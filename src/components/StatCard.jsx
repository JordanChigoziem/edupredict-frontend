export default function StatCard({ icon, iconBg, label, value, delta, deltaUp }) {
  const hasDelta = delta && delta !== '—';
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex-1">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>{icon}</div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className={`text-xs mt-0.5 flex items-center gap-1 ${hasDelta ? (deltaUp ? 'text-green-600' : 'text-red-500') : 'text-gray-400'}`}>
        {hasDelta && (deltaUp ? '↑' : '↓')} {delta}
      </p>
    </div>
  );
}
