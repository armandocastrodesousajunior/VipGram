import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { cleanupUnusedUploads } from '@/lib/cleanup-uploads';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

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
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/aac',
      'video/mp4', 'video/webm', 'video/quicktime'
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Formato inválido. Envie imagens, áudios (MP3, OGG) ou vídeos (MP4)' }, { status: 400 });
    }

    // Garante que o diretório public/uploads existe
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);
    let ext = path.extname(file.name) || (file.type.startsWith('audio/') ? '.mp3' : file.type.startsWith('video/') ? '.mp4' : '.jpg');

    const isImage = file.type.startsWith('image/');

    // Se for imagem e não for GIF animado, otimizamos e comprimimos para WebP ultraleve usando sharp
    if (isImage && file.type !== 'image/gif' && ext.toLowerCase() !== '.gif') {
      try {
        buffer = await sharp(buffer)
          .resize({ width: 1920, withoutEnlargement: true })
          .webp({ quality: 80, effort: 4 })
          .toBuffer();
        ext = '.webp';
      } catch (sharpErr) {
        console.warn('[Upload] Falha ao otimizar com sharp, salvando arquivo original:', sharpErr);
      }
    }

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
