interface DataPoint {
  label: string;
  value: number;
  max: number;
}

interface RadarChartProps {
  data: DataPoint[];
}

export default function RadarChart({ data }: RadarChartProps) {
  const cx = 200, cy = 170, r = 110;
  const n = data.length || 4;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  function polar(angle: number, radius: number) {
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  }

  const rings = [1, 2, 3, 4].map((ring) => {
    const ringR = (r / 4) * ring;
    const points = Array.from({ length: n }, (_, i) => {
      const p = polar(startAngle + i * angleStep, ringR);
      return `${p.x},${p.y}`;
    }).join(' ');
    return (
      <polygon
        key={ring}
        points={points}
        fill="none"
        stroke={ring === 4 ? '#d4cbc0' : '#e8e2d9'}
        strokeWidth={1}
      />
    );
  });

  const axes = Array.from({ length: n }, (_, i) => {
    const p = polar(startAngle + i * angleStep, r);
    return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e8e2d9" strokeWidth={1} />;
  });

  const labels = data.map((d, i) => {
    const p = polar(startAngle + i * angleStep, r + 30);
    return (
      <text
        key={i}
        x={p.x}
        y={p.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontWeight={600}
        fill="#6b6460"
        fontFamily="DM Sans, sans-serif"
      >
        {d.label}
      </text>
    );
  });

  let dataPolygon = null;
  let dataPoints = null;
  if (data.length > 0) {
    const pts = data.map((d, i) => {
      const pct = d.value / d.max;
      return polar(startAngle + i * angleStep, r * pct);
    });
    const polyPoints = pts.map((p) => `${p.x},${p.y}`).join(' ');
    dataPolygon = <polygon points={polyPoints} fill="rgba(200,113,86,0.15)" stroke="#c87156" strokeWidth={2.5} />;
    dataPoints = pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={4} fill="#c87156" />);
  }

  return (
    <svg viewBox="0 0 400 340" className="w-full max-w-[340px] h-auto">
      {rings}
      {axes}
      {dataPolygon}
      {dataPoints}
      {labels}
    </svg>
  );
}
