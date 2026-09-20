import React from 'react';
import type { Character } from '../types';

interface StatRadarChartProps {
  characterA: Character;
  characterB?: Character;
  size?: number;
  language?: string;
  showLegend?: boolean;
}

interface RadarScore {
  taijutsu: number; // 0-100
  jujutsu: number;  // 0-100
  gauge: number;    // 0-100 (speed: lower gauge = higher score)
  hp: number;       // 0-100
  burst: number;    // 0-100
}

function extractRadarScores(c: Character): RadarScore {
  const hp = parseInt(String(c.stats?.hp || 0).replace(/[^\d]/g, '')) || 0;
  const atk = parseInt(String(c.stats?.attack || 0).replace(/[^\d]/g, '')) || 0;
  const jjt = parseInt(String(c.stats?.jujutsu || 0).replace(/[^\d]/g, '')) || 0;
  const gauge = parseInt(String(c.stats?.special_gauge || 1200).replace(/[^\d]/g, '')) || 1200;

  // Ultimate technique power
  const text = (c.ultimate?.description_10 || c.ultimate?.description || '');
  const allMatches = [...text.matchAll(/(\d+(?:\.\d+)?)%/g)].map(m => parseFloat(m[1]));
  let ultPower = 400;
  if (allMatches.length > 0) {
    const highMults = allMatches.filter(n => n >= 250);
    if (highMults.length > 0) {
      ultPower = Math.max(...highMults);
    } else {
      ultPower = Math.max(...allMatches) * 4.5;
    }
  }

  // Normalization to 0-100 scales
  const scoreHp = Math.max(10, Math.min(100, Math.round((hp / 54000) * 100)));
  const scoreAtk = Math.max(10, Math.min(100, Math.round((atk / 15200) * 100)));
  const scoreJjt = Math.max(10, Math.min(100, Math.round((jjt / 15000) * 100)));
  // Lower gauge requires fewer hits/turns -> higher combat rating
  const clampedGauge = Math.min(2334, Math.max(900, gauge));
  const scoreSpeed = Math.max(15, Math.min(100, Math.round(100 - ((clampedGauge - 900) / 1434) * 80)));
  const scoreBurst = Math.max(15, Math.min(100, Math.round((ultPower / 2100) * 100)));

  return {
    taijutsu: scoreAtk,
    jujutsu: scoreJjt,
    gauge: scoreSpeed,
    hp: scoreHp,
    burst: scoreBurst,
  };
}

const AXIS_KEYS: (keyof RadarScore)[] = ['taijutsu', 'jujutsu', 'gauge', 'hp', 'burst'];

