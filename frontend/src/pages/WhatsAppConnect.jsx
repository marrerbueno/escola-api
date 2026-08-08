import { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, RefreshCw, QrCode } from 'lucide-react';
import api from '../services/api';

function WhatsAppConnect() {
  const [status, setStatus] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);

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
        setStatus({ configurado: false, provider: 'whatsapp-web' });
      }
    } catch (err) {
      console.error('Erro ao buscar QR Code:', err);
    }
  };

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    
    const init = async () => {
      try {
        const res = await api.get('/notificacoes/status');
        setStatus(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        fetchQRCode();
      }
    };
    
    init();
  }, []);

  useEffect(() => {
    if (loading || status?.configurado) return;
    
    const interval = setInterval(fetchQRCode, 10000);
    return () => clearInterval(interval);
  }, [loading, status?.configurado]);

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
              <p style={{ marginBottom: '1rem', color: 'var(--gray-600)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                Escaneie o QR Code com seu WhatsApp:
              </p>
              <div style={{
                display: 'inline-block',
                padding: '1.5rem',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
              }}>
                <img
                  src={qrCode}
                  alt="QR Code WhatsApp"
                  style={{ maxWidth: '280px', display: 'block' }}
                />
              </div>
              <div style={{ marginTop: '1.5rem', textAlign: 'left', display: 'inline-block' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)', lineHeight: '1.8' }}>
                  <strong>1.</strong> Abra o WhatsApp no celular<br />
                  <strong>2.</strong> Vá em <strong>Configurações</strong> → <strong>Dispositivos conectados</strong><br />
                  <strong>3.</strong> Toque em <strong>"Conectar dispositivo"</strong><br />
                  <strong>4.</strong> Escaneie o QR Code acima
                </p>
              </div>
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
    </div>
  );
}

export default WhatsAppConnect;