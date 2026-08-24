import React from 'react';

interface CoiCadSchematicProps {
  partNumber?: string;
  width?: number;
  height?: number;
  outerWeb?: number;
  sideWeb?: number;
  innerWeb?: number;
}

export const CoiCadSchematic: React.FC<CoiCadSchematicProps> = ({
  width = 14.8,
  height = 1.74,
  outerWeb = 0.225,
  sideWeb = 0.62,
  innerWeb = 0.25
}) => {
  return (
    <div className="border border-slate-900 bg-white p-2 text-slate-900 font-sans text-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
        {/* Left: Cross Section CAD Profile with Precision Callouts */}
        <div className="border border-slate-300 p-2 rounded bg-slate-50 flex flex-col items-center">
          <div className="text-[10px] font-bold text-slate-700 mb-1 w-full text-center uppercase tracking-wider">
            Cross Section Technical Schematic (Multi-Port Tube)
          </div>
          <svg viewBox="0 0 420 160" className="w-full h-auto max-h-36">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#1e293b" />
              </marker>
            </defs>

            {/* Background / Datum */}
            <line x1="30" y1="80" x2="390" y2="80" stroke="#94a3b8" strokeDasharray="3,3" strokeWidth="0.75" />

            {/* Outer Profile Box (Rounded Capsule) */}
            <rect
              x="50"
              y="55"
              width="320"
              height="50"
              rx="18"
              ry="18"
              fill="#f1f5f9"
              stroke="#0f172a"
              strokeWidth="2.5"
            />

            {/* Inner Multi-Port Holes (12 Slots) */}
            {Array.from({ length: 12 }).map((_, idx) => {
              const startX = 72 + idx * 23;
              return (
                <rect
                  key={idx}
                  x={startX}
                  y="64"
                  width="17"
                  height="32"
                  rx="3"
                  ry="3"
                  fill="#ffffff"
                  stroke="#0f172a"
                  strokeWidth="1.2"
                />
              );
            })}

            {/* Dimension Callouts: Outer Width 14.8 ± 0.05 */}
            <line x1="50" y1="42" x2="370" y2="42" stroke="#0f172a" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
            <line x1="50" y1="53" x2="50" y2="38" stroke="#64748b" strokeWidth="0.75" />
            <line x1="370" y1="53" x2="370" y2="38" stroke="#64748b" strokeWidth="0.75" />
            <text x="210" y="36" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="bold">
              {width.toFixed(2)} ± 0.05 mm
            </text>

            {/* Dimension Callouts: Height 1.74 ± 0.015 */}
            <line x1="390" y1="55" x2="390" y2="105" stroke="#0f172a" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
            <line x1="372" y1="55" x2="395" y2="55" stroke="#64748b" strokeWidth="0.75" />
            <line x1="372" y1="105" x2="395" y2="105" stroke="#64748b" strokeWidth="0.75" />
            <text x="398" y="83" fill="#0f172a" fontSize="9" fontWeight="bold">
              {height.toFixed(2)} ± 0.015
            </text>

            {/* Dimension Callouts: Side Web Thickness 0.62 */}
            <line x1="50" y1="115" x2="72" y2="115" stroke="#0f172a" strokeWidth="0.9" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
            <text x="61" y="127" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="bold">
              {sideWeb.toFixed(2)} ± 0.05
            </text>

            {/* Dimension Callouts: Inner Web Thickness 0.25 */}
            <line x1="164" y1="115" x2="187" y2="115" stroke="#0f172a" strokeWidth="0.8" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
            <text x="175" y="127" textAnchor="middle" fill="#0f172a" fontSize="8">
              12 - {innerWeb.toFixed(2)}
            </text>

            {/* Corner Radius & Hole Pitch Note */}
            <text x="75" y="148" fill="#475569" fontSize="8">
              Pitch: 11 - 1.06 mm | Corner: R0.10 MIN | Outer Web: {outerWeb.toFixed(3)} mm
            </text>
          </svg>
        </div>

        {/* Right: 4 Geometric Tolerance Visual Sketches (Warp, Curved, Twist, Undulation) */}
        <div className="border border-slate-300 p-2 rounded bg-slate-50">
          <div className="text-[10px] font-bold text-slate-700 mb-1 text-center uppercase tracking-wider">
            Form & Tolerance Standards (幾何公差基準)
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[9px]">
            {/* Warp 反り */}
            <div className="border border-slate-200 bg-white p-1 rounded">
              <div className="flex justify-between font-bold text-slate-800">
                <span>反り (Warp)</span>
                <span className="text-blue-700">≤ 1.0 mm</span>
              </div>
              <svg viewBox="0 0 100 24" className="w-full h-5 mt-0.5">
                <path d="M 5 18 Q 50 6 95 18" fill="none" stroke="#2563eb" strokeWidth="1.5" />
                <line x1="5" y1="20" x2="95" y2="20" stroke="#94a3b8" strokeDasharray="2,2" strokeWidth="0.8" />
              </svg>
              <div className="text-[7.5px] text-slate-500 text-center">Flat table measurement</div>
            </div>

            {/* Curved 湾曲 */}
            <div className="border border-slate-200 bg-white p-1 rounded">
              <div className="flex justify-between font-bold text-slate-800">
                <span>湾曲 (Curved)</span>
                <span className="text-blue-700">-0.7 ~ +0.3 mm</span>
              </div>
              <svg viewBox="0 0 100 24" className="w-full h-5 mt-0.5">
                <path d="M 5 10 Q 50 20 95 10" fill="none" stroke="#2563eb" strokeWidth="1.5" />
                <line x1="5" y1="10" x2="95" y2="10" stroke="#94a3b8" strokeDasharray="2,2" strokeWidth="0.8" />
              </svg>
              <div className="text-[7.5px] text-slate-500 text-center">Side curve tolerance</div>
            </div>

            {/* Twist 捩り */}
            <div className="border border-slate-200 bg-white p-1 rounded">
              <div className="flex justify-between font-bold text-slate-800">
                <span>捩り (Twist)</span>
                <span className="text-blue-700">≤ 1.7 mm</span>
              </div>
              <svg viewBox="0 0 100 24" className="w-full h-5 mt-0.5">
                <path d="M 10 6 L 85 16" stroke="#2563eb" strokeWidth="1.5" />
                <line x1="10" y1="16" x2="85" y2="16" stroke="#94a3b8" strokeDasharray="2,2" strokeWidth="0.8" />
                <path d="M 80 10 A 6 6 0 0 1 84 15" fill="none" stroke="#dc2626" strokeWidth="1" />
              </svg>
              <div className="text-[7.5px] text-slate-500 text-center">One edge pressed down</div>
            </div>

            {/* Undulation うねり */}
            <div className="border border-slate-200 bg-white p-1 rounded">
              <div className="flex justify-between font-bold text-slate-800">
                <span>うねり (Undulation)</span>
                <span className="text-blue-700">≤ 0.2 mm</span>
              </div>
              <svg viewBox="0 0 100 24" className="w-full h-5 mt-0.5">
                <path d="M 5 12 Q 25 6 50 12 T 95 12" fill="none" stroke="#2563eb" strokeWidth="1.5" />
                <line x1="5" y1="18" x2="95" y2="18" stroke="#94a3b8" strokeWidth="0.8" />
              </svg>
              <div className="text-[7.5px] text-slate-500 text-center">Wave height &lt; 0.2mm</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
