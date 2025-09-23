import { GameMode } from '@/types/math';

// Define the type for our ranking system data in localStorage
export interface RankingData {
  dailyBonus: {
    lastClaimedUTC: string | null;
  };
  speedHistory: {
    [mode in GameMode]?: number[]; // Array of average times for the mode (max 7 entries)
  };
  streak: {
    lastCompletedUTC: string | null;
    currentStreak: number;
  };
  totalPoints: number; // Overall points across all game modes
  pointsHistory: { // Store recent session points for analytics
    date: string; // UTC date string
    points: number;
    mode: GameMode;
  }[];
}

// Default ranking data structure
const DEFAULT_RANKING_DATA: RankingData = {
  dailyBonus: {
    lastClaimedUTC: null,
  },
  speedHistory: {},
  streak: {
    lastCompletedUTC: null,
    currentStreak: 0,
  },
  totalPoints: 0,
  pointsHistory: [],
};

// Key for localStorage
const RANKING_STORAGE_KEY = 'rankingData';

// Retrieve ranking data from localStorage, or initialize with defaults
export const getStoredRankingData = (): RankingData => {
  try {
    const stored = localStorage.getItem(RANKING_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Sanitize the data to prevent cheating
      return sanitizeRankingData(parsed);
    }
    return { ...DEFAULT_RANKING_DATA };
  } catch {
    return { ...DEFAULT_RANKING_DATA };
  }
};

// Save ranking data to localStorage
export const saveRankingData = (data: RankingData): void => {
  try {
    // Sanitize before saving to prevent cheating
    const sanitizedData = sanitizeRankingData(data);
    localStorage.setItem(RANKING_STORAGE_KEY, JSON.stringify(sanitizedData));
  } catch (error) {
    console.error('Failed to save ranking data:', error);
  }
};

// Sanitize ranking data to prevent cheating and invalid values
const sanitizeRankingData = (data: any): RankingData => {
  if (!data || typeof data !== 'object') {
    return { ...DEFAULT_RANKING_DATA };
  }

  // Sanitize streak data
  let currentStreak = parseInt(data.streak?.currentStreak) || 0;
  if (isNaN(currentStreak) || currentStreak < 0) {
    currentStreak = 0;
  } else if (currentStreak > 100) {
    // Prevent unrealistic streaks
    currentStreak = 0; // Reset if suspicious value
  }

  // Sanitize total points
  let totalPoints = parseInt(data.totalPoints) || 0;
  if (isNaN(totalPoints) || totalPoints < 0) {
    totalPoints = 0;
  }

  // Sanitize dates (must be valid date strings or null)
  const lastCompletedUTC = isDateStringValid(data.streak?.lastCompletedUTC) ? data.streak.lastCompletedUTC : null;
  const lastClaimedUTC = isDateStringValid(data.dailyBonus?.lastClaimedUTC) ? data.dailyBonus.lastClaimedUTC : null;

  // Sanitize speed history
  const speedHistory: RankingData['speedHistory'] = {};
  if (data.speedHistory && typeof data.speedHistory === 'object') {
    for (const mode of ['dailyChallenge', 'freeRun', 'multiplicationTable'] as GameMode[]) {
      if (Array.isArray(data.speedHistory[mode])) {
        // Only keep valid times (1 to 60 seconds) and max 7 entries
        const validTimes = data.speedHistory[mode]
          .map((time: any) => parseFloat(time))
          .filter((time: number) => !isNaN(time) && time >= 1 && time <= 60)
          .slice(0, 7);
        
        if (validTimes.length > 0) {
          speedHistory[mode] = validTimes;
        }
      }
    }
  }

  // Sanitize points history (last 30 entries max)
  let pointsHistory: RankingData['pointsHistory'] = [];
  if (Array.isArray(data.pointsHistory)) {
    pointsHistory = data.pointsHistory
      .filter((entry: any) => 
        entry && 
        typeof entry === 'object' && 
        isDateStringValid(entry.date) && 
        typeof entry.points === 'number' && 
        !isNaN(entry.points) && 
        entry.points >= 0 &&
        ['dailyChallenge', 'freeRun', 'multiplicationTable'].includes(entry.mode)
      )
      .slice(0, 30) as RankingData['pointsHistory'];
  }

  return {
    dailyBonus: {
      lastClaimedUTC: lastClaimedUTC,
    },
    speedHistory: speedHistory,
    streak: {
      lastCompletedUTC: lastCompletedUTC,
      currentStreak: currentStreak,
    },
    totalPoints: totalPoints,
    pointsHistory: pointsHistory,
  };
};

// Check if a string is a valid date in YYYY-MM-DD format
const isDateStringValid = (dateString: string | null): boolean => {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }
  
  // Expected format: YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }
  
  // Check if it's a real date
  const date = new Date(dateString);
  return date.toISOString().split('T')[0] === dateString;
};

// Get today's date in UTC as YYYY-MM-DD format
export const getTodayUTC = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Get yesterday's date in UTC as YYYY-MM-DD format
export const getYesterdayUTC = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

