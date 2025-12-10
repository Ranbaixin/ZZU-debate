import React from 'react';

interface ClockProps {
  totalTime: number;
  currentTime: number;
  isActive: boolean;
  isFinished: boolean;
  label: string;
  subLabel?: string;
  size?: number;
}

const Clock: React.FC<ClockProps> = ({ totalTime, currentTime, isActive, isFinished, label, subLabel, size = 300 }) => {
  // Radius: 45% of size to leave room for stroke and padding
  const radius = size * 0.45;
  const center = size / 2;

  // Progress 0 (Start) -> 1 (End)
  const progress = Math.max(0, Math.min(1, 1 - (currentTime / Math.max(0.1, totalTime))));
  
  // 1. Calculate Angles
  // Top (12 o'clock) is -PI/2 in SVG coordinate system
  const startAngle = -Math.PI / 2; 
  
  // Pointer Angle: -PI/2 (Start) minus (2*PI * progress) (Counter-Clockwise movement)
  const pointerAngleRad = startAngle - (2 * Math.PI * progress);
  
  // 2. Calculate Coordinates for SVG Path
  const ptrX = center + radius * Math.cos(pointerAngleRad);
  const ptrY = center + radius * Math.sin(pointerAngleRad);
  
  const topX = center + radius * Math.cos(startAngle);
  const topY = center + radius * Math.sin(startAngle);

  // 3. Define Red Path (Remaining Time)
  // Logic: Pointer moves CCW (12 -> 11 -> 10).
  // The Red Area (Remaining) is the sector from Top (12) sweeping Clockwise to the Pointer.
  
  const isFull = progress <= 0.001;
  const isEmpty = progress >= 0.999;
  
  let redPathD = "";
  
  if (isFull) {
      // Draw full circle
      redPathD = `M ${center},${center - radius} A ${radius},${radius} 0 1,1 ${center},${center + radius} A ${radius},${radius} 0 1,1 ${center},${center - radius} Z`;
  } else if (isEmpty) {
      redPathD = ""; // No red
  } else {
      // Large Arc Flag:
      // If remaining time (1 - progress) > 0.5, we draw the large arc.
      const largeArc = (1 - progress) > 0.5 ? 1 : 0;
      
      redPathD = [
          `M ${center},${center}`, // 1. Start at Center
          `L ${topX},${topY}`,     // 2. Line to Top (Start of Red Sector)
          `A ${radius},${radius} 0 ${largeArc},1 ${ptrX},${ptrY}`, // 3. Arc to Pointer (Sweep 1 = Clockwise)
          `Z` // 4. Close back to center
      ].join(" ");
  }

  // Pointer Rotation for the div (in degrees)
  // Pointer moves Counter-Clockwise, so negative rotation
  const pointerRotationDeg = -360 * progress;

  // --- Dynamic Color Logic for Warning Cues ---
  let sectorColor = "#A91D32"; // Default ZZU Red
  let digitColorClass = isActive ? 'text-zzu-dark' : 'text-gray-300';
  
  if (isActive && currentTime > 0) {
      if (currentTime <= 5) {
          sectorColor = "#DC2626"; // Critical Red (Red-600)
          digitColorClass = 'text-red-600 animate-pulse';
      } else if (currentTime <= 30) {
          sectorColor = "#D97706"; // Warning Amber (Amber-600)
          digitColorClass = 'text-amber-600';
      }
  }

  return (
    <div className="flex flex-col items-center">
      {/* 1. The Analog Clock Dial */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background Track (Light Gray) */}
            <circle cx={center} cy={center} r={radius} fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="2" /> 

            {/* Colored Sector (Time Remaining) */}
            <path
                d={redPathD}
                fill={sectorColor}
                // Transition for smooth color change
                style={{ transition: 'fill 0.5s ease' }}
            />
            
            {/* Ticks */}
            {Array.from({ length: 12 }).map((_, i) => {
                const tickAngle = i * 30 * (Math.PI / 180);
                const rInner = radius * 0.85;
                const rOuter = radius * 0.95;
                const x1 = center + rInner * Math.cos(tickAngle);
                const y1 = center + rInner * Math.sin(tickAngle);
                const x2 = center + rOuter * Math.cos(tickAngle);
                const y2 = center + rOuter * Math.sin(tickAngle);
                return (
                <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="currentColor" 
                    strokeWidth="2"
                    className="text-white opacity-60 mix-blend-overlay"
                />
                );
            })}
        </svg>

        {/* Pointer Layer */}
        <div 
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{
                transform: `rotate(${pointerRotationDeg}deg)`,
                transition: 'none' // Ensure no transition for instant response
            }}
        >
            {/* Pointer Arm */}
            <div 
                className="absolute left-1/2 top-0 z-10"
                style={{
                    width: '4px',
                    height: '50%', // Reaches exactly to center
                    left: 'calc(50% - 2px)',
                    transformOrigin: 'bottom center'
                }}
            >
                {/* Needle */}
                <div className="w-1.5 h-[55%] bg-gray-900 mx-auto mt-[5%] rounded-full shadow-lg border border-white/20"></div>
            </div>
             {/* Center Cap */}
             <div className="absolute top-1/2 left-1/2 w-5 h-5 bg-gray-900 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg z-20 border-2 border-white"></div>
        </div>
      </div>

      {/* 2. The Digital Display (Outside and Below) */}
      <div className="mt-4 flex flex-col items-center">
        {/* Large Digital Numbers */}
        <div className={`digit-font text-6xl font-bold tracking-tighter leading-none transition-colors duration-300 ${digitColorClass}`}>
             {currentTime.toFixed(1)}<span className="text-2xl font-serif text-gray-400 font-normal ml-1">s</span>
        </div>
        
        {/* Labels */}
        <div className="mt-2 flex flex-col items-center">
            <span className={`text-xl font-serif font-bold ${isActive ? 'text-zzu-red' : 'text-gray-400'}`}>
                {label}
            </span>
            {subLabel && (
                <span className="text-sm font-serif text-gray-400 mt-1">
                    {subLabel}
                </span>
            )}
        </div>
      </div>
    </div>
  );
};

export default Clock;