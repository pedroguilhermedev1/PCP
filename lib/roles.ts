export const ADMIN_USERS = [
  'admin',
];

export const OPERACIONAL_USERS = [
  'operacional',
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
