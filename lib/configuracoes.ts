import fs from 'fs';
import path from 'path';

export interface CentroDistribuicaoRecord {
  id: string;
  nome: string;
  slug: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CategoriaInsumoRecord {
  id: string;
  nome: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GlobalConfigData {
  cds: CentroDistribuicaoRecord[];
  categorias: CategoriaInsumoRecord[];
}

export const CONFIG_FILE_PATH = path.join(process.cwd(), 'data', 'configuracoes.json');
const CLOUD_STORAGE_KEY = 'SYS_CONFIG_GLOBAL';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';

export const DEFAULT_CDS: CentroDistribuicaoRecord[] = [
  { id: 'cd-fortaleza', nome: 'Fortaleza', slug: 'fortaleza', ativo: true },
  { id: 'cd-jundiai', nome: 'Jundiaí', slug: 'jundiai', ativo: true },
  { id: 'cd-nse', nome: 'NSE', slug: 'nse', ativo: true },
  { id: 'cd-coc', nome: 'COC', slug: 'coc', ativo: true },
  { id: 'cd-psd', nome: 'PSD', slug: 'psd', ativo: true },
  { id: 'cd-curitiba', nome: 'Curitiba', slug: 'curitiba', ativo: true },
  { id: 'cd-raizes', nome: 'Raízes', slug: 'raizes', ativo: true },
  { id: 'cd-ribeirao-preto', nome: 'Ribeirão Preto', slug: 'ribeirao-preto', ativo: true }
];

export const DEFAULT_CATEGORIAS: CategoriaInsumoRecord[] = [
  { id: 'cat-caixa', nome: 'Caixa', ativo: true },
  { id: 'cat-etiquetas', nome: 'Etiquetas', ativo: true },
  { id: 'cat-filme-plastico', nome: 'Filme Plástico', ativo: true },
  { id: 'cat-fita-adesiva', nome: 'Fita Adesiva', ativo: true },
  { id: 'cat-fita-plastica', nome: 'Fita Plástica', ativo: true },
  { id: 'cat-fitilho', nome: 'Fitilho', ativo: true },
  { id: 'cat-geral', nome: 'Geral', ativo: true },
  { id: 'cat-pallet', nome: 'Pallet', ativo: true },
  { id: 'cat-papel-office', nome: 'Papel Office', ativo: true },
  { id: 'cat-protetor', nome: 'Protetor', ativo: true },
  { id: 'cat-ribbon', nome: 'Ribbon', ativo: true }
];

export function readLocalConfig(): GlobalConfigData {
  try {
    if (!fs.existsSync(CONFIG_FILE_PATH)) {
      const dir = path.dirname(CONFIG_FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const initial: GlobalConfigData = {
        cds: DEFAULT_CDS,
        categorias: DEFAULT_CATEGORIAS
      };
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      cds: Array.isArray(parsed.cds) && parsed.cds.length > 0 ? parsed.cds : DEFAULT_CDS,
      categorias: Array.isArray(parsed.categorias) && parsed.categorias.length > 0 ? parsed.categorias : DEFAULT_CATEGORIAS
    };
  } catch (err) {
    console.error('Erro ao ler configuracoes.json:', err);
    return { cds: DEFAULT_CDS, categorias: DEFAULT_CATEGORIAS };
  }
}

export function writeLocalConfig(data: GlobalConfigData): void {
  try {
    const dir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao escrever configuracoes.json:', err);
  }
}

export async function getRemoteConfig(): Promise<GlobalConfigData | null> {
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
    if (!parsed || (!Array.isArray(parsed.cds) && !Array.isArray(parsed.categorias))) return null;
    return {
      cds: Array.isArray(parsed.cds) && parsed.cds.length > 0 ? parsed.cds : DEFAULT_CDS,
      categorias: Array.isArray(parsed.categorias) && parsed.categorias.length > 0 ? parsed.categorias : DEFAULT_CATEGORIAS
    };
  } catch (err) {
    return null;
  }
}

export async function saveRemoteConfig(config: GlobalConfigData): Promise<boolean> {
  try {
    const payload = {
      conta_protheus: CLOUD_STORAGE_KEY,
      desc_conta_protheus: JSON.stringify({
        ...config,
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

export async function getSyncedConfig(): Promise<GlobalConfigData> {
  const local = readLocalConfig();
  const remote = await getRemoteConfig();

  if (remote && ((remote.cds && remote.cds.length > 0) || (remote.categorias && remote.categorias.length > 0))) {
    writeLocalConfig(remote);
    return remote;
  }

  // Se a nuvem não tiver nada, sobe o default / local
  if (local && (local.cds.length > 0 || local.categorias.length > 0)) {
    saveRemoteConfig(local).catch(() => {});
    return local;
  }

  const initial = { cds: DEFAULT_CDS, categorias: DEFAULT_CATEGORIAS };
  writeLocalConfig(initial);
  saveRemoteConfig(initial).catch(() => {});
  return initial;
}

export async function saveSyncedConfig(config: GlobalConfigData): Promise<void> {
  writeLocalConfig(config);
  await saveRemoteConfig(config);
}

