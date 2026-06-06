"use client";

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

const data = [
  { name: 'Set', valor: 50000, pago: 50000 },
  { name: 'Out', valor: 15000, pago: 0 },
  { name: 'Nov', valor: 20000, pago: 0 },
];

export function ComprasChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} />
        <YAxis axisLine={false} tickLine={false} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="valor" stroke="#ef4444" strokeWidth={2} name="Total a Pagar" />
        <Line type="monotone" dataKey="pago" stroke="#22c55e" strokeWidth={2} name="Total Pago" />
      </LineChart>
    </ResponsiveContainer>
  );
}
