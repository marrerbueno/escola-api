import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Send, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Notas() {
  const { usuario } = useAuth();
  const [notas, setNotas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState(null);
  const [enviandoWhatsApp, setEnviandoWhatsApp] = useState(false);
  const [formData, setFormData] = useState({
    alunoId: '',
    disciplinaId: '',
    valor: '',
    bimestre: 'PRIMEIRO',
    tipo: 'PROVA',
    descricao: '',
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [notasRes, alunosRes, disciplinasRes] = await Promise.all([
        api.get('/notas'),
        api.get('/alunos'),
        api.get('/turmas/disciplinas'),
      ]);
      setNotas(notasRes.data.dados || []);
      setAlunos(alunosRes.data.dados || []);
      setDisciplinas(disciplinasRes.data || []);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const dados = {
        ...formData,
        valor: parseFloat(formData.valor),
      };

      if (notaSelecionada) {
        await api.put(`/notas/${notaSelecionada.id}`, dados);
        toast.success('Nota atualizada!');
      } else {
        await api.post('/notas', dados);
        toast.success('Nota lançada!');
      }
      setModalOpen(false);
      setNotaSelecionada(null);
      resetForm();
      carregarDados();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar');
    }
  };

  const handleDelete = async (id) => {
    // Verificar se o usuário é admin
    if (usuario?.role !== 'ADMIN') {
      toast.error('Apenas administradores podem excluir notas');
      return;
    }
    
    if (!window.confirm('Tem certeza que deseja excluir?')) return;
    try {
      await api.delete(`/notas/${id}`);
      toast.success('Nota excluída!');
      carregarDados();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const handleEdit = (nota) => {
    // Verificar se o usuário é admin
    if (usuario?.role !== 'ADMIN') {
      toast.error('Apenas administradores podem editar notas');
      return;
    }
    
    setNotaSelecionada(nota);
    setFormData({
      alunoId: nota.alunoId,
      disciplinaId: nota.disciplinaId,
      valor: nota.valor,
      bimestre: nota.bimestre,
      tipo: nota.tipo,
      descricao: nota.descricao || '',
    });
    setModalOpen(true);
  };

  const enviarBoletimWhatsApp = async (nota) => {
    setEnviandoWhatsApp(true);
    try {
      await api.post(`/notificacoes/boletim/${nota.alunoId}`);
      
      // Marcar nota como enviada
      await api.put(`/notas/${nota.id}`, { enviada: true });
      
      toast.success('Nota enviada via WhatsApp!');
      carregarDados();
    } catch (error) {
      toast.error('Erro ao enviar nota');
    } finally {
      setEnviandoWhatsApp(false);
    }
  };

  const resetForm = () => {
    setFormData({
      alunoId: '',
      disciplinaId: '',
      valor: '',
      bimestre: 'PRIMEIRO',
      tipo: 'PROVA',
      descricao: '',
    });
  };

  const openNew = () => {
    setNotaSelecionada(null);
    resetForm();
    setModalOpen(true);
  };

  const formatBimestre = (b) => {
    const map = { PRIMEIRO: '1º', SEGUNDO: '2º', TERCEIRO: '3º', QUARTO: '4º' };
    return `${map[b]} Bimestre`;
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Notas</h1>
          <p>Lance e gerencie notas dos alunos</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} />
          Lançar Nota
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Disciplina</th>
                <th>Nota</th>
                <th>Bimestre</th>
                <th>Tipo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {notas.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    Nenhuma nota lançada
                  </td>
                </tr>
              ) : (
                notas.map((nota) => (
                  <tr key={nota.id}>
                    <td>{nota.aluno?.nomeCompleto}</td>
                    <td>{nota.disciplina?.nome}</td>
                    <td>
                      <span className={`badge ${parseFloat(nota.valor) >= 7 ? 'badge-success' : parseFloat(nota.valor) >= 5 ? 'badge-warning' : 'badge-danger'}`}>
                        {parseFloat(nota.valor).toFixed(2)}
                      </span>
                    </td>
                    <td>{formatBimestre(nota.bimestre)}</td>
                    <td>{nota.tipo}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {nota.enviada ? (
                          <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Check size={12} />
                            Nota enviada
                          </span>
                        ) : (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => enviarBoletimWhatsApp(nota)}
                            disabled={enviandoWhatsApp}
                            title="Enviar nota via WhatsApp"
                          >
                            <Send size={14} />
                          </button>
                        )}
                        {usuario?.role === 'ADMIN' && (
                          <>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleEdit(nota)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(nota.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
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
              <h2>{notaSelecionada ? 'Editar Nota' : 'Lançar Nota'}</h2>
              <button onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Aluno *</label>
                    <select
                      className="form-control"
                      value={formData.alunoId}
                      onChange={(e) => setFormData({ ...formData, alunoId: e.target.value })}
                      required
                    >
                      <option value="">Selecione...</option>
                      {alunos.map((aluno) => (
                        <option key={aluno.id} value={aluno.id}>
                          {aluno.nomeCompleto} - {aluno.matricula}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Disciplina *</label>
                    <select
                      className="form-control"
                      value={formData.disciplinaId}
                      onChange={(e) => setFormData({ ...formData, disciplinaId: e.target.value })}
                      required
                    >
                      <option value="">Selecione...</option>
                      {disciplinas.map((disc) => (
                        <option key={disc.id} value={disc.id}>
                          {disc.nome} - {disc.turma?.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Nota (0-10) *</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      max="10"
                      step="0.01"
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Bimestre *</label>
                    <select
                      className="form-control"
                      value={formData.bimestre}
                      onChange={(e) => setFormData({ ...formData, bimestre: e.target.value })}
                    >
                      <option value="PRIMEIRO">1º Bimestre</option>
                      <option value="SEGUNDO">2º Bimestre</option>
                      <option value="TERCEIRO">3º Bimestre</option>
                      <option value="QUARTO">4º Bimestre</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo</label>
                    <select
                      className="form-control"
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    >
                      <option value="PROVA">Prova</option>
                      <option value="TRABALHO">Trabalho</option>
                      <option value="AVALIACAO">Avaliação</option>
                      <option value="RECUPERACAO">Recuperação</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Descrição</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: Prova Bimestral"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {notaSelecionada ? 'Salvar' : 'Lançar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notas;
