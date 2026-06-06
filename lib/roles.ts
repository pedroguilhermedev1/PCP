export const OPERATIONAL_USERS = [
  'admin',
  'operacional',
];

export function getUserRole() {
  if (typeof window === 'undefined') return null;

  const user = localStorage.getItem('pcp_user');

  if (!user) return null;

  try {
    const parsedUser = JSON.parse(user);
    return parsedUser.role || 'admin';
  } catch {
    return 'admin';
  }
}
