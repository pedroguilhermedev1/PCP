export const ADMIN_USERS = [
  'pedro.queiroz',
  'debora.mota',
  'francisco.edson',
];

export const REPORTS_USERS = [
  'ivna.teixeira'
];

export const OPERACIONAL_USERS = [
  'jundiai.arco',
  'nse.arco',
  'psd.arco',
  'coc.arco',
  'fortaleza.arco',
];

export function getUserRole(username?: string) {
  if (!username) return null;

  const normalized = username.trim().toLowerCase();

  if (ADMIN_USERS.includes(normalized)) {
    return 'ADMIN';
  }

  if (OPERACIONAL_USERS.includes(normalized)) {
    return 'OPERACIONAL';
  }

  if (REPORTS_USERS.includes(normalized)) {
    return 'REPORTS';
  }

  return null;
}

export function formatUserName(username?: string): string {
  if (!username) return '';
  const normalized = username.trim().toLowerCase();
  
  if (normalized.includes('pedro')) return 'Pedro';
  if (normalized.includes('edson')) return 'Edson';
  if (normalized.includes('debora')) return 'Débora';
  if (normalized.includes('ivna')) return 'Ivna';
  
  if (normalized === 'jundiai.arco') return 'Jundiaí';
  if (normalized === 'nse.arco') return 'NSE';
  if (normalized === 'psd.arco') return 'PSD';
  if (normalized === 'coc.arco') return 'COC';
  if (normalized === 'fortaleza.arco') return 'Fortaleza';
  
  return username;
}
