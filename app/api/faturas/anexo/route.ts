import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createZipBuffer } from '@/lib/zip';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Diretório temporário seguro para fallback (se suportado pelo ambiente)
const TEMP_UPLOAD_DIR = path.join(os.tmpdir(), 'pcp_uploads_faturas');

function getSafeUploadDir(): string | null {
  try {
    if (!fs.existsSync(TEMP_UPLOAD_DIR)) {
      fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });
    }
    return TEMP_UPLOAD_DIR;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
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

    const MAX_SIZE = 20 * 1024 * 1024; // 20MB por arquivo
    const results = [];

    for (const file of filesToProcess) {
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: `O arquivo "${file.name}" excede o limite máximo permitido de 20MB.` }, { status: 400 });
      }

      const originalName = file.name || 'documento';
      const cleanExt = path.extname(originalName) || '.pdf';
      const mimeType = file.type || 'application/pdf';

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Data = buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Data}`;

      const uniquePrefix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      results.push({
        id: uniquePrefix,
        nome: originalName,
        url: dataUrl,
        tamanho: file.size,
        tipo: mimeType,
        data_upload: new Date().toISOString(),
        categoria: categoria === 'comprovante' ? 'comprovante' : 'documento'
      });
    }

    return NextResponse.json({
      success: true,
      anexos: results,
      anexo_nome: results[0].nome,
      anexo_url: results[0].url,
      anexo_tamanho: results[0].tamanho,
      anexo_tipo: results[0].tipo,
      anexo_data_upload: results[0].data_upload
    });
  } catch (error: any) {
    console.error('Erro ao processar anexo:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar o upload do arquivo.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    // Estatísticas de armazenamento para o usuário acompanhar o uso
    if (action === 'stats') {
      let totalFiles = 0;
      let totalBytes = 0;

      if (supabase) {
        try {
          const { data: faturas } = await supabase.from('faturas').select('id, insumos');
          if (faturas) {
            for (const f of faturas) {
              const meta = (Array.isArray(f.insumos) ? f.insumos : []).find((i: any) => i && i._meta);
              const anexosList = meta?.anexos || (meta?.anexo_url ? [{ url: meta.anexo_url, tamanho: meta.anexo_tamanho }] : []);
              for (const a of anexosList) {
                if (a && a.url) {
                  totalFiles++;
                  totalBytes += (a.tamanho || 150000);
                }
              }
            }
          }
        } catch (e) {
          console.error('Erro ao consultar faturas para stats de anexo:', e);
        }
      }

      return NextResponse.json({
        totalFiles,
        totalBytes,
        totalMB: (totalBytes / (1024 * 1024)).toFixed(2),
        limitFiles: 500
      });
    }

    // Download em Lote (Backup ZIP para o computador do usuário)
    if (action === 'backup_zip') {
      const entries: Array<{ name: string; data: Buffer }> = [];

      if (supabase) {
        try {
          const { data: faturas } = await supabase.from('faturas').select('id, numero_documento, fornecedor, insumos');
          if (faturas) {
            for (const f of faturas) {
              const meta = (Array.isArray(f.insumos) ? f.insumos : []).find((i: any) => i && i._meta);
              const anexosList: any[] = meta?.anexos || (meta?.anexo_url ? [{
                nome: meta.anexo_nome || 'documento.pdf',
                url: meta.anexo_url,
                categoria: 'documento'
              }] : []);

              for (const a of anexosList) {
                if (a && a.url && typeof a.url === 'string') {
                  if (a.url.startsWith('data:')) {
                    const base64Index = a.url.indexOf(';base64,');
                    if (base64Index !== -1) {
                      const base64Data = a.url.substring(base64Index + 8);
                      const fileBuffer = Buffer.from(base64Data, 'base64');
                      const docNum = (f.numero_documento || f.id || 'FAT').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
                      const cat = a.categoria === 'comprovante' ? 'comprovante' : 'doc';
                      const safeName = (a.nome || 'anexo.pdf').replace(/[^a-zA-Z0-9_.-]/g, '_');
                      entries.push({
                        name: `${docNum}_${cat}_${safeName}`,
                        data: fileBuffer
                      });
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error('Erro ao ler anexos do Supabase para zip:', e);
        }
      }

      if (entries.length === 0) {
        return NextResponse.json({ error: 'Nenhum anexo encontrado para backup.' }, { status: 404 });
      }

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

    return NextResponse.json({ error: 'Parâmetro inválido.' }, { status: 400 });
  } catch (error: any) {
    console.error('Erro na API de anexo:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar requisição.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    // Limpeza total de todos os arquivos de anexos após download de backup para liberar espaço no banco
    if (action === 'clear_all') {
      let deletedCount = 0;
      let freedBytes = 0;

      if (supabase) {
        try {
          const { data: faturas } = await supabase.from('faturas').select('id, insumos');
          if (faturas) {
            for (const f of faturas) {
              if (!Array.isArray(f.insumos)) continue;
              const metaIdx = f.insumos.findIndex((i: any) => i && i._meta);
              if (metaIdx !== -1) {
                const meta = f.insumos[metaIdx];
                const hadAnexos = (meta.anexos && meta.anexos.length > 0) || meta.anexo_url;
                if (hadAnexos) {
                  for (const a of (meta.anexos || [])) {
                    deletedCount++;
                    freedBytes += (a.tamanho || 150000);
                  }
                  if (meta.anexo_url && (!meta.anexos || meta.anexos.length === 0)) {
                    deletedCount++;
                    freedBytes += (meta.anexo_tamanho || 150000);
                  }

                  const updatedInsumos = [...f.insumos];
                  updatedInsumos[metaIdx] = {
                    ...meta,
                    anexos: [],
                    anexo_nome: null,
                    anexo_url: null,
                    anexo_tamanho: null,
                    anexo_tipo: null,
                    anexo_data_upload: null
                  };

                  await supabase.from('faturas').update({ insumos: updatedInsumos }).eq('id', f.id);
                }
              }
            }
          }
        } catch (e) {
          console.error('Erro ao limpar anexos no Supabase:', e);
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

    return NextResponse.json({ success: true, message: 'Operação concluída.' });
  } catch (error: any) {
    console.error('Erro ao excluir anexo:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar exclusão.' }, { status: 500 });
  }
}
