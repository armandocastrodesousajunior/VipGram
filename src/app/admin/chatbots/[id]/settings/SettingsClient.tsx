'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsClient({ chatbot }: { chatbot: any }) {
  const router = useRouter();
  
  const [name, setName] = useState(chatbot.name || '');
  const [type, setType] = useState(chatbot.type || 'standard');
  const [botToken, setBotToken] = useState(chatbot.bot_token || '');
  const [businessConnectionId, setBusinessConnectionId] = useState(chatbot.business_connection_id || '');
  
  const [simulationConfig, setSimulationConfig] = useState(
    typeof chatbot.simulation_config === 'string' ? JSON.parse(chatbot.simulation_config) : 
    (chatbot.simulation_config || { textMode: 'normal', textMsPerChar: 180, videoMode: 'normal', audioMode: 'normal' })
  );

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/admin/chatbots/${chatbot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          bot_token: botToken,
          business_connection_id: businessConnectionId,
          simulation_config: simulationConfig,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        router.refresh();
      } else {
        setError(data.error || 'Erro ao salvar configurações');
      }
    } catch (err) {
      setError('Erro de conexão');
    }

    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0' }}>Integração Telegram</h2>
        <p style={{ color: '#71717a', fontSize: 13.5, margin: 0 }}>Configure a forma como o chatbot se conecta ao Telegram.</p>
      </div>

      <form onSubmit={saveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {error && (
          <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8, color: '#f87171', fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>
            NOME DO CHATBOT (Uso interno)
          </label>
          <input 
            type="text" 
            placeholder="Ex: Robô de Vendas VIP"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%', padding: '10px 14px', fontSize: 13.5, background: '#09090b', border: '1px solid #27272a', borderRadius: 8, color: '#ffffff', outline: 'none' }}
          />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #27272a', margin: '4px 0' }} />

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>
            TIPO DE INTEGRAÇÃO
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label 
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 10, cursor: 'pointer',
                border: type === 'standard' ? '1px solid #ffffff' : '1px solid #27272a',
                background: type === 'standard' ? 'rgba(255, 255, 255, 0.05)' : '#09090b',
                transition: 'all 0.2s'
              }}
            >
              <input 
                type="radio" 
                name="type" 
                value="standard" 
                checked={type === 'standard'} 
                onChange={() => setType('standard')}
                style={{ marginTop: 2, accentColor: '#ffffff' }}
              />
              <div>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: '#ffffff', marginBottom: 4 }}>Standard Bot</span>
                <span style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.4 }}>Bot padrão criado no @BotFather. A comunicação ocorre no chat direto com o robô.</span>
              </div>
            </label>

            <label 
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 10, cursor: 'pointer',
                border: type === 'business' ? '1px solid #ffffff' : '1px solid #27272a',
                background: type === 'business' ? 'rgba(255, 255, 255, 0.05)' : '#09090b',
                transition: 'all 0.2s'
              }}
            >
              <input 
                type="radio" 
                name="type" 
                value="business" 
                checked={type === 'business'} 
                onChange={() => setType('business')}
                style={{ marginTop: 2, accentColor: '#ffffff' }}
              />
              <div>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: '#ffffff', marginBottom: 4 }}>Business Account</span>
                <span style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.4 }}>Conectado através do Telegram Premium Business. Requer ID de conexão.</span>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>
            TELEGRAM BOT TOKEN
          </label>
          <input 
            type="text" 
            placeholder="Ex: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            required={type === 'standard'}
            style={{ width: '100%', padding: '10px 14px', fontSize: 13.5, background: '#09090b', border: '1px solid #27272a', borderRadius: 8, color: '#ffffff', outline: 'none' }}
          />
          <span style={{ display: 'block', fontSize: 11, color: '#71717a', marginTop: 6 }}>
            {type === 'business' ? 'Necessário o token do bot que fará a gestão da Business Account.' : 'Token gerado através do @BotFather. O webhook será configurado automaticamente.'}
          </span>
        </div>

        {type === 'business' && (
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>
              BUSINESS CONNECTION ID (Opcional)
            </label>
            <input 
              type="text" 
              placeholder="Ex: BZ123ABC..."
              value={businessConnectionId}
              onChange={(e) => setBusinessConnectionId(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', fontSize: 13.5, background: '#09090b', border: '1px solid #27272a', borderRadius: 8, color: '#ffffff', outline: 'none' }}
            />
            <span style={{ display: 'block', fontSize: 11, color: '#71717a', marginTop: 6 }}>
              Identificador único gerado quando o usuário vincula o bot ao Telegram Business.
            </span>
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid #27272a', margin: '12px 0' }} />

        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0' }}>Simulação de Ações (Typing / Recording)</h3>
          <p style={{ color: '#71717a', fontSize: 13.5, margin: '0 0 16px 0' }}>Configure como o bot simula ações antes de enviar mensagens.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Texto */}
            <div style={{ background: '#121215', border: '1px solid #27272a', padding: 16, borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#ffffff' }}>Mensagens de Texto</span>
                <select 
                  value={simulationConfig.textMode} 
                  onChange={e => setSimulationConfig({...simulationConfig, textMode: e.target.value})}
                  style={{ background: '#09090b', color: '#ffffff', border: '1px solid #27272a', borderRadius: 6, padding: '6px 12px', fontSize: 13 }}
                >
                  <option value="normal">Simulação Normal (Única)</option>
                  <option value="real">Simulação Real (Por caractere)</option>
                </select>
              </div>
              
              {simulationConfig.textMode === 'real' && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #27272a' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>
                    VELOCIDADE DE DIGITAÇÃO (Milissegundos por caractere)
                  </label>
                  <input 
                    type="number" 
                    value={simulationConfig.textMsPerChar}
                    onChange={e => setSimulationConfig({...simulationConfig, textMsPerChar: parseInt(e.target.value) || 0})}
                    style={{ width: '100%', padding: '10px 14px', fontSize: 13.5, background: '#09090b', border: '1px solid #27272a', borderRadius: 8, color: '#ffffff', outline: 'none' }}
                  />
                  <span style={{ display: 'block', fontSize: 11, color: '#71717a', marginTop: 6 }}>
                    Ex: 180ms por caractere. Uma mensagem de 100 caracteres vai "digitar" por 18 segundos.
                  </span>
                </div>
              )}
            </div>

            {/* Vídeo */}
            <div style={{ background: '#121215', border: '1px solid #27272a', padding: 16, borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#ffffff' }}>Vídeos</span>
                <select 
                  value={simulationConfig.videoMode} 
                  onChange={e => setSimulationConfig({...simulationConfig, videoMode: e.target.value})}
                  style={{ background: '#09090b', color: '#ffffff', border: '1px solid #27272a', borderRadius: 6, padding: '6px 12px', fontSize: 13 }}
                >
                  <option value="normal">Simulação Normal (Curta)</option>
                  <option value="real">Simulação Real (Duração do Vídeo)</option>
                </select>
              </div>
              {simulationConfig.videoMode === 'real' && (
                <p style={{ fontSize: 12, color: '#71717a', margin: '8px 0 0 0' }}>
                  No Construtor de Fluxo, você poderá definir a duração de cada vídeo para que o bot simule a gravação pelo tempo exato.
                </p>
              )}
            </div>

            {/* Áudio */}
            <div style={{ background: '#121215', border: '1px solid #27272a', padding: 16, borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#ffffff' }}>Áudios</span>
                <select 
                  value={simulationConfig.audioMode} 
                  onChange={e => setSimulationConfig({...simulationConfig, audioMode: e.target.value})}
                  style={{ background: '#09090b', color: '#ffffff', border: '1px solid #27272a', borderRadius: 6, padding: '6px 12px', fontSize: 13 }}
                >
                  <option value="normal">Simulação Normal (Curta)</option>
                  <option value="real">Simulação Real (Duração do Áudio)</option>
                </select>
              </div>
              {simulationConfig.audioMode === 'real' && (
                <p style={{ fontSize: 12, color: '#71717a', margin: '8px 0 0 0' }}>
                  No Construtor de Fluxo, você poderá definir a duração de cada áudio para que o bot simule a gravação pelo tempo exato.
                </p>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <button 
            type="submit" 
            disabled={loading} 
            className="btn-primary" 
            style={{ padding: '12px 32px' }}
          >
            {loading ? (
              <div style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : saved ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Configurações Salvas!
              </>
            ) : (
              'Salvar Configurações'
            )}
          </button>
        </div>
      </form>

      <style>{`
        .btn-primary {
          background-color: #ffffff;
          color: #000000;
          border: none;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          opacity: 0.9;
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
