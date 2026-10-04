import React from 'react';

export const RevolvingAtmosphere: React.FC = () => {
  return (
    <div 
      aria-hidden="true" 
      className="fixed inset-x-0 bottom-0 h-[380px] sm:h-[460px] pointer-events-none z-0 overflow-hidden flex items-end justify-center"
    >
      {/* Soft breathing radial background aura */}
      <div className="absolute inset-0 delphi-ambient-glow animate-breathe" />

      {/* Dynamic Revolving Orbital Horizon Container (Anchored at Bottom Center) */}
      <div className="relative w-[1800px] h-[900px] -mb-[520px] sm:-mb-[480px] flex items-center justify-center pointer-events-none">
        
        {/* Ring 1 (Outermost Orbit): Clockwise slow revolution */}
        <div className="absolute w-[1600px] h-[1600px] rounded-full animate-spin-orbit-slow">
          <svg className="w-full h-full" viewBox="0 0 1600 1600" fill="none">
            <circle 
              cx="800" 
              cy="800" 
              r="780" 
              stroke="#0284c7" 
              strokeWidth="1.2" 
              strokeOpacity="0.25" 
              strokeDasharray="18 22" 
            />
            {/* Subtle accent dash pulses along the orbit */}
            <circle 
              cx="800" 
              cy="800" 
              r="780" 
              stroke="#38bdf8" 
              strokeWidth="2" 
              strokeOpacity="0.6" 
              strokeDasharray="60 740" 
            />
          </svg>
        </div>

        {/* Ring 2 (Middle Orbit): Counter-clockwise revolution */}
        <div className="absolute w-[1240px] h-[1240px] rounded-full animate-spin-orbit-reverse">
          <svg className="w-full h-full" viewBox="0 0 1240 1240" fill="none">
            <circle 
              cx="620" 
              cy="620" 
              r="600" 
              stroke="#38bdf8" 
              strokeWidth="1.2" 
              strokeOpacity="0.22" 
              strokeDasharray="28 20 8 20" 
            />
            {/* Glowing revolving node on mid ring */}
            <circle 
              cx="620" 
              cy="20" 
              r="3" 
              fill="#38bdf8" 
              className="opacity-75 drop-shadow-[0_0_8px_#38bdf8]" 
            />
            <circle 
              cx="620" 
              cy="1220" 
              r="2.5" 
              fill="#0284c7" 
              className="opacity-60 drop-shadow-[0_0_6px_#0284c7]" 
            />
          </svg>
        </div>

        {/* Ring 3 (Inner Orbit): Faster Clockwise revolution */}
        <div className="absolute w-[880px] h-[880px] rounded-full animate-spin-orbit-fast">
          <svg className="w-full h-full" viewBox="0 0 880 880" fill="none">
            <circle 
              cx="440" 
              cy="440" 
              r="420" 
              stroke="#0284c7" 
              strokeWidth="1" 
              strokeOpacity="0.18" 
              strokeDasharray="12 16" 
            />
            <circle 
              cx="440" 
              cy="20" 
              r="2" 
              fill="#7dd3fc" 
              className="opacity-70" 
            />
          </svg>
        </div>

        {/* Ring 4 (Deep Core Orbit): Continuous streaming dashes */}
        <div className="absolute w-[560px] h-[560px] rounded-full animate-dash-stream">
          <svg className="w-full h-full" viewBox="0 0 560 560" fill="none">
            <circle 
              cx="280" 
              cy="280" 
              r="260" 
              stroke="#0ea5e9" 
              strokeWidth="0.8" 
              strokeOpacity="0.15" 
              strokeDasharray="6 12" 
            />
          </svg>
        </div>

      </div>
    </div>
  );
};
