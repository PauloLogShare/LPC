import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Dados simulados de performance das POCs
const dadosPOCs = [
  { nome: 'POC Logística AI', meta: 90, realizado: 95 },
  { nome: 'POC Otimização Rota', meta: 85, realizado: 78 },
  { nome: 'POC Rastreamento', meta: 95, realizado: 92 },
];

export default function GraficoDesempenho() {
  return (
    <div style={{ width: '100%', height: 300, backgroundColor: '#fff', padding: '20px', borderRadius: '8px' }}>
      <h3 style={{ marginBottom: '15px', color: '#333' }}>Metas vs. Realizado por POC (%)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dadosPOCs} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="nome" />
          <YAxis unit="%" />
          <Tooltip />
          <Legend />
          {/* Barra da Meta (Cinza/Neutro) */}
          <Bar dataKey="meta" name="Meta Estipulada" fill="#9ca3af" />
          {/* Barra do Realizado (Azul LogShare) */}
          <Bar dataKey="realizado" name="Resultado Real" fill="#2563eb" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
