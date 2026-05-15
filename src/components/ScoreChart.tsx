import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ScoringWeights } from '../types';

interface ScoreChartProps {
  weights: ScoringWeights;
  detailedScores: Record<string, number>;
  t: any;
  /** Optional: additional candidates for comparison overlay */
  compareScores?: { name: string; scores: Record<string, number> }[];
}

const ID_TO_KEY: Record<string, string> = {
  edu: 'education', exp: 'experience', skill: 'skills', lang: 'language', cert: 'certs',
};

const COLORS = ['#3cb4e6', '#f59e0b', '#ef4444', '#8b5cf6', '#47c8a0'];
const RADAR_COLORS = ['#3cb4e6', '#f59e0b', '#ef4444'];

export const ScoreChart: React.FC<ScoreChartProps> = ({ weights, detailedScores, t, compareScores }) => {
  // Build data for radar: one entry per dimension, with multiple candidate values
  const radarData = weights.map(w => {
    const key = ID_TO_KEY[w.id as keyof typeof ID_TO_KEY] || w.id;
    const entry: any = {
      dimension: t[key as keyof typeof t] || w.label,
      fullMark: 100,
      [t.candidate || 'Candidate']: detailedScores?.[w.id] || 0,
    };
    compareScores?.forEach((cs, i) => {
      entry[cs.name] = cs.scores[w.id] || 0;
    });
    return entry;
  });

  const isCompare = compareScores && compareScores.length > 0;
  const dataKeys = isCompare
    ? [t.candidate || 'Candidate', ...compareScores.map(cs => cs.name)]
    : [t.candidate || 'Candidate'];

  return (
    <div className={`w-full ${isCompare ? 'h-80' : 'h-64'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-st-dark text-white px-3 py-2 rounded-xl text-sm font-bold shadow-2xl border border-white/10">
                    {payload.map((p: any) => (
                      <div key={p.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        <span>{p.name}: {p.value}%</span>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          {isCompare && <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />}
          {dataKeys.map((key, i) => (
            <Radar
              key={key}
              name={key}
              dataKey={key}
              stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
              fill={RADAR_COLORS[i % RADAR_COLORS.length]}
              fillOpacity={isCompare ? 0.1 : 0.2}
              strokeWidth={2}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
