function dataURItoBlob(dataURI: string): { blob: Blob; mime: string } {
  const parts = dataURI.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
  const byteString = atob(parts[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return { blob: new Blob([ab], { type: mime }), mime };
}

function triggerDownload(blob: Blob, fileName: string) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

export function openAnexo(url?: string, nome?: string) {
  if (!url) return;

  const fileName = nome || 'documento';

  // Se for Data URL (base64)
  if (url.startsWith('data:')) {
    try {
      const { blob, mime } = dataURItoBlob(url);
      const blobUrl = URL.createObjectURL(blob);
      const safeTitle = fileName.replace(/</g, '&lt;').replace(/>/g, '&gt;');

      // Abre uma janela em branco e insere o viewer com embed/img
      // Isso contorna a restrição do Chrome que bloqueia top-level navigation direto para blob:/data:
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html lang="pt-BR" style="height:100%;margin:0;padding:0;">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>${safeTitle} - PCP Hub</title>
              <style>
                * { box-sizing: border-box; }
                body, html {
                  height: 100%;
                  width: 100%;
                  margin: 0;
                  padding: 0;
                  background-color: #1e1e24;
                  display: flex;
                  flex-direction: column;
                  overflow: hidden;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                }
                .header-bar {
                  height: 52px;
                  background-color: #141419;
                  color: #f4f4f5;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  padding: 0 20px;
                  border-bottom: 1px solid #27272a;
                  flex-shrink: 0;
                  z-index: 10;
                }
                .doc-info {
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  overflow: hidden;
                }
                .doc-name {
                  font-size: 14px;
                  font-weight: 600;
                  color: #ffffff;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  max-width: 500px;
                }
                .btn-download {
                  display: inline-flex;
                  align-items: center;
                  gap: 6px;
                  background-color: #7c3aed;
                  color: #ffffff;
                  padding: 7px 16px;
                  border-radius: 6px;
                  text-decoration: none;
                  font-size: 13px;
                  font-weight: 600;
                  transition: background 0.15s ease;
                }
                .btn-download:hover {
                  background-color: #6d28d9;
                }
                .viewer-body {
                  flex: 1;
                  width: 100%;
                  height: calc(100% - 52px);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  background-color: #2b2b36;
                  overflow: hidden;
                }
                iframe, embed, object {
                  width: 100%;
                  height: 100%;
                  border: none;
                  background-color: #ffffff;
                }
                img {
                  max-width: 95%;
                  max-height: 95%;
                  object-fit: contain;
                  border-radius: 6px;
                  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
                }
              </style>
            </head>
            <body>
              <div class="header-bar">
                <div class="doc-info">
                  <span style="font-size: 18px;">📄</span>
                  <span class="doc-name">${safeTitle}</span>
                </div>
                <a href="${blobUrl}" download="${safeTitle}" class="btn-download">
                  ⬇ Baixar Documento
                </a>
              </div>
              <div class="viewer-body">
                ${
                  mime.startsWith('image/')
                    ? `<img src="${blobUrl}" alt="${safeTitle}" />`
                    : `<iframe src="${blobUrl}#toolbar=1" type="${mime}"></iframe>`
                }
              </div>
            </body>
          </html>
        `);
        win.document.close();
        return;
      } else {
        // Fallback se popup foi bloqueado pelo navegador
        triggerDownload(blob, fileName);
        return;
      }
    } catch (e) {
      console.error('Erro ao abrir anexo data URI:', e);
    }
  }

  // URL HTTP normal
  window.open(url, '_blank');
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
