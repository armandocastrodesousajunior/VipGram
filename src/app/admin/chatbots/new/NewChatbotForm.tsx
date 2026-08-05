'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewChatbotForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'standard',
    bot_token: '',
    business_connection_id: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/chatbots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        router.push('/admin/chatbots');
        router.refresh();
      } else {
        alert('Erro ao criar chatbot. Verifique se o Bot Token é válido.');
      }
    } catch (error) {
      alert('Erro de conexão');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label className="field-label">Nome de Identificação</label>
        <input 
          type="text" 
          className="field-input" 
          placeholder="Ex: Robô de Vendas VIP"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          required 
        />
      </div>

      <div>
        <label className="field-label">Tipo de Conexão</label>
        <select 
          className="field-input"
          value={formData.type}
          onChange={e => setFormData({ ...formData, type: e.target.value as 'standard' | 'business' })}
        >
          <option value="standard">Bot Padrão (Os clientes enviam mensagem para um @bot)</option>
          <option value="business">Telegram Business (Os clientes enviam mensagem no seu PV)</option>
        </select>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          {formData.type === 'standard' 
            ? 'Ideal para atendimento automático separado do seu perfil.'
            : 'Ideal para quem assina Telegram Premium e quer automatizar a própria conta pessoal/comercial.'}
        </p>
      </div>

      {formData.type === 'standard' && (
        <div>
          <label className="field-label">Bot Token (Gerado no BotFather)</label>
          <input 
            type="text" 
            className="field-input" 
            placeholder="Ex: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
            value={formData.bot_token}
            onChange={e => setFormData({ ...formData, bot_token: e.target.value })}
            required={formData.type === 'standard'}
          />
        </div>
      )}

      {formData.type === 'business' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Para ativar o Telegram Business, acesse seu Telegram, vá em Configurações &gt; Telegram Business &gt; Chatbots e cole o link abaixo:
          </p>
          <div style={{ padding: 12, background: 'var(--color-surface-2)', border: '1px dashed var(--color-border)', borderRadius: 8, wordBreak: 'break-all' }}>
            <code>https://vip.callme.sbs/api/telegram/webhook/business</code>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            O seu ID de Conexão (Business Connection ID) será preenchido automaticamente quando o primeiro lead enviar mensagem, ou você pode configurá-lo manualmente via API.
          </p>
        </div>
      )}

      <button type="submit" disabled={loading} className="submit-btn" style={{ marginTop: 12 }}>
        {loading ? <div className="spinner" /> : 'Salvar Chatbot e Ir para o Flow Builder'}
      </button>
    </form>
  );
}
