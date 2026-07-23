// ATENÇÃO: Este arquivo é SERVER-ONLY.
// Nunca importe este módulo em componentes client-side.
// As credenciais da SyncPay NUNCA devem chegar ao browser.

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const baseUrl = process.env.SYNCPAY_BASE_URL;
  const clientId = process.env.SYNCPAY_CLIENT_ID;
  const clientSecret = process.env.SYNCPAY_CLIENT_SECRET;

  if (!baseUrl || !clientId || !clientSecret) {
    throw new Error('Variáveis de ambiente da SyncPay não configuradas');
  }

  const response = await fetch(
    `${baseUrl}/api/partner/v1/auth-token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SyncPay auth falhou: ${response.status} ${text}`);
  }

  const data = await response.json();

  // Renova 60 segundos antes de expirar
  const expiresIn = data.expires_in ?? 3600;
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (expiresIn - 60) * 1000,
  };

  return tokenCache.token;
}

export async function syncpayFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAccessToken();
  const baseUrl = process.env.SYNCPAY_BASE_URL;

  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers ?? {}),
    },
  });
}

// ─── Tipos da SyncPay ────────────────────────────────────────────────────────

export interface SyncPayPlan {
  id: string | number;
  name: string;
  description?: string;
  amount: number | string;
  periodicity_days: number;
  status: string;
  checkout_url?: string;
}

export interface SyncPaySubscription {
  id: string;
  status: string;          // 'PENDING' | 'ACTIVE' | 'CANCELLED' | 'PAUSED'
  plan_id: string;
  customer: {
    name: string;
    email: string;
    cpf: string;
    phone?: string;
  };
  pix_qr_code?: string;
  pix_qr_code_text?: string;
  next_billing_date?: string;
  created_at: string;
}

// ─── Helpers de API ──────────────────────────────────────────────────────────

export async function listPlans(): Promise<SyncPayPlan[]> {
  const res = await syncpayFetch('/api/partner/v1/subscription-plans');
  if (!res.ok) throw new Error(`Erro ao listar planos: ${res.status}`);
  const data = await res.json();
  return data.data ?? data ?? [];
}

export async function getPlan(planId: string): Promise<SyncPayPlan> {
  try {
    const res = await syncpayFetch(`/api/partner/v1/subscription-plans/${planId}`);
    if (res.ok) {
      const data = await res.json();
      const raw = data.data ?? data;
      if (raw && (raw.id || raw.name || raw.amount)) return raw;
    }
  } catch { /* ignora erro e tenta buscar na lista geral */ }

  const plans = await listPlans();
  const found = plans.find((p) => String(p.id) === String(planId));
  if (found) return found;

  throw new Error(`Plano ${planId} não encontrado na SyncPay`);
}

export interface CreateSubscriberInput {
  plan_id: string;
  name: string;
  email: string;
  cpf: string;
  phone?: string;
}

export async function createSubscriber(
  input: CreateSubscriberInput
): Promise<SyncPaySubscription> {
  const res = await syncpayFetch('/api/partner/v1/subscriptions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erro ao criar assinante: ${res.status} ${err}`);
  }
  return res.json();
}

export async function getSubscription(
  subscriptionId: string
): Promise<SyncPaySubscription> {
  const res = await syncpayFetch(`/api/partner/v1/subscriptions/${subscriptionId}`);
  if (!res.ok) throw new Error(`Erro ao buscar assinatura: ${res.status}`);
  return res.json();
}

export async function listSubscribers(params?: {
  page?: number;
  per_page?: number;
  status?: string;
}): Promise<{ data: SyncPaySubscription[]; total: number }> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.per_page) qs.set('per_page', String(params.per_page));
  if (params?.status) qs.set('status', params.status);

  const res = await syncpayFetch(`/api/partner/v1/subscriptions?${qs.toString()}`);
  if (!res.ok) throw new Error(`Erro ao listar assinantes: ${res.status}`);
  return res.json();
}

export async function cancelSubscription(id: string): Promise<void> {
  const res = await syncpayFetch(`/api/partner/v1/subscriptions/${id}/cancel`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error(`Erro ao cancelar assinatura: ${res.status}`);
}

export async function pauseSubscription(id: string): Promise<void> {
  const res = await syncpayFetch(`/api/partner/v1/subscriptions/${id}/pause`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error(`Erro ao pausar assinatura: ${res.status}`);
}

export async function reactivateSubscription(id: string): Promise<void> {
  const res = await syncpayFetch(`/api/partner/v1/subscriptions/${id}/reactivate`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error(`Erro ao reativar assinatura: ${res.status}`);
}

export async function resendCharge(id: string): Promise<void> {
  const res = await syncpayFetch(`/api/partner/v1/subscriptions/${id}/resend-charge`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error(`Erro ao reenviar cobrança: ${res.status}`);
}
