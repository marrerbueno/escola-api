import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, Eye, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Alunos() {
  const { usuario } = useAuth();
  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [turmaFilter, setTurmaFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    matricula: '',
    dataNascimento: '',
    telefone: '',
    responsavelNome: '',
    responsavelTel: '',
    responsavelEmail: '',
    turmaId: '',
  });

  // Verificar se é admin
  const isAdmin = usuario?.role === 'ADMIN';

  useEffect(() => {
    carregarDados();
  }, [search, turmaFilter]);

  const carregarDados = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (turmaFilter) params.append('turmaId', turmaFilter);

      const [alunosRes, turmasRes] = await Promise.all([
        api.get(`/alunos?${params}`),
        api.get('/turmas/turmas'),
      ]);

      setAlunos(alunosRes.data.dados || []);
      setTurmas(turmasRes.data.dados || []);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (alunoSelecionado) {
        await api.put(`/alunos/${alunoSelecionado.id}`, formData);
        toast.success('Aluno atualizado!');
      } else {
        await api.post('/alunos', formData);
        toast.success('Aluno cadastrado!');
      }
      setModalOpen(false);
      setAlunoSelecionado(null);
      resetForm();
      carregarDados();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar');
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem excluir alunos');
      return;
    }
    
    if (!window.confirm('Tem certeza que deseja excluir?')) return;
    try {
      await api.delete(`/alunos/${id}`);
      toast.success('Aluno excluído!');
      carregarDados();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const handleEdit = (aluno) => {
    setAlunoSelecionado(aluno);
    setFormData({
      nomeCompleto: aluno.nomeCompleto,
      matricula: aluno.matricula,
      dataNascimento: aluno.dataNascimento?.split('T')[0] || '',
      telefone: aluno.telefone || '',
      responsavelNome: aluno.responsavelNome || '',
      responsavelTel: aluno.responsavelTel || '',
      responsavelEmail: aluno.responsavelEmail || '',
      turmaId: aluno.turmaId || '',
    });
    setModalOpen(true);
  };

  const handleView = async (id) => {
    try {
      const res = await api.get(`/alunos/${id}`);
      setAlunoSelecionado(res.data);
      setModalDetalhes(true);
    } catch (error) {
      toast.error('Erro ao carregar detalhes');
    }
  };

  const resetForm = () => {
    setFormData({
      nomeCompleto: '',
      matricula: '',
      dataNascimento: '',
      telefone: '',
      responsavelNome: '',
      responsavelTel: '',
      responsavelEmail: '',
      turmaId: '',
      email: '',
    });
  };

  const openNew = () => {
    setAlunoSelecionado(null);
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
          <h1>Alunos</h1>
          <p>Gerencie os alunos matriculados</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} />
          Novo Aluno
        </button>
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-input">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou matrícula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '200px' }}
            value={turmaFilter}
            onChange={(e) => setTurmaFilter(e.target.value)}
          >
            <option value="">Todas as turmas</option>
            {turmas.map((turma) => (
              <option key={turma.id} value={turma.id}>
                {turma.nome} - {turma.ano}
              </option>
            ))}
          </select>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Nome</th>
                <th>Turma</th>
                <th>Responsável</th>
                <th>Telefone</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {alunos.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    Nenhum aluno encontrado
                  </td>
                </tr>
              ) : (
                alunos.map((aluno) => (
                  <tr key={aluno.id}>
                    <td>{aluno.matricula}</td>
                    <td>{aluno.nomeCompleto}</td>
                    <td>{aluno.turma?.nome || '-'}</td>
                    <td>{aluno.responsavelNome || '-'}</td>
                    <td>{aluno.responsavelTel || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleView(aluno.id)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEdit(aluno)}
                        >
                          <Edit2 size={14} />
                        </button>
                        {isAdmin && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(aluno.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cadastro/Edição */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{alunoSelecionado ? 'Editar Aluno' : 'Novo Aluno'}</h2>
              <button onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nome Completo *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.nomeCompleto}
                      onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Matrícula *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.matricula}
                      onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Data de Nascimento</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.dataNascimento}
                      onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Turma</label>
                    <select
                      className="form-control"
                      value={formData.turmaId}
                      onChange={(e) => setFormData({ ...formData, turmaId: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      {turmas.map((turma) => (
                        <option key={turma.id} value={turma.id}>
                          {turma.nome} - {turma.ano}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {!alunoSelecionado && (
                  <div className="form-group">
                    <label>Email do Aluno (para login)</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="aluno@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <small style={{ color: 'var(--gray-500)' }}>
                      Será criada uma conta com senha padrão: 123456
                    </small>
                  </div>
                )}

                <hr style={{ margin: '1rem 0' }} />
                <h4 style={{ marginBottom: '1rem' }}>Dados do Responsável</h4>

                <div className="form-row">
                  <div className="form-group">
                    <label>Nome do Responsável</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.responsavelNome}
                      onChange={(e) => setFormData({ ...formData, responsavelNome: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Telefone do Responsável</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="(11) 99999-9999"
                      value={formData.responsavelTel}
                      onChange={(e) => setFormData({ ...formData, responsavelTel: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email do Responsável</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.responsavelEmail}
                    onChange={(e) => setFormData({ ...formData, responsavelEmail: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {alunoSelecionado ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes */}
      {modalDetalhes && alunoSelecionado && (
        <div className="modal-overlay" onClick={() => setModalDetalhes(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalhes do Aluno</h2>
              <button onClick={() => setModalDetalhes(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p><strong>Nome:</strong> {alunoSelecionado.nomeCompleto}</p>
              <p><strong>Matrícula:</strong> {alunoSelecionado.matricula}</p>
              <p><strong>Turma:</strong> {alunoSelecionado.turma?.nome || '-'}</p>
              <p><strong>Responsável:</strong> {alunoSelecionado.responsavelNome || '-'}</p>
              <p><strong>Telefone:</strong> {alunoSelecionado.responsavelTel || '-'}</p>
              <p><strong>Email:</strong> {alunoSelecionado.responsavelEmail || '-'}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModalDetalhes(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Alunos;
