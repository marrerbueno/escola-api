import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Users } from 'lucide-react';

function Turmas() {
  const [turmas, setTurmas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [turmaSelecionada, setTurmaSelecionada] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    ano: new Date().getFullYear(),
    periodo: 'MANHA',
    capacidade: 40,
    professorId: '',
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [turmasRes, professoresRes] = await Promise.all([
        api.get('/turmas/turmas'),
        api.get('/professores'),
      ]);
      setTurmas(turmasRes.data.dados || []);
      setProfessores(professoresRes.data.dados || []);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (turmaSelecionada) {
        await api.put(`/turmas/turmas/${turmaSelecionada.id}`, formData);
        toast.success('Turma atualizada!');
      } else {
        await api.post('/turmas/turmas', formData);
        toast.success('Turma criada!');
      }
      setModalOpen(false);
      setTurmaSelecionada(null);
      resetForm();
      carregarDados();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir?')) return;
    try {
      await api.delete(`/turmas/turmas/${id}`);
      toast.success('Turma excluída!');
      carregarDados();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const handleEdit = (turma) => {
    setTurmaSelecionada(turma);
    setFormData({
      nome: turma.nome,
      ano: turma.ano,
      periodo: turma.periodo,
      capacidade: turma.capacidade,
      professorId: turma.professorId || '',
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      ano: new Date().getFullYear(),
      periodo: 'MANHA',
      capacidade: 40,
      professorId: '',
    });
  };

  const openNew = () => {
    setTurmaSelecionada(null);
    resetForm();
    setModalOpen(true);
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Turmas</h1>
          <p>Gerencie as turmas da escola</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} />
          Nova Turma
        </button>
      </div>

      <div className="stats-grid">
        {turmas.map((turma) => (
          <div key={turma.id} className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div className="stat-icon blue">
                <Users size={24} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(turma)}>
                  <Edit2 size={14} />
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(turma.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <h3>{turma.nome}</h3>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                {turma.ano} • {turma.periodo}
              </p>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                {turma._count?.alunos || 0} alunos
              </p>
              {turma.professor && (
                <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                  Prof: {turma.professor.nomeCompleto}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Cadastro/Edição */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{turmaSelecionada ? 'Editar Turma' : 'Nova Turma'}</h2>
              <button onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nome da Turma *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: 1 ano A"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Ano *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.ano}
                      onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Período *</label>
                    <select
                      className="form-control"
                      value={formData.periodo}
                      onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                    >
                      <option value="MANHA">Manhã</option>
                      <option value="TARDE">Tarde</option>
                      <option value="NOITE">Noite</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Capacidade</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.capacidade}
                      onChange={(e) => setFormData({ ...formData, capacidade: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Professor Responsável</label>
                  <select
                    className="form-control"
                    value={formData.professorId}
                    onChange={(e) => setFormData({ ...formData, professorId: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {professores.map((prof) => (
                      <option key={prof.id} value={prof.id}>
                        {prof.nomeCompleto} - {prof.siape}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {turmaSelecionada ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Turmas;
