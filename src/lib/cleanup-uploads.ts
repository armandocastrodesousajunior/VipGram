import fs from 'fs';
import path from 'path';
import { query } from '@/lib/db';

export async function cleanupUnusedUploads() {
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    // Cria diretório se não existir
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      return;
    }

    // Lê arquivos na pasta public/uploads
    const filesOnDisk = fs.readdirSync(uploadsDir);
    if (filesOnDisk.length === 0) return;

    // Busca todas as URLs cadastradas no banco de dados
    const products = await query<{ image_url: string | null; banner_url: string | null; gallery_images: any }>(
      'SELECT image_url, banner_url, gallery_images FROM products'
    );

    const usedFiles = new Set<string>();

    for (const p of products) {
      if (p.image_url && p.image_url.includes('/uploads/')) {
        usedFiles.add(path.basename(p.image_url));
      }
      if (p.banner_url && p.banner_url.includes('/uploads/')) {
        usedFiles.add(path.basename(p.banner_url));
      }

      if (p.gallery_images) {
        let gallery: string[] = [];
        if (typeof p.gallery_images === 'string') {
          try {
            gallery = JSON.parse(p.gallery_images);
          } catch { /* ignora */ }
        } else if (Array.isArray(p.gallery_images)) {
          gallery = p.gallery_images;
        }

        for (const url of gallery) {
          if (typeof url === 'string' && url.includes('/uploads/')) {
            usedFiles.add(path.basename(url));
          }
        }
      }
    }

    // Só deleta arquivos soltos se forem mais antigos que 30 minutos
    // (evita apagar imagens que o usuário acabou de enviar enquanto preenche o formulário)
    const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutos
    const now = Date.now();

    let removedCount = 0;
    for (const file of filesOnDisk) {
      if (!usedFiles.has(file)) {
        try {
          const filePath = path.join(uploadsDir, file);
          const stats = fs.statSync(filePath);
          if (now - stats.mtimeMs > MAX_AGE_MS) {
            fs.unlinkSync(filePath);
            removedCount++;
          }
        } catch { /* ignora */ }
      }
    }

    if (removedCount > 0) {
      console.log(`[Upload Cleanup] ${removedCount} arquivo(s) antigos não utilizados removidos de public/uploads.`);
    }
  } catch (err) {
    console.error('[Upload Cleanup Error]:', err);
  }
}
