export const ADMIN_USERS = [
  'pedro.queiroz', 'vando.sousa', 'debora.mota', 'raphael.ramiro', 'francisco.edson', 'lideranca.arco',
];

export const REPORTS_USERS: string[] = [];

export const OPERACIONAL_USERS = [
  'raphael.farrao',
  'rafael.soares',
  'psd.arco',
  'coc.arco',
  'fabio.pessoa',
  'gabriel.oliveira',
  'pol.araruna'
];

export const LIDERANCA_USERS = [
  'lideranca.arco',
  'liderança.arco'
];

export function getUserRole(username?: string) {
  if (!username) return null;

  const normalized = username.trim().toLowerCase();

  // Suporte a role dinâmica via banco / login
  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('pcp_user');
    const storedRole = localStorage.getItem('pcp_role');
    if (storedUser && storedUser.trim().toLowerCase() === normalized && storedRole) {
      return storedRole;
    }
  }

  if (normalized === 'pedro.queiroz') return 'SUPERADMIN';

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

  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('pcp_user');
    const storedName = localStorage.getItem('pcp_name');
    if (storedUser && storedUser.trim().toLowerCase() === normalized && storedName) {
      return storedName;
    }
  }
  
  if (normalized === 'pedro.queiroz') return 'Pedro Queiroz';
  if (normalized === 'felipe.castro') return 'Felipe Castro';
  if (normalized === 'vando.sousa') return 'Vando Sousa';
  if (normalized === 'debora.mota') return 'Débora Mota';
  if (normalized === 'raphael.ramiro') return 'Raphael Ramiro';
  if (normalized === 'francisco.edson') return 'Francisco Edson';
  
  if (normalized === 'raphael.farrao') return 'Raphael Farrão';
  if (normalized === 'rafael.soares') return 'Rafael Soares';
  if (normalized === 'fabio.pessoa') return 'Fábio Pessoa';
  if (normalized === 'gabriel.oliveira') return 'Gabriel Oliveira';
  if (normalized === 'pol.araruna') return 'Pol Araruna';

  if (normalized === 'psd.arco') return 'PSD';
  if (normalized === 'coc.arco') return 'COC';
  if (normalized === 'lideranca.arco' || normalized === 'liderança.arco') return 'Liderança Arco';
  
  if (username.includes('.')) {
    return username.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
  }

  return username;
}

export function getUserCD(username?: string): string | null {
  if (!username) return null;

  const normalized = username.trim().toLowerCase();

  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('pcp_user');
    const storedCD = localStorage.getItem('pcp_cd');
    if (storedUser && storedUser.trim().toLowerCase() === normalized && storedCD) {
      return storedCD;
    }
  }
  
  if (['raphael.farrao', 'jundiai.arco'].includes(normalized)) return 'jundiai';
  if (['rafael.soares', 'nse.arco'].includes(normalized)) return 'nse';
  if (['fabio.pessoa', 'gabriel.oliveira', 'pol.araruna', 'fortaleza.arco'].includes(normalized)) return 'fortaleza';
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
