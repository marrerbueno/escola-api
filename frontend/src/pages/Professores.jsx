import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Professores() {
  const { usuario } = useAuth();
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [professorSelecionado, setProfessorSelecionado] = useState(null);
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    siape: '',
    especialidade: '',
    formacao: '',
    email: '',
    senha: '',
  });

  // Verificar se é admin
  const isAdmin = usuario?.role === 'ADMIN';

  useEffect(() => {
    carregarDados();
  }, [search]);

  const carregarDados = async () => {
    try {
      const params = search ? `?search=${search}` : '';
      const res = await api.get(`/professores${params}`);
      setProfessores(res.data.dados || []);
    } catch (error) {
      toast.error('Erro ao carregar professores');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (professorSelecionado) {
        await api.put(`/professores/${professorSelecionado.id}`, {
          nomeCompleto: formData.nomeCompleto,
          especialidade: formData.especialidade,
          formacao: formData.formacao,
        });
        toast.success('Professor atualizado!');
      } else {
        // Primeiro criar usuário, depois professor
        const usuarioRes = await api.post('/auth/registrar', {
          email: formData.email,
          senha: formData.senha,
          nome: formData.nomeCompleto,
          role: 'PROFESSOR',
        });

        await api.post('/professores', {
          usuarioId: usuarioRes.data.usuario.id,
          siape: formData.siape,
          nomeCompleto: formData.nomeCompleto,
          especialidade: formData.especialidade,
          formacao: formData.formacao,
        });
        toast.success('Professor cadastrado!');
      }
      setModalOpen(false);
      setProfessorSelecionado(null);
      resetForm();
      carregarDados();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar');
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem excluir professores');
      return;
    }
    
    if (!window.confirm('Tem certeza que deseja excluir?')) return;
    try {
      await api.delete(`/professores/${id}`);
      toast.success('Professor excluído!');
      carregarDados();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const handleEdit = (professor) => {
    setProfessorSelecionado(professor);
    setFormData({
      nomeCompleto: professor.nomeCompleto,
      siape: professor.siape,
      especialidade: professor.especialidade || '',
      formacao: professor.formacao || '',
      email: '',
      senha: '',
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nomeCompleto: '',
      siape: '',
      especialidade: '',
      formacao: '',
      email: '',
      senha: '',
    });
  };

  const openNew = () => {
    setProfessorSelecionado(null);
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
          <h1>Professores</h1>
          <p>Gerencie os professores da escola</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} />
          Novo Professor
        </button>
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-input">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou SIAPE..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>SIAPE</th>
                <th>Nome</th>
                <th>Especialidade</th>
                <th>Formação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {professores.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    Nenhum professor encontrado
                  </td>
                </tr>
              ) : (
                professores.map((professor) => (
                  <tr key={professor.id}>
                    <td>{professor.siape}</td>
                    <td>{professor.nomeCompleto}</td>
                    <td>{professor.especialidade || '-'}</td>
                    <td>{professor.formacao || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {isAdmin && (
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleEdit(professor)}
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(professor.id)}
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
              <h2>{professorSelecionado ? 'Editar Professor' : 'Novo Professor'}</h2>
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
                    <label>SIAPE *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.siape}
                      onChange={(e) => setFormData({ ...formData, siape: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Especialidade</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: Matemática"
                      value={formData.especialidade}
                      onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Formação</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: Licenciatura em Matemática"
                      value={formData.formacao}
                      onChange={(e) => setFormData({ ...formData, formacao: e.target.value })}
                    />
                  </div>
                </div>

                {!professorSelecionado && (
                  <>
                    <hr style={{ margin: '1rem 0' }} />
                    <h4 style={{ marginBottom: '1rem' }}>Dados de Acesso</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Email *</label>
                        <input
                          type="email"
                          className="form-control"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Senha *</label>
                        <input
                          type="password"
                          className="form-control"
                          value={formData.senha}
                          onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {professorSelecionado ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Professores;
