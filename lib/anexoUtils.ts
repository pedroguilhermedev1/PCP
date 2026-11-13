export function openAnexo(url?: string, nome?: string) {
  if (!url) return;

  if (url.startsWith('data:')) {
    try {
      const parts = url.split(',');
      if (parts.length === 2) {
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
        const byteCharacters = atob(parts[1]);
        const byteArrays = [];
        const sliceSize = 512;

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
          const slice = byteCharacters.slice(offset, offset + sliceSize);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          byteArrays.push(new Uint8Array(byteNumbers));
        }

        const blob = new Blob(byteArrays, { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        const win = window.open(blobUrl, '_blank');
        if (!win) {
          const a = document.createElement('a');
          a.href = blobUrl;
          a.target = '_blank';
          if (nome) a.download = nome;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        return;
      }
    } catch (e) {
      console.error('Erro ao converter data URL para blob:', e);
    }
  }

  window.open(url, '_blank');
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
