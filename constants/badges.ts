export type Badge = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  threshold_ml: number; // total necessário para desbloquear
  color: string;
};

export const BADGES: Badge[] = [
  {
    id: 'first_sip',
    title: 'First Sip',
    description: 'You logged your first water intake!',
    emoji: '💧',
    threshold_ml: 1,
    color: '#43C6FF',
  },
  {
    id: 'daily_goal',
    title: 'Daily Hero',
    description: 'You reached your daily goal for the first time!',
    emoji: '🎯',
    threshold_ml: 2000,
    color: '#7B61FF',
  },
  {
    id: 'bucket',
    title: 'Full Bucket',
    description: 'You\'ve drunk a full bucket of water (10L)!',
    emoji: '🪣',
    threshold_ml: 10_000,
    color: '#4D8AF0',
  },
  {
    id: 'bathtub',
    title: 'Bathtub',
    description: 'You\'ve drunk enough to fill a bathtub (150L)!',
    emoji: '🛁',
    threshold_ml: 150_000,
    color: '#00C9A7',
  },
  {
    id: 'elephant',
    title: 'Elephant Memory',
    description: 'You\'ve drunk as much as an elephant drinks in a day (200L)!',
    emoji: '🐘',
    threshold_ml: 200_000,
    color: '#888888',
  },
  {
    id: 'hot_tub',
    title: 'Hot Tub',
    description: 'You\'ve drunk enough to fill a hot tub (1,500L)!',
    emoji: '♨️',
    threshold_ml: 1_500_000,
    color: '#FF6B6B',
  },
  {
    id: 'pool',
    title: 'Semi-Olympic Pool',
    description: 'Incredible! You\'ve drunk a semi-olympic pool (625,000L)!',
    emoji: '🏊',
    threshold_ml: 625_000_000,
    color: '#0099FF',
  },
  {
    id: 'whale',
    title: 'Blue Whale',
    description: 'Legendary! You\'ve drunk the weight of a blue whale in water (150,000L)!',
    emoji: '🐋',
    threshold_ml: 150_000_000,
    color: '#1A1A8C',
  },
];

export function getUnlockedBadges(total_ml: number): Badge[] {
  return BADGES.filter(b => total_ml >= b.threshold_ml);
}

export function getNextBadge(total_ml: number): Badge | null {
  return BADGES.find(b => total_ml < b.threshold_ml) ?? null;
}

export function getProgressToNext(total_ml: number): number {
  const next = getNextBadge(total_ml);
  if (!next) return 100;
  const prev = BADGES.slice().reverse().find(b => total_ml >= b.threshold_ml);
  const prevThreshold = prev?.threshold_ml ?? 0;
  return Math.round(((total_ml - prevThreshold) / (next.threshold_ml - prevThreshold)) * 100);
}