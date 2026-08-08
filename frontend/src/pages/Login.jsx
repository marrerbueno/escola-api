import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { LogIn, Eye, EyeOff } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !senha) {
      toast.error('Preencha todos os campos');
      return;
    }

    setLoading(true);
    setDebugInfo(null);
    
    try {
      // Informações de debug
      const debug = {
        tentando: 'Conectando ao servidor...',
        url: 'http://192.168.100.111:3000/api/auth/login',
        email: email,
        timestamp: new Date().toLocaleString('pt-BR')
      };
      setDebugInfo(debug);

      await login(email, senha);
      
      setDebugInfo({
        ...debug,
        status: 'SUCESSO',
        mensagem: 'Login realizado com sucesso!'
      });
      
      toast.success('Login realizado com sucesso!');
    } catch (error) {
      console.error('Erro completo:', error);
      
      const errorInfo = {
        status: 'ERRO',
        tipo: error.code || 'Desconhecido',
        mensagem: error.message || 'Sem mensagem',
        resposta: error.response?.data || 'Sem resposta do servidor',
        statusHTTP: error.response?.status || 'Sem status',
        timestamp: new Date().toLocaleString('pt-BR')
      };
      
      setDebugInfo(errorInfo);
      toast.error(error.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>📚 Escola Digital</h1>
          <p>Sistema de Gestão Escolar</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--gray-500)'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <LogIn size={18} />
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Área de Debug */}
        {debugInfo && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: debugInfo.status === 'ERRO' ? '#fee2e2' : '#dcfce7',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontFamily: 'monospace',
            textAlign: 'left'
          }}>
            <strong style={{ color: debugInfo.status === 'ERRO' ? '#dc2626' : '#16a34a' }}>
              {debugInfo.status === 'ERRO' ? '❌ ERRO:' : '✅ SUCESSO'}
            </strong>
            <pre style={{
              margin: '0.5rem 0 0 0',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '0.75rem'
            }}>
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
          <p>Credenciais de teste:</p>
          <p style={{ marginTop: '0.5rem' }}>
            <strong>Admin:</strong> admin@escola.com / 123456
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