// Calculate points based on the new ranking system
export const calculatePoints = (
  gameMode: GameMode,
  problemsSolved: number,
  accuracy: number, // As percentage (0-100)
  avgTimePerProblem: number,
  isCompleteSession: boolean = true // Whether all problems in session were attempted
): {
  basePoints: number;
  accuracyBonus: number;
  speedBonus: number;
  streakMultiplier: number;
  dailyBonus: number;
  totalPoints: number;
} => {
  if (!isCompleteSession) {
    // Incomplete sessions get 0 points
    return {
      basePoints: 0,
      accuracyBonus: 0,
      speedBonus: 0,
      streakMultiplier: 1,
      dailyBonus: 0,
      totalPoints: 0,
    };
  }

  // Base points per problem
  const basePointsPerProblem = {
    dailyChallenge: 12,
    multiplicationTable: 5,
    freeRun: 8,
  }[gameMode];

  const basePoints = problemsSolved * basePointsPerProblem;

  // Accuracy bonus
  let accuracyBonus = 0;
  if (accuracy === 100) {
    accuracyBonus = basePoints * 0.25; // +25%
  } else if (accuracy >= 80 && accuracy < 100) {
    accuracyBonus = basePoints * 0.10; // +10%
  }

  // Subtotal after accuracy
  const subtotal = basePoints + accuracyBonus;

  // Speed bonus calculations
  let speedBonus = 0;
  const rankingData = getStoredRankingData();

  // Check if within threshold (≤ 8s)
  if (avgTimePerProblem <= 8) {
    speedBonus = subtotal * 0.15; // +15%
  } else {
    // Check if faster than 7-day rolling average
    const speedHistory = rankingData.speedHistory[gameMode] || [];
    if (speedHistory.length > 0) {
      const rollingAvg = speedHistory.reduce((sum, time) => sum + time, 0) / speedHistory.length;
      if (avgTimePerProblem < rollingAvg) {
        speedBonus = subtotal * 0.05; // +5% improvement bonus
      }
    }
  }

  // Pre-streak total
  const preStreakTotal = subtotal + speedBonus;

  // Daily bonus - +5 if first session of the day
  const todayUTC = getTodayUTC();
  const dailyBonus = rankingData.dailyBonus.lastClaimedUTC !== todayUTC ? 5 : 0;

  // Streak multiplier - only for Daily Challenge
  let streakMultiplier = 1.0;
  if (gameMode === 'dailyChallenge') {
    streakMultiplier = 1.0 + Math.min((rankingData.streak.currentStreak - 1) * 0.2, 1.0); // Cap at 2.0
  }

  // Calculate final points
  const totalPoints = Math.round((preStreakTotal + dailyBonus) * streakMultiplier);

  return {
    basePoints,
    accuracyBonus,
    speedBonus,
    streakMultiplier,
    dailyBonus,
    totalPoints,
  };
};

// Update streak data based on daily challenge completion
export const updateStreak = (): void => {
  const rankingData = getStoredRankingData();
  const todayUTC = getTodayUTC();
  const yesterdayUTC = getYesterdayUTC();

  // Only update if it's the first time they're completing the daily challenge today
  if (rankingData.streak.lastCompletedUTC !== todayUTC) {
    if (rankingData.streak.lastCompletedUTC === yesterdayUTC) {
      // Continuing streak
      rankingData.streak.currentStreak++;
    } else if (rankingData.streak.lastCompletedUTC === null) {
      // First time playing
      rankingData.streak.currentStreak = 1;
    } else {
      // Streak broken, reset to 1
      rankingData.streak.currentStreak = 1;
    }

    // Cap the streak at 7, which gives a 2.0 multiplier
    rankingData.streak.currentStreak = Math.min(rankingData.streak.currentStreak, 7);
    rankingData.streak.lastCompletedUTC = todayUTC;

    // Sanitize and save
    saveRankingData(rankingData);
  }
};

// Claim daily bonus if eligible
export const claimDailyBonus = (): boolean => {
  const rankingData = getStoredRankingData();
  const todayUTC = getTodayUTC();

  // Check if we can claim the daily bonus
  if (rankingData.dailyBonus.lastClaimedUTC !== todayUTC) {
    rankingData.dailyBonus.lastClaimedUTC = todayUTC;
    saveRankingData(rankingData);
    return true; // Bonus claimed
  }

  return false; // Bonus already claimed today
};

// Add session time to speed history
export const addToSpeedHistory = (gameMode: GameMode, avgTimePerProblem: number): void => {
  // Only record if time is within valid range (1-60 seconds)
  if (avgTimePerProblem < 1 || avgTimePerProblem > 60) {
    return;
  }

  const rankingData = getStoredRankingData();

  if (!rankingData.speedHistory[gameMode]) {
    rankingData.speedHistory[gameMode] = [];
  }

  rankingData.speedHistory[gameMode]?.push(avgTimePerProblem);

  // Keep only the last 7 entries
  if (rankingData.speedHistory[gameMode] && rankingData.speedHistory[gameMode]?.length > 7) {
    rankingData.speedHistory[gameMode] = rankingData.speedHistory[gameMode]?.slice(-7);
  }

  saveRankingData(rankingData);
};

// Update total points
export const updateTotalPoints = (pointsEarned: number): void => {
  const rankingData = getStoredRankingData();
  rankingData.totalPoints += pointsEarned;
  
  // Add to points history
  const todayUTC = getTodayUTC();
  rankingData.pointsHistory.push({
    date: todayUTC,
    points: pointsEarned,
    mode: 'freeRun', // Placeholder - this will be updated properly when calling from game
  });
  
  // Keep only last 30 entries
  if (rankingData.pointsHistory.length > 30) {
    rankingData.pointsHistory = rankingData.pointsHistory.slice(-30);
  }
  
  saveRankingData(rankingData);
};