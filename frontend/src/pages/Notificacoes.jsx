import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Send, MessageSquare, CheckCircle, Bell, Users } from 'lucide-react';

function Notificacoes() {
  const [status, setStatus] = useState(null);
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  
  // Formulário de aviso
  const [avisoTitulo, setAvisoTitulo] = useState('');
  const [avisoMensagem, setAvisoMensagem] = useState('');
  const [avisoTurma, setAvisoTurma] = useState('');
  
  // Turmas e alunos
  const [turmas, setTurmas] = useState([]);
  const [alunos, setAlunos] = useState([]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [statusRes, notifRes, turmasRes, alunosRes] = await Promise.all([
        api.get('/notificacoes/status'),
        api.get('/notificacoes?limit=10'),
        api.get('/turmas/turmas'),
        api.get('/alunos'),
      ]);
      
      setStatus(statusRes.data);
      setNotificacoes(notifRes.data.dados || []);
      setTurmas(turmasRes.data.dados || []);
      setAlunos(alunosRes.data.dados || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const enviarAviso = async (e) => {
    e.preventDefault();
    
    if (!avisoTitulo || !avisoMensagem) {
      toast.error('Preencha título e mensagem');
      return;
    }

    setEnviando(true);
    try {
      const response = await api.post('/notificacoes/aviso', {
        titulo: avisoTitulo,
        mensagem: avisoMensagem,
        turmaId: avisoTurma || undefined,
      });
      
      toast.success(`Avisos enviados: ${response.data.total} alunos`);
      setAvisoTitulo('');
      setAvisoMensagem('');
      setAvisoTurma('');
      carregarDados();
    } catch (error) {
      toast.error('Erro ao enviar avisos');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  // Filtrar alunos por turma
  const alunosFiltrados = alunos.filter(a => 
    (!avisoTurma || a.turmaId === avisoTurma) && a.responsavelTel
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Notificações WhatsApp</h1>
          <p>Envie avisos, boletins e notificações para os pais</p>
        </div>
      </div>

      {/* Status do WhatsApp */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green">
            <MessageSquare size={24} />
          </div>
          <div className="stat-info">
            <h3>{status?.configurado ? 'Conectado' : 'Modo Teste'}</h3>
            <p>Provedor: {status?.provider || 'mock'}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon blue">
            <Bell size={24} />
          </div>
          <div className="stat-info">
            <h3>{notificacoes.length}</h3>
            <p>Notificações enviadas</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Enviar Aviso Geral */}
        <div className="card">
          <div className="card-header">
            <h2>Enviar Aviso Geral</h2>
            <Send size={20} />
          </div>
          
          <form onSubmit={enviarAviso}>
            <div className="form-group">
              <label>Título do Aviso</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Reunião de pais"
                value={avisoTitulo}
                onChange={(e) => setAvisoTitulo(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Mensagem</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Digite a mensagem que será enviada aos pais..."
                value={avisoMensagem}
                onChange={(e) => setAvisoMensagem(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Turma (opcional - vazio para todas)</label>
              <select
                className="form-control"
                value={avisoTurma}
                onChange={(e) => setAvisoTurma(e.target.value)}
              >
                <option value="">Todas as turmas</option>
                {turmas.map((turma) => (
                  <option key={turma.id} value={turma.id}>
                    {turma.nome} - {turma.ano} ({turma.periodo})
                  </option>
                ))}
              </select>
            </div>

            {/* Lista de alunos que receberão o aviso */}
            <div className="form-group">
              <label>Alunos que receberão o aviso:</label>
              <div style={{ 
                maxHeight: '150px', 
                overflowY: 'auto', 
                padding: '0.5rem', 
                background: 'var(--gray-50)', 
                borderRadius: 'var(--radius)',
                fontSize: '0.875rem'
              }}>
                {alunosFiltrados.length === 0 ? (
                  <p style={{ color: 'var(--gray-500)', textAlign: 'center' }}>
                    Nenhum aluno com telefone cadastrado
                  </p>
                ) : (
                  alunosFiltrados.map(aluno => (
                    <div key={aluno.id} style={{ 
                      padding: '0.25rem 0', 
                      borderBottom: '1px solid var(--gray-200)',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>{aluno.nomeCompleto}</span>
                      <span style={{ color: 'var(--gray-500)' }}>{aluno.responsavelNome}</span>
                    </div>
                  ))
                )}
              </div>
              <small style={{ color: 'var(--gray-500)' }}>
                {alunosFiltrados.length} aluno(s) receberão o aviso
              </small>
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={enviando}>
              <Send size={16} />
              {enviando ? 'Enviando...' : 'Enviar Aviso'}
            </button>
          </form>
        </div>

        {/* Lista de Alunos e Responsáveis */}
        <div className="card">
          <div className="card-header">
            <h2>
              <Users size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Alunos e Responsáveis
            </h2>
            <span className="badge badge-info">{alunos.length} alunos</span>
          </div>
          
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Turma</th>
                  <th>Responsável</th>
                  <th>Telefone</th>
                </tr>
              </thead>
              <tbody>
                {alunos.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                      Nenhum aluno cadastrado
                    </td>
                  </tr>
                ) : (
                  alunos.map((aluno) => (
                    <tr key={aluno.id}>
                      <td>{aluno.nomeCompleto}</td>
                      <td>{aluno.turma?.nome || '-'}</td>
                      <td>{aluno.responsavelNome || '-'}</td>
                      <td>
                        {aluno.responsavelTel ? (
                          <span className="badge badge-success">{aluno.responsavelTel}</span>
                        ) : (
                          <span className="badge badge-warning">Sem telefone</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Últimas notificações */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h2>Últimas Notificações</h2>
        </div>
        
        {notificacoes.length === 0 ? (
          <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '2rem' }}>
            Nenhuma notificação enviada ainda
          </p>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {notificacoes.map((notif) => {
              const dados = notif.dadosDepois;
              return (
                <div
                  key={notif.id}
                  style={{
                    padding: '0.75rem',
                    borderBottom: '1px solid var(--gray-200)',
                    fontSize: '0.875rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="badge badge-info">{dados?.tipo}</span>
                    <small style={{ color: 'var(--gray-500)' }}>
                      {new Date(notif.createdAt).toLocaleString('pt-BR')}
                    </small>
                  </div>
                  <p style={{ marginTop: '0.5rem', color: 'var(--gray-600)' }}>
                    Para: {dados?.destinatario}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notificacoes;
