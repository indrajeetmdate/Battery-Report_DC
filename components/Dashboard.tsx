import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ProcessedData } from '../types';
import { COLORS } from '../constants';

interface DashboardProps {
  data: ProcessedData;
}

interface ChartCardProps {
  title: string;
  id: string;
  children?: React.ReactNode;
}

const ChartCard = ({ title, id, children }: ChartCardProps) => (
  // Reduced height from 350px to 280px to create a wider aspect ratio that fits the single-page PDF better
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col h-[280px]" id={id}>
    <h3 className="text-sm font-bold text-[#41463F] mb-2 uppercase tracking-wider border-b border-gray-100 pb-2">
      {title}
    </h3>
    <div className="flex-1 w-full h-full">
      {children}
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const downsampledData = data.timeSeries.filter((_, i) => i % Math.max(1, Math.floor(data.timeSeries.length / 500)) === 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Capacity (Ah) vs Duration" id="chart-capacity">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={downsampledData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="duration" hide />
              <YAxis domain={['auto', 'auto']} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={24} iconSize={10} wrapperStyle={{ fontSize: '12px' }}/>
              <Line 
                type="monotone" 
                dataKey="capacity" 
                name="Capacity"
                stroke={COLORS.primary} 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Voltage (V) vs Duration" id="chart-voltage">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={downsampledData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="duration" hide />
              <YAxis domain={['auto', 'auto']} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
              <Legend verticalAlign="top" height={24} iconSize={10} wrapperStyle={{ fontSize: '12px' }}/>
              <Line 
                type="monotone" 
                dataKey="voltage" 
                name="Voltage"
                stroke={COLORS.primary} 
                strokeWidth={2} 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Current (A) vs Duration" id="chart-current">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={downsampledData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="duration" hide />
              <YAxis domain={['auto', 'auto']} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
              <Legend verticalAlign="top" height={24} iconSize={10} wrapperStyle={{ fontSize: '12px' }}/>
              <Line 
                type="monotone" 
                dataKey="current" 
                name="Current"
                stroke={COLORS.accent} 
                strokeWidth={2} 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Temperature (°C) vs Duration" id="chart-temperature">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={downsampledData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="duration" hide />
              <YAxis domain={['auto', 'auto']} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
              <Legend verticalAlign="top" height={24} iconSize={10} wrapperStyle={{ fontSize: '12px' }}/>
              <Line 
                type="monotone" 
                dataKey="temperature" 
                name="Temperature"
                stroke="#d64933" 
                strokeWidth={2} 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-[#41463F] mb-4">Loop Summary</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-[#B4D192] text-[#41463F]">
                        <tr>
                            <th className="px-4 py-2">Metric</th>
                            <th className="px-4 py-2">Value</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.loopSummary.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-2 font-medium">{item.metric}</td>
                                <td className="px-4 py-2">{item.value}</td>
                            </tr>
                        ))}
                        {data.loopSummary.length === 0 && (
                            <tr><td colSpan={2} className="px-4 py-2 text-center text-gray-500">No summary data found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};