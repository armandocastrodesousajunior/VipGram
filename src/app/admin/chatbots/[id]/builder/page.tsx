import { query, queryOne } from '@/lib/db';
import { notFound } from 'next/navigation';
import FlowBuilderClient from './FlowBuilderClient';

export default async function FlowBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const chatbot = await queryOne('SELECT * FROM chatbots WHERE id = $1', [id]);
  if (!chatbot) notFound();

  const flow = await queryOne('SELECT * FROM chatbot_flows WHERE chatbot_id = $1', [id]);
  const products = await query('SELECT id, name FROM products WHERE is_active = TRUE ORDER BY created_at DESC');

  return (
    <div className="admin-page">
      <div className="admin-header-row">
        <div>
          <h1 className="admin-title">Construtor de Fluxo</h1>
          <p className="admin-subtitle">Automação para: {chatbot.name}</p>
        </div>
      </div>
      <div className="admin-card">
        <FlowBuilderClient 
          chatbotId={chatbot.id} 
          initialSteps={flow ? (typeof flow.steps === 'string' ? JSON.parse(flow.steps) : flow.steps) : []} 
          products={products}
        />
      </div>
    </div>
  );
}
