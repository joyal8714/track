import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DailyCheckin, MonthlyReviewRecord } from '@/types';
import fs from 'fs';
import path from 'path';

// Server-side Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseUrl && supabaseKey) {
    if (!supabaseInstance) {
      supabaseInstance = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }
    return supabaseInstance;
  }
  return null;
}

// Local file-backed database storage fallback for seamless local execution before Supabase keys are pasted
const LOCAL_STORAGE_DIR = path.join(process.cwd(), '.data');
const LOCAL_STORAGE_FILE = path.join(LOCAL_STORAGE_DIR, 'trading_tracker.json');

interface LocalStorageData {
  checkins: DailyCheckin[];
  monthly_reviews: MonthlyReviewRecord[];
}

function ensureLocalStorage(): LocalStorageData {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_STORAGE_FILE)) {
      const initial: LocalStorageData = { checkins: [], monthly_reviews: [] };
      fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const content = fs.readFileSync(LOCAL_STORAGE_FILE, 'utf-8');
    return JSON.parse(content) as LocalStorageData;
  } catch (err) {
    console.error('Local storage read error:', err);
    return { checkins: [], monthly_reviews: [] };
  }
}

function saveLocalStorage(data: LocalStorageData) {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Local storage write error:', err);
  }
}

// ----------------- Check-ins Repository -----------------

export async function getCheckinByDate(date: string): Promise<DailyCheckin | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('checkin_date', date)
      .maybeSingle();

    if (error) {
      console.error('Supabase getCheckinByDate error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    return (data as DailyCheckin) || null;
  }

  // Fallback
  const local = ensureLocalStorage();
  const found = local.checkins.find(c => c.checkin_date === date);
  return found || null;
}

export async function getCheckinById(id: string): Promise<DailyCheckin | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Supabase getCheckinById error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    return (data as DailyCheckin) || null;
  }

  const local = ensureLocalStorage();
  return local.checkins.find(c => c.id === id) || null;
}

export async function getRecentCheckins(limit = 10): Promise<DailyCheckin[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .order('checkin_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Supabase getRecentCheckins error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    return (data as DailyCheckin[]) || [];
  }

  const local = ensureLocalStorage();
  return [...local.checkins]
    .sort((a, b) => b.checkin_date.localeCompare(a.checkin_date))
    .slice(0, limit);
}

export async function getCheckinsForMonth(month: string): Promise<DailyCheckin[]> {
  const supabase = getSupabase();
  const startDate = `${month}-01`;
  const endDate = `${month}-31`;

  if (supabase) {
    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .gte('checkin_date', startDate)
      .lte('checkin_date', endDate)
      .order('checkin_date', { ascending: true });

    if (error) {
      console.error('Supabase getCheckinsForMonth error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    return (data as DailyCheckin[]) || [];
  }

  const local = ensureLocalStorage();
  return local.checkins
    .filter(c => c.checkin_date.startsWith(month))
    .sort((a, b) => a.checkin_date.localeCompare(b.checkin_date));
}

export async function upsertDailyCheckin(
  record: Omit<DailyCheckin, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<DailyCheckin> {
  const supabase = getSupabase();

  if (supabase) {
    const now = new Date().toISOString();
    const payload = {
      ...record,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('daily_checkins')
      .upsert(payload, { onConflict: 'checkin_date' })
      .select()
      .single();

    if (error) {
      console.error('Supabase upsertDailyCheckin error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    return data as DailyCheckin;
  }

  // Local fallback
  const local = ensureLocalStorage();
  const now = new Date().toISOString();
  const existingIndex = local.checkins.findIndex(c => c.checkin_date === record.checkin_date);

  let savedRecord: DailyCheckin;
  if (existingIndex >= 0) {
    savedRecord = {
      ...local.checkins[existingIndex],
      ...record,
      updated_at: now,
    };
    local.checkins[existingIndex] = savedRecord;
  } else {
    savedRecord = {
      ...record,
      id: record.id || `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: now,
      updated_at: now,
    };
    local.checkins.push(savedRecord);
  }

  saveLocalStorage(local);
  return savedRecord;
}

export async function deleteDailyCheckin(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase
      .from('daily_checkins')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase deleteDailyCheckin error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    return true;
  }

  const local = ensureLocalStorage();
  const initialLength = local.checkins.length;
  local.checkins = local.checkins.filter(c => c.id !== id);
  if (local.checkins.length !== initialLength) {
    saveLocalStorage(local);
    return true;
  }
  return false;
}

// ----------------- Monthly Reviews Repository -----------------

export async function getMonthlyReview(month: string): Promise<MonthlyReviewRecord | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from('monthly_reviews')
      .select('*')
      .eq('review_month', month)
      .maybeSingle();

    if (error) {
      console.error('Supabase getMonthlyReview error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    return (data as MonthlyReviewRecord) || null;
  }

  const local = ensureLocalStorage();
  return local.monthly_reviews.find(r => r.review_month === month) || null;
}

export async function upsertMonthlyReview(
  record: Omit<MonthlyReviewRecord, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<MonthlyReviewRecord> {
  const supabase = getSupabase();

  if (supabase) {
    const now = new Date().toISOString();
    const payload = {
      ...record,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('monthly_reviews')
      .upsert(payload, { onConflict: 'review_month' })
      .select()
      .single();

    if (error) {
      console.error('Supabase upsertMonthlyReview error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    return data as MonthlyReviewRecord;
  }

  const local = ensureLocalStorage();
  const now = new Date().toISOString();
  const existingIndex = local.monthly_reviews.findIndex(r => r.review_month === record.review_month);

  let savedRecord: MonthlyReviewRecord;
  if (existingIndex >= 0) {
    savedRecord = {
      ...local.monthly_reviews[existingIndex],
      ...record,
      updated_at: now,
    };
    local.monthly_reviews[existingIndex] = savedRecord;
  } else {
    savedRecord = {
      ...record,
      id: record.id || `local-month-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: now,
      updated_at: now,
    };
    local.monthly_reviews.push(savedRecord);
  }

  saveLocalStorage(local);
  return savedRecord;
}
