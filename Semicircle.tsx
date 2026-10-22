interface SemicircleProps {
  width?: number;
  height?: number;
  className?: string;
  gradientColors?: {
    start: string;
    middle: string;
    end: string;
  };
}

export default function Semicircle({
  width = 200,
  height = 100,
  className = "",
  gradientColors = {
    start: "#4158D0",
    middle: "#C850C0",
    end: "#FFCC70",
  },
}: SemicircleProps) {
  const radius = width / 2;

  return (
    <svg
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient
          id="semicircleGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor={gradientColors.start} stopOpacity={1} />
          <stop offset="50%" stopColor={gradientColors.middle} stopOpacity={1} />
          <stop offset="100%" stopColor={gradientColors.end} stopOpacity={1} />
        </linearGradient>
      </defs>
      <path
        d={`M 0 ${height} A ${radius} ${radius} 0 0 1 ${width} ${height} Z`}
        fill="url(#semicircleGradient)"
      />
    </svg>
  );
}
