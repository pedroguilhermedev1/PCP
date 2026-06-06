export const ADMIN_USERS = [
  'pedro.queiroz',
  'debora.mota',
  'francisco.edson',
];

export const OPERACIONAL_USERS = [
  'user01.arco',
  'user02.arco',
  'user03.arco',
  'user04.arco',
  'user05.arco',
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

  return null;
}
