import { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, GraduationCap, School, FileText, CheckSquare, Bell } from 'lucide-react';

function Dashboard() {
  const [stats, setStats] = useState({
    alunos: 0,
    professores: 0,
    turmas: 0,
    notas: 0,
    presencas: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    try {
      const [alunosRes, professoresRes, turmasRes] = await Promise.all([
        api.get('/alunos?limit=1'),
        api.get('/professores?limit=1'),
        api.get('/turmas/turmas?limit=1'),
      ]);

      setStats({
        alunos: alunosRes.data.paginacao?.total || 0,
        professores: professoresRes.data.paginacao?.total || 0,
        turmas: turmasRes.data.paginacao?.total || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Visão geral do sistema</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.alunos}</h3>
            <p>Alunos Matriculados</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <GraduationCap size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.professores}</h3>
            <p>Professores</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow">
            <School size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.turmas}</h3>
            <p>Turmas Ativas</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Bell size={24} />
          </div>
          <div className="stat-info">
            <h3>WhatsApp</h3>
            <p>Notificações Ativas</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h2>Acesso Rápido</h2>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <a href="/alunos" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <Users size={16} />
              Gerenciar Alunos
            </a>
            <a href="/notas" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <FileText size={16} />
              Lançar Notas
            </a>
            <a href="/presencas" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <CheckSquare size={16} />
              Registrar Presenças
            </a>
            <a href="/notificacoes" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
              <Bell size={16} />
              Enviar Notificações
            </a>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Funcionalidades</h2>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
            <p style={{ marginBottom: '0.75rem' }}>
              ✅ Gestão completa de alunos e professores
            </p>
            <p style={{ marginBottom: '0.75rem' }}>
              ✅ Lançamento de notas por bimestre
            </p>
            <p style={{ marginBottom: '0.75rem' }}>
              ✅ Controle de presenças
            </p>
            <p style={{ marginBottom: '0.75rem' }}>
              ✅ Boletim automático
            </p>
            <p style={{ marginBottom: '0.75rem' }}>
              ✅ Notificações WhatsApp para pais
            </p>
            <p>
              ✅ Relatórios e estatísticas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
