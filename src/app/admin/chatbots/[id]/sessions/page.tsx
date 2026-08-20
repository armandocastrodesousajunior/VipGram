import { query, queryOne } from '@/lib/db';
import Link from 'next/link';
import SessionsClient from './SessionsClient';
import { notFound } from 'next/navigation';

export default async function SessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const chatbot = await queryOne<any>('SELECT * FROM chatbots WHERE id = $1', [id]);
  if (!chatbot) notFound();

  // Buscar sessões ordenadas pela última interação
  const sessions = await query(
    'SELECT * FROM chatbot_sessions WHERE chatbot_id = $1 ORDER BY last_interaction DESC',
    [id]
  );

  // Buscar fluxo para identificar os nomes dos estágios
  const flow = await queryOne('SELECT steps FROM chatbot_flows WHERE chatbot_id = $1', [id]);
  const steps = flow && flow.steps ? (typeof flow.steps === 'string' ? JSON.parse(flow.steps) : flow.steps) : [];

  // Enriquecer as sessões com o nome do estágio
  const enrichedSessions = sessions.map((session: any) => {
    const stepObj = steps[session.current_step];
    const stageName = stepObj?.stageName || `Passo ${session.current_step + 1}`;
    return {
      ...session,
      stageName
    };
  });

  return (
    <div className="admin-page">
      <div className="admin-header-row">
        <div>
          <h1 className="admin-title">Gestão de Sessões (Leads)</h1>
          <p className="admin-subtitle">Monitoramento do robô: {chatbot.name}</p>
        </div>
        <Link href={`/admin/chatbots/${id}/builder`} className="submit-btn" style={{ width: 'auto', padding: '0 20px', background: 'var(--color-surface-2)', color: '#fff', border: '1px solid var(--color-border)' }}>
          Voltar ao Flow Builder
        </Link>
      </div>
      
      <div className="admin-card">
        <SessionsClient chatbotId={chatbot.id} initialSessions={enrichedSessions} />
      </div>
    </div>
  );
}
