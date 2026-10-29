import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export const JSON_FILE_PATH = path.join(process.cwd(), 'data', 'usuarios.json');
export const DELETED_USERS_FILE_PATH = path.join(process.cwd(), 'data', 'deleted_users.json');

const SALT = 'pcp_hub_auth_salt_2026';

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

