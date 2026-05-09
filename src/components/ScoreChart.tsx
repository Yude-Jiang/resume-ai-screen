import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { ScoringWeights } from '../types';

interface ScoreChartProps {
  weights: ScoringWeights;
  detailedScores: Record<string, number>;
  t: any;
}

const ID_TO_KEY: Record<string, string> = { edu: 'education', exp: 'experience', skill: 'skills', lang: 'language', cert: 'certs' };
const COLORS = ['#3cb4e6', '#47c8a0', '#f59e0b', '#8b5cf6', '#ef4444'];

export const ScoreChart: React.FC<ScoreChartProps> = ({ weights, detailedScores, t }) => {
  const data = weights.map((w, i) => ({
    name: t[ID_TO_KEY[w.id] as keyof typeof t] || w.label,
    val: detailedScores?.[w.id] || 0,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '900', fill: '#64748b' }} dy={10} interval={0} />
          <YAxis hide domain={[0, 100]} />
          <Tooltip
            cursor={{ fill: 'rgba(60, 180, 230, 0.05)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return <div className="bg-st-dark text-white px-3 py-2 rounded-xl text-sm font-black shadow-2xl border border-white/10">{payload[0].value}%</div>;
              }
              return null;
            }}
          />
          <Bar dataKey="val" radius={[8, 8, 8, 8]} barSize={32}>
            {weights.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            <LabelList dataKey="val" position="top" style={{ fontSize: 11, fontWeight: 900, fill: '#475569' }} formatter={(v: number) => v > 0 ? v : ''} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
