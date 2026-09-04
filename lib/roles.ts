export const ADMIN_USERS = [
  'pedro.queiroz', 'felipe.castro', 'debora.mota', 'raphael.ramiro',
  'francisco.edson',
];

export const REPORTS_USERS = [
  'ivna.teixeira'
];

export const OPERACIONAL_USERS = [
  'raphael.farrao',
  'rafael.soares',
  'psd.arco',
  'coc.arco',
  'fabio.pessoa',
  'gabriel.oliveira'
];

export const LIDERANCA_USERS = [
  'lideranca.arco',
  'liderança.arco'
];

export function getUserRole(username?: string) {
  if (!username) return null;

  const normalized = username.trim().toLowerCase();

  if (ADMIN_USERS.includes(normalized)) {
    return 'ADMIN';
  }

  if (REPORTS_USERS.includes(normalized)) {
    return 'REPORTS';
  }

  if (LIDERANCA_USERS.includes(normalized)) {
    return 'LIDERANCA';
  }

  return 'OPERACIONAL';
}

export function formatUserName(username?: string): string {
  if (!username) return '';
  const normalized = username.trim().toLowerCase();
  
  if (normalized === 'pedro.queiroz') return 'Pedro Queiroz';
  if (normalized === 'felipe.castro') return 'Felipe Castro';
  if (normalized === 'debora.mota') return 'Débora Mota';
  if (normalized === 'raphael.ramiro') return 'Raphael Ramiro';
  if (normalized === 'francisco.edson') return 'Francisco Edson';
  if (normalized === 'ivna.teixeira') return 'Ivna Teixeira';
  
  if (normalized === 'raphael.farrao') return 'Raphael Farrão';
  if (normalized === 'rafael.soares') return 'Rafael Soares';
  if (normalized === 'fabio.pessoa') return 'Fábio Pessoa';
  if (normalized === 'gabriel.oliveira') return 'Gabriel Oliveira';

  if (normalized === 'psd.arco') return 'PSD';
  if (normalized === 'coc.arco') return 'COC';
  if (normalized === 'lideranca.arco' || normalized === 'liderança.arco') return 'Liderança Arco';
  
  return username;
}

export function getUserCD(username?: string): string | null {
  if (!username) return null;
  const normalized = username.trim().toLowerCase();
  
  if (['raphael.farrao', 'jundiai.arco'].includes(normalized)) return 'jundiai';
  if (['rafael.soares', 'nse.arco'].includes(normalized)) return 'nse';
  if (['fabio.pessoa', 'gabriel.oliveira', 'fortaleza.arco'].includes(normalized)) return 'fortaleza';
  if (normalized === 'psd.arco') return 'psd';
  if (normalized === 'coc.arco') return 'coc';

  if (normalized.endsWith('.arco')) {
    const prefix = normalized.replace('.arco', '');
    const map: Record<string, string> = {
      jdi: 'jundiai',
      for: 'fortaleza',
      nse: 'nse',
      psd: 'psd',
      coc: 'coc',
      cwb: 'curitiba',
      raizes: 'raizes',
      rpo: 'ribeirao-preto'
    };
    return map[prefix] || prefix;
  }

  return null;
}
