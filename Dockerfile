FROM node:22-alpine AS base

# ─── Etapa 1: Instalar dependências ──────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ─── Etapa 2: Build da aplicação ─────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ─── Etapa 3: Imagem de produção (mínima) ────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Instala su-exec para ajuste dinâmico das permissões dos volumes bind no boot
RUN apk add --no-cache su-exec

# Cria usuário sem privilégios
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia pasta public (favicon, svgs, etc.) com permissão de proprietário
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copia o build standalone (Next.js output: standalone)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# O container inicia rapidamente como root no CMD para ajustar as permissões da pasta de uploads montada no volume (que pode pertencer ao root no host)
# e imediatamente passa a execução para o usuário sem privilégios (nextjs) via su-exec
CMD ["sh", "-c", "mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads && chmod -R 775 /app/public/uploads && exec su-exec nextjs node server.js"]
