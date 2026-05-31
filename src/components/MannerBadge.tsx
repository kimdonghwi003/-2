export default function MannerBadge({ score }: { score: number }) {
  const color =
    score >= 38 ? '#9B1C1C' : score >= 36.5 ? '#2D6A4F' : '#1E40AF'
  const label = score.toFixed(1) + '°C'
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      🌡️ {label}
    </span>
  )
}
