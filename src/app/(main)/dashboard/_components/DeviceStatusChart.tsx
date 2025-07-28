/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function DeviceStatusChart({ data }: { data: any[] }) {
  return (
    <div className='w-full h-80'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis dataKey='type' />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey='online' stackId='a' fill='#10B981' name='Online' />
          <Bar dataKey='offline' stackId='a' fill='#EF4444' name='Offline' />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
