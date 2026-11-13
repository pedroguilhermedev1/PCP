import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createZipBuffer } from '@/lib/zip';

export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads', 'faturas');

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export async function POST(request: Request) {
  try {
    ensureUploadDir();
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File | null;
    const categoria = (formData.get('categoria') as string) || 'documento';

    const filesToProcess: File[] = [];
    if (files && files.length > 0) {
      filesToProcess.push(...files);
    } else if (singleFile) {
      filesToProcess.push(singleFile);
    }

    if (filesToProcess.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const MAX_SIZE = 25 * 1024 * 1024; // 25MB por arquivo
    const results = [];

    for (const file of filesToProcess) {
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: `O arquivo "${file.name}" excede o limite máximo permitido de 25MB.` }, { status: 400 });
      }

      const originalName = file.name || 'documento';
      const cleanExt = path.extname(originalName) || '.pdf';
      const baseName = path.basename(originalName, cleanExt)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 50);

      const uniquePrefix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const uniqueFileName = `${uniquePrefix}_${baseName}${cleanExt.toLowerCase()}`;
      const destinationPath = path.join(UPLOAD_DIR, uniqueFileName);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fs.writeFileSync(destinationPath, buffer);

      const anexoUrl = `/api/faturas/anexo?file=${encodeURIComponent(uniqueFileName)}`;

      results.push({
        id: uniquePrefix,
        nome: originalName,
        url: anexoUrl,
        tamanho: file.size,
        tipo: file.type || 'application/pdf',
        data_upload: new Date().toISOString(),
        categoria: categoria === 'comprovante' ? 'comprovante' : 'documento'
      });
    }

    return NextResponse.json({
      success: true,
      anexos: results,
      // Backwards compatibility para uploads de arquivo único
      anexo_nome: results[0].nome,
      anexo_url: results[0].url,
      anexo_tamanho: results[0].tamanho,
      anexo_tipo: results[0].tipo,
      anexo_data_upload: results[0].data_upload
    });
  } catch (error: any) {
    console.error('Erro ao fazer upload de anexo:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar o upload do arquivo.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    ensureUploadDir();
    const url = new URL(request.url);
    const fileName = url.searchParams.get('file');
    const action = url.searchParams.get('action');

    // Estatísticas de armazenamento para o usuário acompanhar o uso
    if (action === 'stats') {
      const files = fs.readdirSync(UPLOAD_DIR).filter(f => !f.startsWith('.'));
      let totalBytes = 0;
      for (const f of files) {
        try {
          const stat = fs.statSync(path.join(UPLOAD_DIR, f));
          totalBytes += stat.size;
        } catch {}
      }
      return NextResponse.json({
        totalFiles: files.length,
        totalBytes,
        totalMB: (totalBytes / (1024 * 1024)).toFixed(2),
        limitFiles: 500
      });
    }

    // Download em Lote (Backup ZIP para o computador do usuário)
    if (action === 'backup_zip') {
      const files = fs.readdirSync(UPLOAD_DIR).filter(f => !f.startsWith('.'));
      if (files.length === 0) {
        return NextResponse.json({ error: 'Nenhum anexo encontrado para backup.' }, { status: 404 });
      }

      const entries = files.map(file => {
        const filePath = path.join(UPLOAD_DIR, file);
        return {
          name: file,
          data: fs.readFileSync(filePath)
        };
      });

      const zipBuffer = createZipBuffer(entries);
      const today = new Date().toISOString().slice(0, 10);

      return new Response(new Uint8Array(zipBuffer), {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="backup_faturas_pcp_${today}.zip"`,
          'Content-Length': zipBuffer.length.toString()
        }
      });
    }

    // Visualização / Download individual do arquivo
    if (fileName) {
      // Prevenir path traversal
      const safeName = path.basename(fileName);
      const filePath = path.join(UPLOAD_DIR, safeName);

      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'Arquivo não encontrado.' }, { status: 404 });
      }

      const fileBuffer = fs.readFileSync(filePath);
      const ext = path.extname(safeName).toLowerCase();

      let contentType = 'application/octet-stream';
      if (ext === '.pdf') contentType = 'application/pdf';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.xml') contentType = 'application/xml';
      else if (ext === '.txt') contentType = 'text/plain';

      return new Response(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${safeName}"`,
          'Content-Length': fileBuffer.length.toString()
        }
      });
    }

    return NextResponse.json({ error: 'Parâmetro inválido.' }, { status: 400 });
  } catch (error: any) {
    console.error('Erro ao ler anexo:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar requisição.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    ensureUploadDir();
    const url = new URL(request.url);
    const fileName = url.searchParams.get('file');
    const action = url.searchParams.get('action');

    // Limpeza total de todos os arquivos de anexos após download de backup
    if (action === 'clear_all') {
      const files = fs.readdirSync(UPLOAD_DIR).filter(f => !f.startsWith('.'));
      let deletedCount = 0;
      let freedBytes = 0;

      for (const file of files) {
        try {
          const filePath = path.join(UPLOAD_DIR, file);
          const stat = fs.statSync(filePath);
          freedBytes += stat.size;
          fs.unlinkSync(filePath);
          deletedCount++;
        } catch (e) {
          console.error(`Erro ao apagar arquivo ${file}:`, e);
        }
      }

      const freedMB = (freedBytes / (1024 * 1024)).toFixed(2);

      return NextResponse.json({
        success: true,
        deletedCount,
        freedBytes,
        freedMB,
        message: `${deletedCount} arquivos excluídos com sucesso. ${freedMB} MB de espaço liberado.`
      });
    }

    // Exclusão individual de arquivo
    if (!fileName) {
      return NextResponse.json({ error: 'Nome do arquivo é obrigatório.' }, { status: 400 });
    }

    const safeName = path.basename(fileName);
    const filePath = path.join(UPLOAD_DIR, safeName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return NextResponse.json({ success: true, message: 'Anexo removido do armazenamento local.' });
  } catch (error: any) {
    console.error('Erro ao excluir anexo:', error);
    return NextResponse.json({ error: error.message || 'Erro ao excluir o arquivo.' }, { status: 500 });
  }
}