export const StatRadarChart: React.FC<StatRadarChartProps> = ({
  characterA,
  characterB,
  size = 320,
  language = 'pt',
  showLegend = true,
}) => {
  const scoresA = extractRadarScores(characterA);
  const scoresB = characterB ? extractRadarScores(characterB) : null;

  const center = size / 2;
  const radius = (size / 2) * 0.65;
  const levels = [0.25, 0.5, 0.75, 1.0];

  const axisLabels: Record<keyof RadarScore, { pt: string; en: string }> = {
    taijutsu: { pt: 'Taijutsu (Físico)', en: 'Taijutsu (ATK)' },
    jujutsu: { pt: 'Jujutsu (Mágico)', en: 'Jujutsu (Cursed)' },
    gauge: { pt: 'Velocidade Ult', en: 'Ult Speed' },
    hp: { pt: 'HP (Vitalidade)', en: 'HP (Vitality)' },
    burst: { pt: 'Burst Supremo', en: 'Ultimate Burst' },
  };

  // 5 vertices of a regular pentagon starting at 12 o'clock (-90 deg)
  const getCoordinates = (index: number, valueRatio: number) => {
    const angle = -Math.PI / 2 + (2 * Math.PI / 5) * index;
    const r = radius * valueRatio;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const getPolygonPoints = (scores: RadarScore) => {
    return AXIS_KEYS.map((key, i) => {
      const ratio = scores[key] / 100;
      const { x, y } = getCoordinates(i, ratio);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  const pointsA = getPolygonPoints(scoresA);
  const pointsB = scoresB ? getPolygonPoints(scoresB) : null;

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-[#0d091e] border border-[#261b40] rounded-2xl shadow-xl">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          {/* Background Concentric Pentagons */}
          {levels.map((lvl, lvlIdx) => {
            const polygonCoords = AXIS_KEYS.map((_, i) => {
              const { x, y } = getCoordinates(i, lvl);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            }).join(' ');

            return (
              <polygon
                key={lvlIdx}
                points={polygonCoords}
                fill={lvlIdx === 3 ? '#150f2f' : lvlIdx % 2 === 0 ? '#120d29' : '#0e0921'}
                stroke="#37275a"
                strokeWidth={lvlIdx === 3 ? 1.5 : 1}
                strokeDasharray={lvlIdx === 3 ? 'none' : '2,2'}
                opacity={0.7}
              />
            );
          })}

          {/* Radial Axis Lines */}
          {AXIS_KEYS.map((_, i) => {
            const outer = getCoordinates(i, 1.0);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={outer.x}
                y2={outer.y}
                stroke="#3d2c63"
                strokeWidth={1.2}
              />
            );
          })}

          {/* Character B Polygon (Underneath if comparing) */}
          {pointsB && (
            <g>
              <polygon
                points={pointsB}
                fill="rgba(245, 158, 11, 0.28)"
                stroke="#f59e0b"
                strokeWidth={2}
                className="transition-all duration-500"
              />
              {AXIS_KEYS.map((key, i) => {
                const ratio = scoresB![key] / 100;
                const { x, y } = getCoordinates(i, ratio);
                return (
                  <circle
                    key={`b-${i}`}
                    cx={x}
                    cy={y}
                    r={3.5}
                    fill="#fbbf24"
                    stroke="#78350f"
                    strokeWidth={1}
                  />
                );
              })}
            </g>
          )}

          {/* Character A Polygon */}
          <polygon
            points={pointsA}
            fill="rgba(168, 85, 247, 0.35)"
            stroke="#a855f7"
            strokeWidth={2.2}
            className="transition-all duration-500"
          />
          {AXIS_KEYS.map((key, i) => {
            const ratio = scoresA[key] / 100;
            const { x, y } = getCoordinates(i, ratio);
            return (
              <circle
                key={`a-${i}`}
                cx={x}
                cy={y}
                r={4}
                fill="#c084fc"
                stroke="#3b0764"
                strokeWidth={1.5}
              />
            );
          })}

          {/* Axis Labels */}
          {AXIS_KEYS.map((key, i) => {
            const labelCoord = getCoordinates(i, 1.25);
            const label = language === 'pt' ? axisLabels[key].pt : axisLabels[key].en;
            const scoreValA = scoresA[key];
            const scoreValB = scoresB ? scoresB[key] : null;

            let textAnchor: 'middle' | 'start' | 'end' = 'middle';
            if (i === 1 || i === 2) textAnchor = 'start';
            if (i === 3 || i === 4) textAnchor = 'end';

            return (
              <g key={`lbl-${i}`} transform={`translate(${labelCoord.x}, ${labelCoord.y})`}>
                <text
                  textAnchor={textAnchor}
                  dominantBaseline="central"
                  className="text-[11px] font-bold fill-gray-300 select-none"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                >
                  {label}
                </text>
                <text
                  y={13}
                  textAnchor={textAnchor}
                  dominantBaseline="central"
                  className="text-[10px] font-mono font-bold select-none"
                >
                  <tspan fill="#c084fc">{scoreValA}</tspan>
                  {scoreValB !== null && (
                    <tspan fill="#fbbf24"> / {scoreValB}</tspan>
                  )}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & Summary */}
      {showLegend && (
        <div className="flex flex-wrap items-center justify-center gap-4 mt-3 pt-3 border-t border-[#23183d] w-full text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500 border border-purple-300 shadow-sm" />
            <span className="font-bold text-purple-200 truncate max-w-[130px]" title={characterA.name}>
              {characterA.name}
            </span>
          </div>

          {characterB && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-300 shadow-sm" />
              <span className="font-bold text-amber-200 truncate max-w-[130px]" title={characterB.name}>
                {characterB.name}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
