import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export const JSON_FILE_PATH = path.join(process.cwd(), 'data', 'usuarios.json');
export const DELETED_USERS_FILE_PATH = path.join(process.cwd(), 'data', 'deleted_users.json');

const SALT = 'pcp_hub_auth_salt_2026';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const CLOUD_STORAGE_KEY = 'SYS_AUTH_USERS';

/**
 * Cria hash SHA-256 com salt fixo do sistema
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + SALT).digest('hex');
}

/**
 * Valida a senha contra o hash armazenado
 */
export function verifyPassword(password: string, hash: string): boolean {
  if (!password || !hash) return false;
  return hashPassword(password) === hash;
}

export interface UserRecord {
  id: string;
  username: string;
  nome_completo: string | null;
  role: 'SUPERADMIN' | 'ADMIN' | 'LIDERANCA' | 'OPERACIONAL' | 'REPORTS';
  cd_slug: string | null;
  ativo: boolean;
  password_hash?: string;
  created_at?: string;
  updated_at?: string;
}

export function readDeletedUsers(): string[] {
  try {
    if (!fs.existsSync(DELETED_USERS_FILE_PATH)) return [];
    const raw = fs.readFileSync(DELETED_USERS_FILE_PATH, 'utf8');
    return JSON.parse(raw) || [];
  } catch (err) {
    return [];
  }
}

export function markUserDeleted(username: string): void {
  try {
    const list = readDeletedUsers();
    const clean = username.toLowerCase().trim();
    if (!list.includes(clean)) {
      list.push(clean);
      const dir = path.dirname(DELETED_USERS_FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DELETED_USERS_FILE_PATH, JSON.stringify(list, null, 2), 'utf8');
    }
  } catch (err) {
    console.error('Erro ao salvar deleted_users.json:', err);
  }
}

export function unmarkUserDeleted(username: string): void {
  try {
    const list = readDeletedUsers();
    const clean = username.toLowerCase().trim();
    const filtered = list.filter(u => u !== clean);
    const dir = path.dirname(DELETED_USERS_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DELETED_USERS_FILE_PATH, JSON.stringify(filtered, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao atualizar deleted_users.json:', err);
  }
}

export function readLocalUsers(): UserRecord[] {
  try {
    if (!fs.existsSync(JSON_FILE_PATH)) {
      const dir = path.dirname(JSON_FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(JSON_FILE_PATH, JSON.stringify([], null, 2), 'utf8');
      return [];
    }
    const raw = fs.readFileSync(JSON_FILE_PATH, 'utf8');
    return JSON.parse(raw) || [];
  } catch (err) {
    console.error('Erro ao ler usuarios.json:', err);
    return [];
  }
}

export function writeLocalUsers(users: UserRecord[]): void {
  try {
    const dir = path.dirname(JSON_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao salvar usuarios.json:', err);
  }
}

/**
 * Consulta a nuvem Supabase (persistente em serverless e localhost)
 */
export async function getRemoteAuthData(): Promise<{ users: UserRecord[]; deleted: string[] } | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/contas_protheus?conta_protheus=eq.${CLOUD_STORAGE_KEY}&select=desc_conta_protheus`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0 || !data[0].desc_conta_protheus) return null;
    const parsed = JSON.parse(data[0].desc_conta_protheus);
    if (!parsed || !Array.isArray(parsed.users)) return null;
    return {
      users: parsed.users,
      deleted: Array.isArray(parsed.deleted) ? parsed.deleted : []
    };
  } catch (err) {
    return null;
  }
}

/**
 * Salva na nuvem Supabase garantindo persistência no Vercel e local
 */
export async function saveRemoteAuthData(users: UserRecord[], deleted: string[]): Promise<boolean> {
  try {
    const payload = {
      conta_protheus: CLOUD_STORAGE_KEY,
      desc_conta_protheus: JSON.stringify({
        users,
        deleted,
        updated_at: new Date().toISOString()
      })
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/contas_protheus`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(payload)
    });

    return res.ok;
  } catch (err) {
    return false;
  }
}

/**
 * Retorna usuários sincronizados com a nuvem e fallback local
 */
export async function getSyncedUsers(): Promise<{ users: UserRecord[]; deleted: string[] }> {
  const localUsers = readLocalUsers();
  const localDeleted = readDeletedUsers();

  const remote = await getRemoteAuthData();
  if (remote && Array.isArray(remote.users) && remote.users.length > 0) {
    writeLocalUsers(remote.users);
    try {
      const dir = path.dirname(DELETED_USERS_FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DELETED_USERS_FILE_PATH, JSON.stringify(remote.deleted || [], null, 2), 'utf8');
    } catch {}
    return remote;
  }

  if (localUsers.length > 0) {
    saveRemoteAuthData(localUsers, localDeleted).catch(() => {});
  }

  return { users: localUsers, deleted: localDeleted };
}

/**
 * Salva usuários tanto no arquivo local quanto na nuvem Supabase
 */
export async function saveSyncedUsers(users: UserRecord[], deleted: string[]): Promise<void> {
  writeLocalUsers(users);
  try {
    const dir = path.dirname(DELETED_USERS_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DELETED_USERS_FILE_PATH, JSON.stringify(deleted, null, 2), 'utf8');
  } catch {}
  await saveRemoteAuthData(users, deleted);
}
