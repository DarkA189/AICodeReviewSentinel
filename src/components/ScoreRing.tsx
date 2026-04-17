// src/components/ScoreRing.tsx
interface ScoreRingProps {
  score: number;
  size?: number;
  label?: string;
  sublabel?: string;
  animate?: boolean;
}

const SCORE_COLOR = (score: number) => {
  if (score >= 80) return "#32D74B";
  if (score >= 60) return "#FFD60A";
  if (score >= 40) return "#FF6B35";
  return "#FF2D55";
};

export function ScoreRing({
  score,
  size = 80,
  label,
  sublabel,
  animate = true,
}: ScoreRingProps) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = SCORE_COLOR(score);
  const strokeWidth = 5;

  return (
    <div className="flex flex-col items-center gap-1">
      <div 
        className="relative flex items-center justify-center" 
        style={{ 
          width: size, 
          height: size,
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute"
          style={{ 
            transform: "rotate(-90deg)",
            overflow: "visible" // Allow glow to extend beyond bounds
          }}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={strokeWidth}
          />
          {/* Fill with glow */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: animate ? "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" : "none",
              filter: `drop-shadow(0 0 6px ${color}80)`,
            }}
          />
        </svg>

        {/* Center score */}
        <span
          className="font-display font-bold tabular-nums relative z-10"
          style={{
            fontSize: size < 70 ? "14px" : "18px",
            color,
            lineHeight: 1,
          }}
        >
          {score}
        </span>
      </div>

      {label && (
        <div className="text-center">
          <div className="text-xs font-medium text-white capitalize">{label}</div>
          {sublabel && (
            <div className="text-[10px] text-muted-foreground">{sublabel}</div>
          )}
        </div>
      )}
    </div>
  );
}