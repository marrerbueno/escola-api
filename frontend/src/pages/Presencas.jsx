import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Check, X as XIcon, AlertCircle, Clock } from 'lucide-react';

function Presencas() {
  const [alunos, setAlunos] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [disciplinaId, setDisciplinaId] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [presencas, setPresencas] = useState({});

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [alunosRes, disciplinasRes] = await Promise.all([
        api.get('/alunos'),
        api.get('/turmas/disciplinas'),
      ]);
      setAlunos(alunosRes.data.dados || []);
      setDisciplinas(disciplinasRes.data || []);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const carregarPresencas = async () => {
    if (!disciplinaId) return;

    try {
      const res = await api.get(`/presencas/dia/${disciplinaId}?data=${data}`);
      const presencasMap = {};
      res.data.alunos?.forEach((aluno) => {
        presencasMap[aluno.id] = aluno.presenca?.status || 'NAO_REGISTRADO';
      });
      setPresencas(presencasMap);
    } catch (error) {
      console.error('Erro ao carregar presenças:', error);
    }
  };

  useEffect(() => {
    if (disciplinaId) {
      carregarPresencas();
    }
  }, [disciplinaId, data]);

  const setStatus = (alunoId, status) => {
    setPresencas((prev) => ({
      ...prev,
      [alunoId]: status,
    }));
  };

  const salvarPresencas = async () => {
    if (!disciplinaId) {
      toast.error('Selecione uma disciplina');
      return;
    }

    setSalvando(true);
    try {
      const presencasArray = Object.entries(presencas)
        .filter(([_, status]) => status !== 'NAO_REGISTRADO')
        .map(([alunoId, status]) => ({
          alunoId,
          status,
        }));

      if (presencasArray.length === 0) {
        toast.error('Registre a presença de pelo menos um aluno');
        return;
        ``;
      }

      await api.post('/presencas/lote', {
        disciplinaId,
        data,
        presencas: presencasArray,
      });

      toast.success(`${presencasArray.length} presenças registradas!`);
    } catch (error) {
      toast.error('Erro ao salvar presenças');
    } finally {
      setSalvando(false);
    }
  };

  const disciplinasFiltradas = disciplinas;

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Presenças</h1>
          <p>Registre a presença dos alunos</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={salvarPresencas}
          disabled={salvando || !disciplinaId}
        >
          {salvando ? 'Salvando...' : 'Salvar Presenças'}
        </button>
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="form-group" style={{ marginBottom: 0, minWidth: '250px' }}>
            <label>Disciplina *</label>
            <select
              className="form-control"
              value={disciplinaId}
              onChange={(e) => setDisciplinaId(e.target.value)}
            >
              <option value="">Selecione a disciplina...</option>
              {disciplinasFiltradas.map((disc) => (
                <option key={disc.id} value={disc.id}>
                  {disc.nome} - {disc.turma?.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Data</label>
            <input
              type="date"
              className="form-control"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>
        </div>

        {disciplinaId ? (
          <>
            <div className="attendance-grid">
              {alunos.map((aluno) => (
                <div key={aluno.id} className="attendance-card">
                  <div className="student-info">
                    <div className="student-avatar">
                      {aluno.nomeCompleto.charAt(0)}
                    </div>
                    <div>
                      <div className="student-name">{aluno.nomeCompleto}</div>
                      <div className="student-mat">{aluno.matricula}</div>
                    </div>
                  </div>
                  <div className="attendance-buttons">
                    <button
                      className={`attendance-btn present ${presencas[aluno.id] === 'PRESENTE' ? 'active' : ''}`}
                      onClick={() => setStatus(aluno.id, 'PRESENTE')}
                      title="Presente"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      className={`attendance-btn absent ${presencas[aluno.id] === 'AUSENTE' ? 'active' : ''}`}
                      onClick={() => setStatus(aluno.id, 'AUSENTE')}
                      title="Ausente"
                    >
                      <XIcon size={16} />
                    </button>
                    <button
                      className={`attendance-btn justified ${presencas[aluno.id] === 'JUSTIFICADO' ? 'active' : ''}`}
                      onClick={() => setStatus(aluno.id, 'JUSTIFICADO')}
                      title="Justificado"
                    >
                      <AlertCircle size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="attendance-btn present" style={{ width: '24px', height: '24px' }}>
                  <Check size={12} />
                </div>
                <span>Presente</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="attendance-btn absent" style={{ width: '24px', height: '24px' }}>
                  <XIcon size={12} />
                </div>
                <span>Ausente</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="attendance-btn justified" style={{ width: '24px', height: '24px' }}>
                  <AlertCircle size={12} />
                </div>
                <span>Justificado</span>
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gray-500)' }}>
            <Clock size={48} style={{ marginBottom: '1rem' }} />
            <p>Selecione uma disciplina para registrar presenças</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Presencas;
