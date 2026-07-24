'use client';

import { useEffect, useState, FormEvent, use } from 'react';
import { useRouter } from 'next/navigation';

interface Plan {
  id: string | number;
  name: string;
  amount: number | string;
  periodicity_days: number;
}

function formatCurrency(value: number | string) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(num);
}

function formatPeriodicity(days: number) {
  if (days === 7) return 'Semanal';
  if (days === 15) return 'Quinzenal';
  if (days === 30) return 'Mensal';
  if (days === 90) return 'Trimestral';
  if (days === 180) return 'Semestral';
  if (days === 365) return 'Anual';
  return `${days} dias`;
}

function slugify(str: string) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim()
    .replace(/\s+/g, '-').replace(/-+/g, '-');
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // Planos SyncPay
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState('');

  const [loading, setLoading] = useState(true);
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);

  // Upload States
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    banner_url: '',
    creator_name: '',
    theme_color: 'clean_light',
    syncpay_plan_id: '',
    cta_text: 'CONTINUAR PARA SEUS DADOS',
    show_price: true,
    show_period: true,
    is_active: true,
    custom_features: [] as string[],
    gallery_images: [] as string[],
    preview_size: '300x300',
    carousel_position: 'before_plan',
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Gallery Upload State
  const [uploadingGallery, setUploadingGallery] = useState(false);

  async function handleGalleryUpload(files: FileList) {
    setUploadingGallery(true);
    const newUrls: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const data = new FormData();
        data.append('file', files[i]);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: data,
        });
        const json = await res.json();
        if (res.ok && json.url) {
          newUrls.push(json.url);
        }
      }
      setForm((prev) => ({
        ...prev,
        gallery_images: [...prev.gallery_images, ...newUrls],
      }));
    } catch {
      alert('Erro de conexão ao enviar prévias');
    } finally {
      setUploadingGallery(false);
    }
  }

  function removeGalleryImage(index: number) {
    setForm((prev) => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index),
    }));
  }

  // Carrega produto e planos
  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${id}`).then((r) => r.json()),
      fetch('/api/syncpay/plans').then((r) => r.json()),
    ])
      .then(([prodData, plansData]) => {
        if (prodData.product) {
          const p = prodData.product;
          setForm({
            name: p.name ?? '',
            slug: p.slug ?? '',
            description: p.description ?? '',
            image_url: p.image_url ?? '',
            banner_url: p.banner_url ?? '',
            creator_name: p.creator_name ?? '',
            theme_color: p.theme_color ?? 'clean_light',
            syncpay_plan_id: String(p.syncpay_plan_id ?? ''),
            cta_text: p.cta_text ?? 'CONTINUAR PARA SEUS DADOS',
            show_price: p.show_price ?? true,
            show_period: p.show_period ?? true,
            is_active: p.is_active ?? true,
            custom_features: Array.isArray(p.custom_features) ? p.custom_features : [],
            gallery_images: Array.isArray(p.gallery_images) ? p.gallery_images : [],
            preview_size: p.preview_size ?? '300x300',
            carousel_position: p.carousel_position ?? 'before_plan',
          });
        }
        if (plansData.error) setPlansError(plansData.error);
        else setPlans(plansData.plans ?? []);
      })
      .catch(() => setSaveError('Erro ao carregar dados do produto'))
      .finally(() => {
        setLoading(false);
        setPlansLoading(false);
      });
  }, [id]);

  function handleNameChange(newName: string) {
    setForm((prev) => ({
      ...prev,
      name: newName,
      slug: isSlugCustomized ? prev.slug : slugify(newName),
    }));
  }

  function handleSlugChange(newSlug: string) {
    setIsSlugCustomized(true);
    setForm((prev) => ({ ...prev, slug: slugify(newSlug) }));
  }

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFileUpload(file: File, target: 'image_url' | 'banner_url') {
    const setLoading = target === 'image_url' ? setUploadingAvatar : setUploadingBanner;
    setLoading(true);
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });
      const json = await res.json();
      if (res.ok && json.url) {
        setField(target, json.url);
      } else {
        alert(json.error ?? 'Erro ao fazer upload da imagem');
      }
    } catch {
      alert('Erro de conexão ao enviar imagem');
    } finally {
      setLoading(false);
    }
  }

  function addFeature() {
    setForm((prev) => ({
      ...prev,
      custom_features: [...prev.custom_features, ''],
    }));
  }

  function updateFeature(index: number, value: string) {
    setForm((prev) => {
      const list = [...prev.custom_features];
      list[index] = value;
      return { ...prev, custom_features: list };
    });
  }

  function removeFeature(index: number) {
    setForm((prev) => {
      const list = prev.custom_features.filter((_, i) => i !== index);
      return { ...prev, custom_features: list };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError('');

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          syncpay_plan_id: form.syncpay_plan_id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? 'Erro ao salvar alterações');
        return;
      }
      router.push('/admin/products');
    } catch {
      setSaveError('Erro de conexão ao salvar produto');
    } finally {
      setSaving(false);
    }
  }

  const selectedPlan = plans.find((p) => String(p.id) === form.syncpay_plan_id);

  if (loading) {
    return (
      <div className="admin-page-container">
        <div className="loading-state flex-center" style={{ padding: 80 }}>
          <div className="spinner-mono" />
          <span>Carregando produto...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Editar Produto</h1>
          <p className="page-subtitle">Altere as configurações e o plano do seu checkout</p>
        </div>
        <a href="/admin/products" className="btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          <span>Voltar</span>
        </a>
      </div>

      <form onSubmit={handleSubmit} className="form-layout">
        
        {/* ─ Seção 1: Identidade do Produto & Criador ─ */}
        <div className="form-card">
          <div className="card-header-badge">
            <span className="badge-num">1</span>
            <h2>Identidade do Produto & Criador</h2>
          </div>

          <div className="grid-2">
            <div className="field-group">
              <label className="field-label">Nome do produto *</label>
              <input
                type="text"
                className="field-input"
                placeholder="Ex: Vip da Sarinha"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div className="field-group">
              <div className="flex-between">
                <label className="field-label">URL do Produto (Slug)</label>
                {isSlugCustomized && (
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => {
                      setIsSlugCustomized(false);
                      setForm((prev) => ({ ...prev, slug: slugify(prev.name) }));
                    }}
                  >
                    Resetar auto-slug
                  </button>
                )}
              </div>
              <div className="input-prefix-box">
                <span className="prefix-label">/p/</span>
                <input
                  type="text"
                  className="field-input prefixed"
                  placeholder="vip-da-sarinha"
                  value={form.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid-2 mt-4">
            <div className="field-group">
              <label className="field-label">Nome / @username do Criador</label>
              <input
                type="text"
                className="field-input"
                placeholder="Ex: @vip-da-sarinha-nelvis"
                value={form.creator_name}
                onChange={(e) => setField('creator_name', e.target.value)}
              />
            </div>

            {/* Upload Foto de Perfil / Avatar */}
            <div className="field-group">
              <label className="field-label">Foto de Perfil / Avatar</label>
              {form.image_url ? (
                <div className="image-preview-box">
                  <img src={form.image_url} alt="Avatar" className="avatar-preview" />
                  <div className="preview-actions">
                    <span className="file-url-label">{form.image_url}</span>
                    <button
                      type="button"
                      className="btn-remove-img"
                      onClick={() => setField('image_url', '')}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ) : (
                <div className="upload-dropzone">
                  <input
                    type="file"
                    accept="image/*"
                    id="avatar-edit-upload"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'image_url');
                    }}
                  />
                  <label htmlFor="avatar-edit-upload" className="btn-upload-trigger">
                    {uploadingAvatar ? (
                      <span className="flex-center gap-2">
                        <div className="spinner-mono" />
                        <span>Enviando foto...</span>
                      </span>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        <span>Upload da Foto (Avatar)</span>
                      </>
                    )}
                  </label>
                </div>
              )}
              <span className="field-help">Recomendado: <strong>300 x 300 px</strong> (formato quadrado — corte circular)</span>
            </div>
          </div>

          {/* Upload Foto / Banner do Produto */}
          <div className="field-group mt-4">
            <label className="field-label">Foto / Banner do Produto</label>
            {form.banner_url ? (
              <div className="image-preview-box banner">
                <img src={form.banner_url} alt="Banner" className="banner-preview" />
                <div className="preview-actions">
                  <span className="file-url-label">{form.banner_url}</span>
                  <button
                    type="button"
                    className="btn-remove-img"
                    onClick={() => setField('banner_url', '')}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <div className="upload-dropzone">
                <input
                  type="file"
                  accept="image/*"
                  id="banner-edit-upload"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'banner_url');
                  }}
                />
                <label htmlFor="banner-edit-upload" className="btn-upload-trigger">
                  {uploadingBanner ? (
                    <span className="flex-center gap-2">
                      <div className="spinner-mono" />
                      <span>Enviando banner...</span>
                    </span>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <span>Upload do Banner do Produto</span>
                    </>
                  )}
                </label>
              </div>
            )}
            <span className="field-help">Recomendado: <strong>1200 x 600 px</strong> (proporção 2:1 no topo do card)</span>
          </div>

          <div className="field-group mt-4">
            <label className="field-label">Descrição do Produto</label>
            <textarea
              className="field-textarea"
              placeholder="Ex: Grupo privado exclusivo da Sarinha..."
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* ─ Seção 2: Plano SyncPay ─ */}
        <div className="form-card">
          <div className="card-header-badge">
            <span className="badge-num">2</span>
            <h2>Plano de Cobrança (SyncPay)</h2>
          </div>

          {plansLoading ? (
            <div className="loading-state">
              <div className="spinner-mono" />
              <span>Buscando planos ativos na SyncPay...</span>
            </div>
          ) : plansError ? (
            <div className="alert-mono error">
              <span>Erro ao carregar planos: {plansError}</span>
            </div>
          ) : (
            <div className="plans-grid-mono">
              {plans.map((plan) => {
                const isSelected = form.syncpay_plan_id === String(plan.id);
                return (
                  <div
                    key={plan.id}
                    className={`plan-box ${isSelected ? 'selected' : ''}`}
                    onClick={() => setField('syncpay_plan_id', String(plan.id))}
                  >
                    <div className="plan-box-radio">
                      <div className={`radio-dot ${isSelected ? 'active' : ''}`} />
                    </div>
                    <div className="plan-box-content">
                      <span className="plan-box-name">{plan.name}</span>
                      <span className="plan-box-price">
                        {formatCurrency(plan.amount)}
                        <small>/{formatPeriodicity(plan.periodicity_days)}</small>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedPlan && (
            <div className="selected-plan-notice">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>
                Plano selecionado: <strong>{selectedPlan.name}</strong> — {formatCurrency(selectedPlan.amount)}/{formatPeriodicity(selectedPlan.periodicity_days)}
              </span>
            </div>
          )}
        </div>

        {/* ─ Seção 3: Configurações de Exibição ─ */}
        {form.syncpay_plan_id ? (
          <div className="form-card">
            <div className="card-header-badge">
              <span className="badge-num">3</span>
              <h2>O que o comprador vê no checkout</h2>
            </div>

            {/* Paleta de Cores */}
            <div className="field-group mb-6">
              <label className="field-label">Paleta de Cores do Checkout</label>
              <div className="themes-grid-mono">
                {[
                  { id: 'clean_light', name: 'Clean Light (Branco & Azul)', primary: '#009bf2', bg: '#f4f6f8', text: '#333' },
                  { id: 'dark_vip', name: 'Preto & Dourado VIP', primary: '#e6b800', bg: '#121214', text: '#fff' },
                  { id: 'hot_red', name: 'Hot Red (Vermelho Sedutor)', primary: '#e50914', bg: '#0d0d0d', text: '#fff' },
                  { id: 'neon_pink', name: 'Rosa Neon Hot', primary: '#ff2a85', bg: '#100814', text: '#fff' },
                  { id: 'midnight_purple', name: 'Midnight Purple', primary: '#9333ea', bg: '#0a0512', text: '#fff' },
                ].map((t) => (
                  <div
                    key={t.id}
                    className={`theme-box ${form.theme_color === t.id ? 'active' : ''}`}
                    onClick={() => setField('theme_color', t.id)}
                  >
                    <div className="theme-mini-preview" style={{ background: t.bg }}>
                      <div className="theme-color-dot" style={{ background: t.primary }} />
                      <span style={{ color: t.text, fontSize: 10, fontWeight: 800 }}>Aa</span>
                    </div>
                    <span className="theme-box-label">{t.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="field-group mb-6">
              <label className="field-label">Texto do botão CTA principal</label>
              <input
                type="text"
                className="field-input"
                placeholder="CONTINUAR PARA SEUS DADOS"
                value={form.cta_text}
                onChange={(e) => setField('cta_text', e.target.value)}
              />
            </div>

            <div className="toggles-list">
              <div
                className="toggle-row"
                onClick={() => setField('show_price', !form.show_price)}
              >
                <div className="toggle-meta">
                  <span className="toggle-title">Exibir preço e valor do plano</span>
                  <span className="toggle-sub">Mostra o valor monetário da assinatura cadastrada na SyncPay</span>
                </div>
                <div className={`switch-track ${form.show_price ? 'checked' : ''}`}>
                  <div className="switch-thumb" />
                </div>
              </div>

              <div
                className="toggle-row"
                onClick={() => setField('show_period', !form.show_period)}
              >
                <div className="toggle-meta">
                  <span className="toggle-title">Exibir período de cobrança</span>
                  <span className="toggle-sub">Mostra a frequência da cobrança (ex: &quot;a cada 1semana&quot;)</span>
                </div>
                <div className={`switch-track ${form.show_period ? 'checked' : ''}`}>
                  <div className="switch-thumb" />
                </div>
              </div>
            </div>

            {/* Benefícios do Produto */}
            <div className="field-group mt-6">
              <div className="flex-between mb-2">
                <label className="field-label">Benefícios do Produto (Opcional)</label>
                <button type="button" className="btn-link" onClick={addFeature}>
                  + Adicionar Benefício
                </button>
              </div>
              <span className="field-help mb-2">Lista de benefícios exibida logo abaixo do plano no checkout</span>

              <div className="features-list">
                {form.custom_features.map((feature, idx) => (
                  <div key={idx} className="feature-input-row">
                    <span className="feature-bullet">✓</span>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="Ex: Acesso a conteúdos diários exclusivos no grupo VIP"
                      value={feature}
                      onChange={(e) => updateFeature(idx, e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-remove-feature"
                      onClick={() => removeFeature(idx)}
                      title="Remover benefício"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Carrossel de Prévias (Opcional) */}
            <div className="field-group mt-6">
              <div className="flex-between mb-2">
                <label className="field-label">Carrossel de Prévias (Opcional — Proporção 1:1)</label>
              </div>

              <div className="grid-3 mb-4">
                <div className="field-group">
                  <label className="field-label">Posição do Carrossel</label>
                  <select
                    className="field-input"
                    value={form.carousel_position}
                    onChange={(e) => setField('carousel_position', e.target.value)}
                  >
                    <option value="before_plan">Antes do Card do Plano (Topo)</option>
                    <option value="after_plan">Depois do Card do Plano (Abaixo)</option>
                  </select>
                </div>

                <div className="field-group">
                  <label className="field-label">Resolução das Prévias</label>
                  <select
                    className="field-input"
                    value={form.preview_size}
                    onChange={(e) => setField('preview_size', e.target.value)}
                  >
                    <option value="30x30">30 x 30 px (Super Mini)</option>
                    <option value="50x50">50 x 50 px (Mini)</option>
                    <option value="100x100">100 x 100 px (Pequeno)</option>
                    <option value="200x200">200 x 200 px (Médio)</option>
                    <option value="300x300">300 x 300 px (Grande — Padrão)</option>
                    <option value="400x400">400 x 400 px (Extra Grande)</option>
                    <option value="500x500">500 x 500 px (Máximo)</option>
                  </select>
                </div>

                <div className="field-group">
                  <label className="field-label">Adicionar Fotos da Galeria</label>
                  <div className="upload-dropzone">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      id="gallery-edit-upload"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleGalleryUpload(e.target.files);
                        }
                      }}
                    />
                    <label htmlFor="gallery-edit-upload" className="btn-upload-trigger">
                      {uploadingGallery ? (
                        <span className="flex-center gap-2">
                          <div className="spinner-mono" />
                          <span>Enviando prévias...</span>
                        </span>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                          <span>+ Upload de Fotos</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <div className="recommendation-notice mb-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span>Recomendamos enviar <strong>no mínimo 6 prévias</strong> para que o carrossel passe de forma infinita e fluida na página do produto.</span>
              </div>

              {/* Grid de Thumbnails da Galeria */}
              {form.gallery_images.length > 0 && (
                <div className="gallery-grid-mono">
                  {form.gallery_images.map((imgUrl, idx) => (
                    <div key={idx} className="gallery-thumb-card">
                      <img src={imgUrl} alt={`Prévia ${idx + 1}`} />
                      <button
                        type="button"
                        className="gallery-thumb-delete"
                        onClick={() => removeGalleryImage(idx)}
                        title="Remover prévia"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="unlock-notice">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>Selecione um plano da SyncPay na etapa 2 acima para liberar as opções de exibição do checkout.</span>
          </div>
        )}

        {/* Status */}
        <div className="form-card">
          <div
            className="toggle-row"
            onClick={() => setField('is_active', !form.is_active)}
          >
            <div className="toggle-meta">
              <span className="toggle-title">Produto ativo para vendas</span>
              <span className="toggle-sub">Produto visível e disponível para compra na URL pública</span>
            </div>
            <div className={`switch-track ${form.is_active ? 'checked' : ''}`}>
              <div className="switch-thumb" />
            </div>
          </div>
        </div>

        {saveError && (
          <div className="alert-mono error">
            <span>{saveError}</span>
          </div>
        )}

        <div className="form-actions">
          <a href="/admin/products" className="btn-secondary">Cancelar</a>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving || !form.syncpay_plan_id || !form.name || !form.slug}
          >
            {saving ? (
              <span className="flex-center gap-2">
                <div className="spinner-mono" />
                <span>Salvando...</span>
              </span>
            ) : (
              <span>Salvar Alterações</span>
            )}
          </button>
        </div>
      </form>

      <style>{`
        .admin-page-container {
          max-width: 820px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
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

        .form-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-card {
          background-color: #121215;
          border: 1px solid #27272a;
          border-radius: 14px;
          padding: 24px;
        }

        .card-header-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #27272a;
        }

        .badge-num {
          width: 26px;
          height: 26px;
          background-color: #ffffff;
          color: #000000;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-header-badge h2 {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .mt-4 { margin-top: 16px; }
        .mb-6 { margin-bottom: 24px; }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .flex-between {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .btn-link {
          background: none;
          border: none;
          color: #a1a1aa;
          font-size: 11px;
          cursor: pointer;
          text-decoration: underline;
        }

        .field-label {
          font-size: 12px;
          font-weight: 600;
          color: #a1a1aa;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .field-input, .field-textarea {
          width: 100%;
          background-color: #09090b;
          border: 1px solid #27272a;
          border-radius: 8px;
          padding: 11px 14px;
          color: #ffffff;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .field-input:focus, .field-textarea:focus {
          border-color: #ffffff;
        }

        .input-prefix-box {
          display: flex;
          align-items: center;
          background-color: #09090b;
          border: 1px solid #27272a;
          border-radius: 8px;
          overflow: hidden;
        }

        .prefix-label {
          padding: 0 12px;
          color: #71717a;
          font-size: 13px;
          font-family: monospace;
          border-right: 1px solid #27272a;
        }

        .field-input.prefixed {
          border: none !important;
          border-radius: 0 !important;
        }

        /* Upload Dropzone & Previews */
        .upload-dropzone {
          background-color: #09090b;
          border: 1px dashed #27272a;
          border-radius: 8px;
          padding: 8px;
          transition: border-color 0.2s ease;
        }

        .upload-dropzone:hover {
          border-color: #52525b;
        }

        .btn-upload-trigger {
          width: 100%;
          height: 42px;
          background-color: transparent;
          color: #d4d4d8;
          border: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .image-preview-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background-color: #09090b;
          border: 1px solid #27272a;
          border-radius: 8px;
          padding: 10px;
        }

        .avatar-preview {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid #3f3f46;
        }

        .banner-preview {
          height: 60px;
          width: 120px;
          border-radius: 6px;
          object-fit: cover;
          border: 1px solid #3f3f46;
        }

        .preview-actions {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          min-width: 0;
        }

        .file-url-label {
          font-size: 11px;
          color: #71717a;
          font-family: monospace;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .btn-remove-img {
          background: none;
          border: none;
          color: #ef4444;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          text-align: left;
          padding: 0;
        }

        /* Plans Grid */
        .plans-grid-mono {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 12px;
        }

        .plan-box {
          background-color: #09090b;
          border: 1px solid #27272a;
          border-radius: 10px;
          padding: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s ease;
        }

        .plan-box:hover {
          border-color: #52525b;
        }

        .plan-box.selected {
          border-color: #ffffff;
          background-color: rgba(255, 255, 255, 0.03);
        }

        .plan-box-radio {
          flex-shrink: 0;
        }

        .radio-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid #3f3f46;
          position: relative;
        }

        .radio-dot.active {
          border-color: #ffffff;
          background-color: #ffffff;
        }

        .radio-dot.active::after {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 6px; height: 6px;
          border-radius: 50%;
          background-color: #000000;
        }

        .plan-box-content {
          display: flex;
          flex-direction: column;
        }

        .plan-box-name {
          font-size: 13.5px;
          font-weight: 600;
          color: #ffffff;
        }

        .plan-box-price {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          margin-top: 2px;
        }

        .plan-box-price small {
          font-size: 11px;
          color: #71717a;
          font-weight: 400;
        }

        .selected-plan-notice {
          margin-top: 14px;
          padding: 12px 14px;
          background-color: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 8px;
          color: #10b981;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .unlock-notice {
          background-color: #121215;
          border: 1px dashed #27272a;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          color: #71717a;
          font-size: 13.5px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        /* Themes */
        .themes-grid-mono {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 10px;
          margin-top: 8px;
        }

        .theme-box {
          background-color: #09090b;
          border: 1px solid #27272a;
          border-radius: 8px;
          padding: 10px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          transition: border-color 0.2s ease;
        }

        .theme-box.active {
          border-color: #ffffff;
          background-color: rgba(255, 255, 255, 0.05);
        }

        .theme-mini-preview {
          width: 100%;
          height: 32px;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 0 6px;
        }

        .theme-color-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .theme-box-label {
          font-size: 11px;
          font-weight: 600;
          color: #d4d4d8;
          text-align: center;
        }

        /* Toggles */
        .toggles-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background-color: #09090b;
          border: 1px solid #27272a;
          border-radius: 8px;
          cursor: pointer;
        }

        .toggle-meta {
          display: flex;
          flex-direction: column;
        }

        .toggle-title {
          font-size: 13.5px;
          font-weight: 600;
          color: #ffffff;
        }

        .toggle-sub {
          font-size: 11.5px;
          color: #71717a;
        }

        .switch-track {
          width: 40px;
          height: 22px;
          background-color: #27272a;
          border-radius: 11px;
          padding: 2px;
          transition: background-color 0.2s ease;
        }

        .switch-track.checked {
          background-color: #ffffff;
        }

        .switch-thumb {
          width: 18px;
          height: 18px;
          background-color: #ffffff;
          border-radius: 50%;
          transition: transform 0.2s ease;
        }

        .switch-track.checked .switch-thumb {
          transform: translateX(18px);
          background-color: #000000;
        }

        /* Features List Admin */
        .mt-6 { margin-top: 24px; }
        .mb-2 { margin-bottom: 8px; }

        .features-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .feature-input-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .feature-bullet {
          color: #10b981;
          font-weight: 800;
          font-size: 16px;
        }

        .btn-remove-feature {
          background: none;
          border: 1px solid #27272a;
          border-radius: 6px;
          color: #ef4444;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }

        .btn-remove-feature:hover {
          background-color: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
        }

        /* Gallery Grid Admin */
        .recommendation-notice {
          padding: 12px 14px;
          background-color: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          color: #60a5fa;
          font-size: 12.5px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .gallery-grid-mono {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 10px;
          margin-top: 12px;
        }

        .gallery-thumb-card {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #27272a;
          background-color: #09090b;
        }

        .gallery-thumb-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .gallery-thumb-delete {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background-color: rgba(0, 0, 0, 0.75);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .gallery-thumb-delete:hover {
          background-color: #ef4444;
        }

        /* Actions */
        .form-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 12px;
        }

        .btn-primary {
          background-color: #ffffff;
          color: #000000;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .btn-primary:hover:not(:disabled) {
          opacity: 0.9;
        }

        .btn-primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .btn-secondary {
          background-color: transparent;
          color: #a1a1aa;
          border: 1px solid #27272a;
          border-radius: 8px;
          padding: 10px 18px;
          font-size: 13.5px;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .btn-secondary:hover {
          color: #ffffff;
          border-color: #52525b;
        }

        .loading-state {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #71717a;
          font-size: 13px;
          padding: 16px 0;
        }

        .spinner-mono {
          width: 16px;
          height: 16px;
          border: 2px solid #27272a;
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .alert-mono {
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 13px;
        }

        .alert-mono.error {
          background-color: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5;
        }

        .flex-center {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gap-2 { gap: 8px; }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
