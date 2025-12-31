// =====================================================
// GAMIFICATION ENGINE - XP, Levels, Badges, Streaks
// =====================================================

export interface LevelInfo {
  level: number;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progress: number; // 0-100 percentage
  title: string;
}

// XP thresholds for each level
export const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 100,
  3: 250,
  4: 450,
  5: 700,
  6: 1000,
  7: 1400,
  8: 1900,
  9: 2500,
  10: 3200,
  // After level 10, each level needs 1000 more XP
};

// Level titles for display
export const LEVEL_TITLES: Record<number, string> = {
  1: 'Newcomer',
  2: 'Apprentice',
  3: 'Helper',
  4: 'Volunteer',
  5: 'Champion',
  6: 'Hero',
  7: 'Guardian',
  8: 'Protector',
  9: 'Legend',
  10: 'Master',
};

/**
 * Calculate level info from total XP
 */
export function calculateLevelInfo(totalXP: number): LevelInfo {
  let level = 1;
  let xpForCurrentLevel = 0;
  let xpForNextLevel = 100;

  // Find current level
  for (let i = 1; i <= 10; i++) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      level = i;
      xpForCurrentLevel = LEVEL_THRESHOLDS[i];
      xpForNextLevel = LEVEL_THRESHOLDS[i + 1] || LEVEL_THRESHOLDS[i] + 1000;
    }
  }

  // Handle levels above 10
  if (totalXP >= 4000) {
    const extraLevels = Math.floor((totalXP - 3200) / 1000);
    level = 10 + extraLevels;
    xpForCurrentLevel = 3200 + (extraLevels * 1000);
    xpForNextLevel = xpForCurrentLevel + 1000;
  }

  const currentXP = totalXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progress = Math.min(100, (currentXP / xpNeeded) * 100);

  const title = LEVEL_TITLES[Math.min(level, 10)] || `Master ${level - 9}`;

  return {
    level,
    currentXP,
    xpForCurrentLevel,
    xpForNextLevel,
    progress,
    title,
  };
}

/**
 * XP rewards for different quest difficulties
 */
export const XP_REWARDS = {
  easy: { min: 15, max: 30 },
  medium: { min: 30, max: 60 },
  hard: { min: 60, max: 100 },
} as const;

/**
 * Streak bonus multipliers
 */
export const STREAK_BONUSES: Record<number, number> = {
  3: 1.1,   // 10% bonus at 3 day streak
  7: 1.25,  // 25% bonus at 7 day streak
  14: 1.5,  // 50% bonus at 14 day streak
  30: 2.0,  // 100% bonus at 30 day streak
};

/**
 * Calculate XP with streak bonus
 */
export function calculateXPWithBonus(baseXP: number, streak: number): number {
  let multiplier = 1;
  
  for (const [days, bonus] of Object.entries(STREAK_BONUSES)) {
    if (streak >= parseInt(days)) {
      multiplier = bonus;
    }
  }
  
  return Math.round(baseXP * multiplier);
}

/**
 * Badge definitions
 */
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: {
    type: 'quests_completed' | 'xp_earned' | 'streak' | 'category_specific';
    value: number;
    category?: string;
  };
}

