import { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Metricas() {
  const [alunos, setAlunos] = useState([]);
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [notas, setNotas] = useState([]);
  const [presencas, setPresencas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/alunos?limit=100').then(res => {
      setAlunos(res.data.dados);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedAluno) {
      Promise.all([
        api.get('/notas?limit=100'),
        api.get('/presencas?limit=100')
      ]).then(([notasRes, presencasRes]) => {
        setNotas(notasRes.data.dados.filter(n => n.alunoId === selectedAluno.id));
        setPresencas(presencasRes.data.dados.filter(p => p.alunoId === selectedAluno.id));
      });
    }
  }, [selectedAluno]);

  // Métricas
  const mediaGeral = notas.length > 0 ? (notas.reduce((acc, n) => acc + n.valor, 0) / notas.length).toFixed(1) : 0;
  const totalPresencas = presencas.length;
  const presencasPresentes = presencas.filter(p => p.status === 'PRESENTE').length;
  const percentualPresenca = totalPresencas > 0 ? ((presencasPresentes / totalPresencas) * 100).toFixed(0) : 0;

  // Dados para gráfico de barras - Notas por disciplina
  const notasPorDisciplina = {};
  notas.forEach(n => {
    const disc = n.disciplina?.nome || 'Disciplina';
    if (!notasPorDisciplina[disc]) notasPorDisciplina[disc] = [];
    notasPorDisciplina[disc].push(n.valor);
  });
  const barData = Object.entries(notasPorDisciplina).map(([disciplina, vals]) => ({
    name: disciplina,
    media: (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1),
    maior: Math.max(...vals).toFixed(1),
    menor: Math.min(...vals).toFixed(1)
  }));

  // Dados para gráfico de pizza - Presenças
  const pieData = [
    { name: 'Presente', value: presencasPresentes },
    { name: 'Ausente', value: presencas.filter(p => p.status === 'AUSENTE').length },
    { name: 'Justificado', value: presencas.filter(p => p.status === 'JUSTIFICADO').length }
  ].filter(d => d.value > 0);

  // Dados para gráfico de linha - Evolução das notas
  const notasSorted = [...notas].sort((a, b) => new Date(a.dataLancamento) - new Date(b.dataLancamento));
  const lineData = notasSorted.map((n, i) => ({
    name: `Nota ${i + 1}`,
    valor: n.valor,
    disciplina: n.disciplina?.nome || ''
  }));

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Métricas de Desempenho</h1>
          <p>Visualize o desempenho dos alunos</p>
        </div>
      </div>

      {!selectedAluno ? (
        <div className="card">
          <div className="card-header">
            <h2>Selecione um Aluno</h2>
          </div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {alunos.map(aluno => (
              <div
                key={aluno.id}
                onClick={() => setSelectedAluno(aluno)}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--gray-200)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--gray-50)'}
                onMouseOut={e => e.currentTarget.style.background = 'white'}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'var(--primary-light)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', color: 'var(--primary)'
                }}>
                  {aluno.nomeCompleto.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: '500' }}>{aluno.nomeCompleto}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                    {aluno.turma?.nome || 'Sem turma'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Header do aluno */}
          <div className="card" style={{ background: 'var(--primary)', color: 'white', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 'bold'
              }}>
                {selectedAluno.nomeCompleto.charAt(0)}
              </div>
              <div>
                <h2 style={{ margin: 0 }}>{selectedAluno.nomeCompleto}</h2>
                <p style={{ margin: 0, opacity: 0.8 }}>{selectedAluno.turma?.nome} | Mat: {selectedAluno.matricula}</p>
              </div>
              <button
                onClick={() => setSelectedAluno(null)}
                style={{
                  marginLeft: 'auto', padding: '0.5rem 1rem',
                  background: 'rgba(255,255,255,0.2)', border: 'none',
                  borderRadius: '8px', color: 'white', cursor: 'pointer'
                }}
              >
                ← Voltar
              </button>
            </div>
          </div>

          {/* Cards de resumo */}
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card" style={{ background: 'var(--primary)' }}>
              <div className="stat-info">
                <h3 style={{ color: 'white' }}>{mediaGeral}</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)' }}>Média Geral</p>
              </div>
            </div>
            <div className="stat-card" style={{ background: 'var(--success)' }}>
              <div className="stat-info">
                <h3 style={{ color: 'white' }}>{percentualPresenca}%</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)' }}>Presença</p>
              </div>
            </div>
            <div className="stat-card" style={{ background: 'var(--warning)' }}>
              <div className="stat-info">
                <h3 style={{ color: 'white' }}>{notas.length}</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)' }}>Total Notas</p>
              </div>
            </div>
            <div className="stat-card" style={{ background: 'var(--danger)' }}>
              <div className="stat-info">
                <h3 style={{ color: 'white' }}>{totalPresencas}</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)' }}>Total Aulas</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Gráfico de barras - Notas por disciplina */}
            {barData.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h2>Notas por Disciplina</h2>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="media" fill="#4f46e5" name="Média" />
                    <Bar dataKey="maior" fill="#10b981" name="Maior" />
                    <Bar dataKey="menor" fill="#ef4444" name="Menor" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Gráfico de pizza - Presenças */}
            {pieData.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h2>Presenças</h2>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Gráfico de linha - Evolução */}
            {lineData.length > 0 && (
              <div className="card" style={{ gridColumn: 'span 2' }}>
                <div className="card-header">
                  <h2>Evolução das Notas</h2>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis domain={[0, 10]} />
                    <Tooltip formatter={(value, name, props) => [value, props.payload.disciplina]} />
                    <Line type="monotone" dataKey="valor" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Tabela de notas */}
          {notas.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <div className="card-header">
                <h2>Detalhes das Notas</h2>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Disciplina</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nota</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Bimestre</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notas.map(nota => (
                      <tr key={nota.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                        <td style={{ padding: '0.75rem' }}>{nota.disciplina?.nome || '-'}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem', borderRadius: '6px', fontWeight: 'bold',
                            background: nota.valor >= 7 ? '#dcfce7' : nota.valor >= 5 ? '#fef3c7' : '#fee2e2',
                            color: nota.valor >= 7 ? '#16a34a' : nota.valor >= 5 ? '#d97706' : '#dc2626'
                          }}>
                            {nota.valor.toFixed(1)}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>{nota.bimestre}</td>
                        <td style={{ padding: '0.75rem' }}>{nota.tipo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
