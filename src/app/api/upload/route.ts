import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { cleanupUnusedUploads } from '@/lib/cleanup-uploads';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Valida tipo do arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Formato de imagem inválido. Use JPG, PNG ou WEBP' }, { status: 400 });
    }

    // Garante que o diretório public/uploads existe
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Obtém extensão original
    const ext = path.extname(file.name) || '.jpg';
    const filename = `${Date.now()}-${uuidv4().slice(0, 8)}${ext.toLowerCase()}`;
    const filePath = path.join(uploadsDir, filename);

    // Escreve o arquivo no disco
    fs.writeFileSync(filePath, buffer);

    // Dispara a limpeza preventiva de arquivos antigos não utilizados
    cleanupUnusedUploads().catch(() => {});

    const publicUrl = `/uploads/${filename}`;
    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao processar upload';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