export const BADGES: BadgeDefinition[] = [
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first quest',
    icon: '🎯',
    rarity: 'common',
    requirement: { type: 'quests_completed', value: 1 },
  },
  {
    id: 'questioner',
    name: 'Questioner',
    description: 'Complete 5 quests',
    icon: '⭐',
    rarity: 'common',
    requirement: { type: 'quests_completed', value: 5 },
  },
  {
    id: 'quest_master',
    name: 'Quest Master',
    description: 'Complete 25 quests',
    icon: '🏆',
    rarity: 'rare',
    requirement: { type: 'quests_completed', value: 25 },
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Complete 100 quests',
    icon: '👑',
    rarity: 'legendary',
    requirement: { type: 'quests_completed', value: 100 },
  },
  {
    id: 'xp_hunter',
    name: 'XP Hunter',
    description: 'Earn 500 XP',
    icon: '💎',
    rarity: 'common',
    requirement: { type: 'xp_earned', value: 500 },
  },
  {
    id: 'xp_champion',
    name: 'XP Champion',
    description: 'Earn 2000 XP',
    icon: '💰',
    rarity: 'rare',
    requirement: { type: 'xp_earned', value: 2000 },
  },
  {
    id: 'on_fire',
    name: 'On Fire',
    description: '3 day streak',
    icon: '🔥',
    rarity: 'common',
    requirement: { type: 'streak', value: 3 },
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: '7 day streak',
    icon: '⚡',
    rarity: 'rare',
    requirement: { type: 'streak', value: 7 },
  },
  {
    id: 'dedicated',
    name: 'Dedicated',
    description: '30 day streak',
    icon: '🌟',
    rarity: 'epic',
    requirement: { type: 'streak', value: 30 },
  },
  {
    id: 'eco_warrior',
    name: 'Eco Warrior',
    description: 'Complete 10 environment quests',
    icon: '🌱',
    rarity: 'rare',
    requirement: { type: 'category_specific', value: 10, category: 'environment' },
  },
  {
    id: 'elder_friend',
    name: 'Elder Friend',
    description: 'Complete 10 elderly care quests',
    icon: '👴',
    rarity: 'rare',
    requirement: { type: 'category_specific', value: 10, category: 'elderly_care' },
  },
  {
    id: 'food_hero',
    name: 'Food Hero',
    description: 'Complete 10 food rescue quests',
    icon: '🍽️',
    rarity: 'rare',
    requirement: { type: 'category_specific', value: 10, category: 'food_rescue' },
  },
];

/**
 * Check which badges user has earned
 */
export function checkEarnedBadges(
  questsCompleted: number,
  totalXP: number,
  currentStreak: number,
  categoryStats: Record<string, number>
): string[] {
  const earnedBadges: string[] = [];

  for (const badge of BADGES) {
    let earned = false;

    switch (badge.requirement.type) {
      case 'quests_completed':
        earned = questsCompleted >= badge.requirement.value;
        break;
      case 'xp_earned':
        earned = totalXP >= badge.requirement.value;
        break;
      case 'streak':
        earned = currentStreak >= badge.requirement.value;
        break;
      case 'category_specific':
        if (badge.requirement.category) {
          earned = (categoryStats[badge.requirement.category] || 0) >= badge.requirement.value;
        }
        break;
    }

    if (earned) {
      earnedBadges.push(badge.id);
    }
  }

  return earnedBadges;
}

/**
 * Get badge by ID
 */
export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGES.find(b => b.id === id);
}

/**
 * Rarity colors for badges
 */
export const RARITY_COLORS = {
  common: 'bg-gray-100 text-gray-700 border-gray-300',
  rare: 'bg-blue-100 text-blue-700 border-blue-300',
  epic: 'bg-purple-100 text-purple-700 border-purple-300',
  legendary: 'bg-yellow-100 text-yellow-700 border-yellow-300',
} as const;

/**
 * Difficulty colors for quests
 */
export const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-orange-100 text-orange-700',
  hard: 'bg-red-100 text-red-700',
} as const;

/**
 * Category colors and icons
 */
export const CATEGORY_CONFIG = {
  environment: {
    color: 'bg-green-500',
    lightColor: 'bg-green-100 text-green-700',
    icon: '🌱',
    label: 'Environment',
  },
  elderly_care: {
    color: 'bg-purple-500',
    lightColor: 'bg-purple-100 text-purple-700',
    icon: '👴',
    label: 'Elderly Care',
  },
  food_rescue: {
    color: 'bg-orange-500',
    lightColor: 'bg-orange-100 text-orange-700',
    icon: '🍽️',
    label: 'Food Rescue',
  },
  education: {
    color: 'bg-blue-500',
    lightColor: 'bg-blue-100 text-blue-700',
    icon: '📚',
    label: 'Education',
  },
  community: {
    color: 'bg-pink-500',
    lightColor: 'bg-pink-100 text-pink-700',
    icon: '🤝',
    label: 'Community',
  },
} as const;
