import NewChatbotForm from './NewChatbotForm';

export default async function NewChatbotPage() {
  return (
    <div className="admin-page">
      <div className="admin-header-row">
        <div>
          <h1 className="admin-title">Novo Chatbot</h1>
          <p className="admin-subtitle">Conecte um bot do Telegram para suas automações</p>
        </div>
      </div>
      <div className="admin-card" style={{ maxWidth: 600 }}>
        <NewChatbotForm />
      </div>
    </div>
  );
}
