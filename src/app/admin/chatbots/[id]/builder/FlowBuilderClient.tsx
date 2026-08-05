'use client';

import { useState, useRef } from 'react';

type StepType = 'text' | 'buttons' | 'media';
type ButtonAction = 'generate_pix' | 'send_link' | 'url' | 'copy';

interface FlowStep {
  type: StepType;
  content?: string;
  stageName?: string;
  options?: { label: string; action: ButtonAction; productId?: string; url?: string; copyText?: string }[];
  parseMode?: 'HTML' | 'None';
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'voice';
  simulateAction?: boolean;
}

export default function FlowBuilderClient({ chatbotId, initialSteps, products }: { chatbotId: string, initialSteps: FlowStep[], products: any[] }) {
  const [steps, setSteps] = useState<FlowStep[]>(initialSteps.length > 0 ? initialSteps : [{ type: 'text', content: 'Olá! Como posso ajudar?', stageName: 'Boas Vindas' }]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const [tagModalIndex, setTagModalIndex] = useState<number | null>(null);
  const [tempTagValue, setTempTagValue] = useState('');

  const openTagModal = (index: number) => {
    setTempTagValue(steps[index].stageName || '');
    setTagModalIndex(index);
  };

  const saveTag = () => {
    if (tagModalIndex !== null) {
      updateStepField(tagModalIndex, 'stageName', tempTagValue);
      setTagModalIndex(null);
    }
  };

  const addTextStep = () => {
    setSteps([...steps, { type: 'text', content: '', stageName: '', parseMode: 'None' }]);
    setSaved(false);
  };

  const addButtonsStep = () => {
    setSteps([...steps, { 
      type: 'buttons', 
      stageName: '',
      content: 'Escolha uma opção:',
      options: [
        { label: 'Gerar PIX', action: 'generate_pix', productId: products[0]?.id || '' }
      ] 
    }]);
    setSaved(false);
  };

  const addMediaStep = () => {
    setSteps([...steps, { 
      type: 'media', 
      stageName: '',
      mediaType: 'image',
      mediaUrl: '',
      simulateAction: true
    }]);
    setSaved(false);
  };

  const updateStepField = (index: number, field: keyof FlowStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
    setSaved(false);
  };

  const updateOption = (stepIndex: number, optionIndex: number, field: string, value: any) => {
    const newSteps = [...steps];
    if (newSteps[stepIndex].options) {
      (newSteps[stepIndex].options as any)[optionIndex][field] = value;
    }
    setSteps(newSteps);
    setSaved(false);
  };

  const addOption = (stepIndex: number) => {
    const newSteps = [...steps];
    if (newSteps[stepIndex].options) {
      newSteps[stepIndex].options.push({ label: 'Novo Botão', action: 'url', url: 'https://' });
    }
    setSteps(newSteps);
    setSaved(false);
  };

  const removeOption = (stepIndex: number, optionIndex: number) => {
    const newSteps = [...steps];
    if (newSteps[stepIndex].options) {
      newSteps[stepIndex].options.splice(optionIndex, 1);
    }
    setSteps(newSteps);
    setSaved(false);
  };

  const removeStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
    setSaved(false);
  };

  const handleMediaUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingIndex(index);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
         updateStepField(index, 'mediaUrl', data.url);
      } else {
         alert(data.error || 'Erro no upload');
      }
    } catch (err) {
      alert('Erro de conexão no upload');
    }
    setUploadingIndex(null);
  };

  const saveFlow = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/chatbots/${chatbotId}/flow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps })
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert('Erro ao salvar fluxo');
      }
    } catch (e) {
      alert('Erro na conexão');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p style={{ color: '#71717a', fontSize: 13.5, margin: 0 }}>
        Configure as mensagens que o bot enviará sequencialmente. Adicione <strong>Tags de Estágio</strong> para acompanhar a jornada do cliente nas Sessões.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {steps.map((step, index) => (
          <div key={index} style={{ padding: 20, border: '1px solid #27272a', borderRadius: 14, background: '#09090b', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
              <button 
                onClick={() => openTagModal(index)}
                title="Definir Tag de Estágio"
                style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#a1a1aa', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
              </button>
              <button 
                onClick={() => removeStep(index)}
                title="Excluir Passo"
                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#27272a', color: '#ffffff', fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 6 }}>
                  PASSO {index + 1}
                </span>
                <span style={{ color: '#a1a1aa', fontSize: 13, fontWeight: 600 }}>
                  {step.type === 'text' ? 'Mensagem de Texto' : step.type === 'media' ? 'Mídia (Áudio, Vídeo, Foto)' : 'Botões Interativos'}
                </span>
                {step.stageName && (
                  <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    {step.stageName}
                  </span>
                )}
              </div>
            </div>

            {step.type === 'media' && (
              <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>TIPO DE MÍDIA</label>
                    <select 
                      style={{ width: '100%', padding: '10px 14px', fontSize: 13.5, background: '#121215', border: '1px solid #27272a', borderRadius: 8, color: '#ffffff', outline: 'none' }}
                      value={step.mediaType || 'image'}
                      onChange={e => updateStepField(index, 'mediaType', e.target.value)}
                    >
                      <option value="image">Imagem / Foto</option>
                      <option value="video">Vídeo</option>
                      <option value="audio">Áudio Normal (MP3)</option>
                      <option value="voice">Áudio Gravado (Voice Note)</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>AÇÃO DO CHAT</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#121215', border: '1px solid #27272a', borderRadius: 8, cursor: 'pointer', height: 42 }}>
                      <input 
                        type="checkbox" 
                        checked={step.simulateAction !== false} 
                        onChange={e => updateStepField(index, 'simulateAction', e.target.checked)}
                        style={{ accentColor: '#ffffff' }}
                      />
                      <span style={{ fontSize: 13, color: '#ffffff' }}>Simular envio no chat</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>ARQUIVO (URL ou Upload)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      type="text" 
                      placeholder="https://..."
                      value={step.mediaUrl || ''}
                      onChange={e => updateStepField(index, 'mediaUrl', e.target.value)}
                      style={{ flex: 1, padding: '10px 14px', fontSize: 13.5, background: '#121215', border: '1px solid #27272a', borderRadius: 8, color: '#ffffff', outline: 'none' }}
                    />
                    <input 
                      type="file" 
                      ref={el => fileInputRefs.current[index] = el}
                      style={{ display: 'none' }}
                      onChange={e => handleMediaUpload(index, e)}
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRefs.current[index]?.click()}
                      style={{ padding: '0 16px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 8, color: '#ffffff', fontSize: 13, cursor: 'pointer' }}
                    >
                      {uploadingIndex === index ? 'Enviando...' : 'Fazer Upload'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(step.type === 'text' || step.type === 'buttons') && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa' }}>
                    MENSAGEM DO BOT
                  </label>
                  {step.type === 'text' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#71717a', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={step.parseMode === 'HTML'}
                        onChange={e => updateStepField(index, 'parseMode', e.target.checked ? 'HTML' : 'None')}
                        style={{ accentColor: '#ffffff' }}
                      />
                      HTML Parser
                    </label>
                  )}
                </div>
                <textarea 
                  style={{ width: '100%', padding: '12px 14px', fontSize: 13.5, background: '#121215', border: '1px solid #27272a', borderRadius: 8, color: '#ffffff', outline: 'none', minHeight: 80, resize: 'vertical' }}
                  value={step.content}
                  onChange={e => updateStepField(index, 'content', e.target.value)}
                  placeholder={step.type === 'buttons' ? "Ex: Escolha uma opção abaixo:" : "Digite o texto que o robô vai enviar..."}
                />
              </div>
            )}
            
            {step.type === 'buttons' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 2 }}>
                  CONFIGURAÇÃO DOS BOTÕES
                </label>
                {step.options?.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#121215', padding: 12, borderRadius: 8, border: '1px solid #27272a', position: 'relative' }}>
                    <button 
                      onClick={() => removeOption(index, i)}
                      title="Excluir Botão"
                      style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                    
                    <div style={{ display: 'flex', gap: 12, width: 'calc(100% - 24px)' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 11, color: '#71717a', marginBottom: 4 }}>Texto do Botão</label>
                        <input 
                          type="text" 
                          value={opt.label}
                          onChange={e => updateOption(index, i, 'label', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', fontSize: 13, background: '#09090b', border: '1px solid #27272a', borderRadius: 6, color: '#ffffff', outline: 'none' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 11, color: '#71717a', marginBottom: 4 }}>Ação do Botão</label>
                        <select 
                          style={{ width: '100%', padding: '8px 12px', fontSize: 13, background: '#09090b', border: '1px solid #27272a', borderRadius: 6, color: '#ffffff', outline: 'none' }}
                          value={opt.action}
                          onChange={e => updateOption(index, i, 'action', e.target.value)}
                        >
                          <option value="generate_pix">Gerar PIX Nativo (Produto)</option>
                          <option value="send_link">Enviar Link da Página (Produto)</option>
                          <option value="url">Abrir URL (Redirecionar)</option>
                          <option value="copy">Botão Copiar Texto (Embutido)</option>
                        </select>
                      </div>
                    </div>

                    {(opt.action === 'generate_pix' || opt.action === 'send_link') && (
                      <div>
                        <label style={{ display: 'block', fontSize: 11, color: '#71717a', marginBottom: 4 }}>Produto Vinculado</label>
                        <select 
                          style={{ width: '100%', padding: '8px 12px', fontSize: 13, background: '#09090b', border: '1px solid #27272a', borderRadius: 6, color: '#ffffff', outline: 'none' }}
                          value={opt.productId || ''}
                          onChange={e => updateOption(index, i, 'productId', e.target.value)}
                        >
                          <option value="" disabled>Selecione um Produto...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {opt.action === 'url' && (
                      <div>
                        <label style={{ display: 'block', fontSize: 11, color: '#71717a', marginBottom: 4 }}>URL de Destino</label>
                        <input 
                          type="text" 
                          placeholder="https://google.com"
                          value={opt.url || ''}
                          onChange={e => updateOption(index, i, 'url', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', fontSize: 13, background: '#09090b', border: '1px solid #27272a', borderRadius: 6, color: '#ffffff', outline: 'none' }}
                        />
                      </div>
                    )}

                    {opt.action === 'copy' && (
                      <div>
                        <label style={{ display: 'block', fontSize: 11, color: '#71717a', marginBottom: 4 }}>Texto para Copiar</label>
                        <input 
                          type="text" 
                          placeholder="Texto que o cliente vai copiar..."
                          value={opt.copyText || ''}
                          onChange={e => updateOption(index, i, 'copyText', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', fontSize: 13, background: '#09090b', border: '1px solid #27272a', borderRadius: 6, color: '#ffffff', outline: 'none' }}
                        />
                      </div>
                    )}
                  </div>
                ))}

                <button 
                  type="button" 
                  onClick={() => addOption(index)}
                  style={{ alignSelf: 'flex-start', padding: '6px 12px', background: 'transparent', border: '1px dashed #52525b', color: '#a1a1aa', borderRadius: 6, cursor: 'pointer', fontSize: 12, marginTop: 4 }}
                >
                  + Novo Botão
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button 
          type="button" 
          onClick={addTextStep} 
          className="add-step-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Texto
        </button>
        <button 
          type="button" 
          onClick={addMediaStep} 
          className="add-step-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          Mídia
        </button>
        <button 
          type="button" 
          onClick={addButtonsStep} 
          className="add-step-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Botões (Ações)
        </button>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #27272a', margin: '8px 0' }} />

      <button 
        onClick={saveFlow} 
        disabled={loading} 
        className="btn-primary" 
        style={{ alignSelf: 'flex-start', padding: '12px 32px' }}
      >
        {loading ? (
          <div style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        ) : saved ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Salvo com Sucesso!
          </>
        ) : (
          'Salvar Fluxo de Automação'
        )}
      </button>

      {tagModalIndex !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#09090b', border: '1px solid #27272a', padding: 24, borderRadius: 12, width: 400, maxWidth: '90%' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#ffffff' }}>Definir Tag de Estágio</h3>
            <p style={{ color: '#a1a1aa', fontSize: 13, marginBottom: 16 }}>
              A Tag de Estágio ajuda você a identificar em qual passo do funil de vendas o cliente parou (ex: Boas Vindas, Oferta).
            </p>
            <input 
              type="text" 
              placeholder="Ex: Aquecimento"
              value={tempTagValue}
              onChange={e => setTempTagValue(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', fontSize: 14, background: '#121215', border: '1px solid #27272a', borderRadius: 8, color: '#ffffff', outline: 'none', marginBottom: 20 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setTagModalIndex(null)} style={{ padding: '8px 16px', background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Cancelar</button>
              <button onClick={saveTag} style={{ padding: '8px 16px', background: '#ffffff', color: '#000000', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Salvar Tag</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .add-step-btn {
          padding: 10px 16px;
          background: transparent;
          border: 1px dashed #52525b;
          color: #a1a1aa;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .add-step-btn:hover {
          background: #27272a;
          color: #ffffff;
          border-color: #71717a;
        }

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
