import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, QrCode } from 'lucide-react';
import api from '../services/api';

function WhatsAppConnect() {
  const [status, setStatus] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkStatus = async () => {
    try {
      const res = await api.get('/notificacoes/status');
      setStatus(res.data);
      setError(null);
    } catch (err) {
      setError('Erro ao verificar status do WhatsApp');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQRCode = async () => {
    try {
      const whatsappUrl = import.meta.env.VITE_WHATSAPP_URL || 'http://localhost:3001';
      const res = await fetch(`${whatsappUrl}/qr/json`);
      const data = await res.json();
      
      if (data.connected) {
        setStatus({ configurado: true, provider: 'whatsapp-web' });
        setQrCode(null);
      } else if (data.qr) {
        setQrCode(data.qr);
      }
    } catch (err) {
      console.error('Erro ao buscar QR Code:', err);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(() => {
      if (!status?.configurado) {
        fetchQRCode();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [status?.configurado]);

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>WhatsApp Connect</h1>
          <p>Conecte seu WhatsApp para enviar notificações</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className={`stat-icon ${status?.configurado ? 'green' : 'red'}`}>
            {status?.configurado ? <Wifi size={24} /> : <WifiOff size={24} />}
          </div>
          <div className="stat-info">
            <h3>{status?.configurado ? 'Conectado' : 'Desconectado'}</h3>
            <p>Provedor: {status?.provider || 'Nenhum'}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'var(--danger)' }}>
          <p style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>
            <QrCode size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Conectar WhatsApp
          </h2>
          <button className="btn btn-secondary" onClick={fetchQRCode}>
            <RefreshCw size={16} /> Atualizar
          </button>
        </div>

        <div style={{ textAlign: 'center', padding: '2rem' }}>
          {status?.configurado ? (
            <div>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h3 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>
                WhatsApp Conectado!
              </h3>
              <p style={{ color: 'var(--gray-500)' }}>
                Seu WhatsApp está pronto para enviar notificações.
              </p>
            </div>
          ) : qrCode ? (
            <div>
              <p style={{ marginBottom: '1rem', color: 'var(--gray-600)' }}>
                Escaneie o QR Code com seu WhatsApp:
              </p>
              <div style={{
                display: 'inline-block',
                padding: '1rem',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}>
                <img
                  src={qrCode}
                  alt="QR Code WhatsApp"
                  style={{ maxWidth: '300px', display: 'block' }}
                />
              </div>
              <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                1. Abra o WhatsApp no celular<br />
                2. Vá em Configurações → Dispositivos conectados<br />
                3. Toque em "Conectar dispositivo"<br />
                4. Escaneie o QR Code acima
              </p>
            </div>
          ) : (
            <div>
              <div className="spinner" style={{ margin: '1rem auto' }}></div>
              <p style={{ color: 'var(--gray-500)' }}>
                Aguardando QR Code...<br />
                O QR Code aparecerá em instantes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WhatsAppConnect;