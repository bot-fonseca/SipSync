import { supabase } from './supabase';

// --- TIPOS ---
export type WaterLog = {
  id: string;
  amount_ml: number;
  logged_at: string;
};

export type UserSettings = {
  daily_target_ml: number;
  use_metric: boolean;
  bottle_size_ml: number;
  alarm_config: any;
};

// ─────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────

export async function getSettings(): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .single();

  if (error) return null;
  return data;
}

export async function upsertSettings(settings: Partial<UserSettings>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('user_settings')
    .upsert({ user_id: user.id, ...settings }, { onConflict: 'user_id' });
}

// ─────────────────────────────────────────
// WATER LOGS — HOJE
// ─────────────────────────────────────────

export async function getTodayLogs(): Promise<WaterLog[]> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('water_logs')
    .select('id, amount_ml, logged_at')
    .gte('logged_at', todayStart.toISOString())
    .order('logged_at', { ascending: true });

  if (error) return [];
  return data ?? [];
}

export async function getTodayTotal(): Promise<number> {
  const logs = await getTodayLogs();
  return logs.reduce((sum, log) => sum + log.amount_ml, 0);
}

export async function addWaterLog(amount_ml: number): Promise<WaterLog | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('water_logs')
    .insert({ user_id: user.id, amount_ml })
    .select()
    .single();

  if (error) return null;
  return data;
}

export async function deleteLastLog(): Promise<boolean> {
  const logs = await getTodayLogs();
  if (logs.length === 0) return false;

  const lastLog = logs[logs.length - 1];
  const { error } = await supabase
    .from('water_logs')
    .delete()
    .eq('id', lastLog.id);

  return !error;
}

// ─────────────────────────────────────────
// WATER LOGS — HISTÓRICO (últimos 7 dias)
// ─────────────────────────────────────────

export type DayData = {
  day: string;    // "Mon", "Tue", etc.
  date: string;   // "2025-04-20"
  amount_ml: number;
};

export async function getWeeklyHistory(): Promise<DayData[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('water_logs')
    .select('amount_ml, logged_at')
    .gte('logged_at', sevenDaysAgo.toISOString());

  if (error || !data) return [];

  // Agrupa por dia
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const grouped: Record<string, number> = {};

  data.forEach(log => {
    const date = new Date(log.logged_at);
    const dateStr = date.toISOString().split('T')[0];
    grouped[dateStr] = (grouped[dateStr] ?? 0) + log.amount_ml;
  });

  // Preenche os 7 dias (incluindo dias sem dados)
  const result: DayData[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    result.push({
      day: dayNames[d.getDay()],
      date: dateStr,
      amount_ml: grouped[dateStr] ?? 0,
    });
  }

  return result;
}

// ─────────────────────────────────────────
// UTILITÁRIOS DE CONVERSÃO
// ─────────────────────────────────────────

export function mlToOz(ml: number): number {
  return Math.round(ml / 29.5735);
}

export function ozToMl(oz: number): number {
  return Math.round(oz * 29.5735);
}

export function convertAmount(amount_ml: number, useMetric: boolean): number {
  return useMetric ? amount_ml : mlToOz(amount_ml);
}

export async function addToTotalWater(amount_ml: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Busca o total atual e soma
  const { data } = await supabase
    .from('user_settings')
    .select('total_water_ml')
    .eq('user_id', user.id)
    .single();

  const currentTotal = data?.total_water_ml ?? 0;
  await supabase
    .from('user_settings')
    .update({ total_water_ml: currentTotal + amount_ml })
    .eq('user_id', user.id);
}

export async function getTotalWater(): Promise<number> {
  const { data } = await supabase
    .from('user_settings')
    .select('total_water_ml')
    .single();

  return data?.total_water_ml ?? 0;
}

