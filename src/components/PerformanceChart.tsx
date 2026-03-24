import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Task } from '../types';

interface PerformanceChartProps {
  tasks: Task[];
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ tasks }) => {
  const data = tasks
    .filter(t => t.status === 'completed' || t.actualResult > 0)
    .map(t => ({
      name: t.title,
      actual: t.actualResult || 0,
      desired: t.desiredResult || 0,
    }));

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-500 italic">No performance data available yet. Complete tasks with metrics to see results.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold mb-6 text-gray-800">Actual vs Desired Results</h3>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              cursor={{ fill: '#f9fafb' }}
            />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="actual" name="Actual Result" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
            <Bar dataKey="desired" name="Desired Result" fill="#e5e7eb" radius={[4, 4, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
