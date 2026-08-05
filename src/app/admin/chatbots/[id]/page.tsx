import { query, queryOne } from '@/lib/db';
import { notFound } from 'next/navigation';
import ChatbotTabsClient from './ChatbotTabsClient';

export default async function ChatbotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const chatbot = await queryOne('SELECT * FROM chatbots WHERE id = $1', [id]);
  if (!chatbot) notFound();

  // Buscar fluxo
  const flow = await queryOne('SELECT * FROM chatbot_flows WHERE chatbot_id = $1', [id]);
  const steps = flow && flow.steps ? (typeof flow.steps === 'string' ? JSON.parse(flow.steps) : flow.steps) : [];

  // Buscar produtos
  const products = await query('SELECT id, name FROM products WHERE is_active = TRUE ORDER BY created_at DESC');

  // Buscar sessões ordenadas
  const sessions = await query(
    'SELECT * FROM chatbot_sessions WHERE chatbot_id = $1 ORDER BY last_interaction DESC',
    [id]
  );

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
    <div className="admin-page-container">
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="page-title">{chatbot.name}</h1>
          <p className="page-subtitle">Gestão do Chatbot e Automações</p>
        </div>
      </div>
      
      <ChatbotTabsClient 
        chatbotId={chatbot.id}
        initialSessions={enrichedSessions}
        initialSteps={steps}
        products={products}
      />

      <style>{`
        .admin-page-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .page-title {
          font-size: 22px;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 4px 0;
        }

        .page-subtitle {
          font-size: 13.5px;
          color: #71717a;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
