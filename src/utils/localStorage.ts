import { UserStats, Operation } from '@/types/math';

const STORAGE_KEY = 'mathTrainingStats';

export const getStoredStats = (): UserStats | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const saveStats = (stats: UserStats): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save stats:', error);
  }
};

export const createInitialStats = (username: string): UserStats => {
  return {
    username,
    dailyChallengeStats: {
      lastCompletedDate: '',
      streak: 0,
      totalCompleted: 0,
      averageScore: 0
    },
    freeRunStats: {
      totalProblems: 0,
      totalCorrect: 0,
      totalTime: 0,
      byOperation: {
        addition: { total: 0, correct: 0, averageTime: 0 },
        subtraction: { total: 0, correct: 0, averageTime: 0 },
        multiplication: { total: 0, correct: 0, averageTime: 0 },
        division: { total: 0, correct: 0, averageTime: 0 }
      }
    },
    overallStats: {
      totalProblemsSolved: 0,
      totalCorrect: 0,
      accuracy: 0,
      averageTimePerProblem: 0
    }
  };
};

export const updateStats = (
  stats: UserStats,
  problems: Array<{ operation: Operation; isCorrect: boolean; timeToSolve: number }>,
  isDailyChallenge: boolean = false
): UserStats => {
  const newStats = { ...stats };
  
  // Update overall stats
  problems.forEach(problem => {
    newStats.overallStats.totalProblemsSolved++;
    if (problem.isCorrect) {
      newStats.overallStats.totalCorrect++;
    }
    
    // Update free run stats
    if (!isDailyChallenge) {
      newStats.freeRunStats.totalProblems++;
      newStats.freeRunStats.totalTime += problem.timeToSolve;
      if (problem.isCorrect) {
        newStats.freeRunStats.totalCorrect++;
      }
      
      const opStats = newStats.freeRunStats.byOperation[problem.operation];
      opStats.total++;
      if (problem.isCorrect) {
        opStats.correct++;
      }
      opStats.averageTime = (opStats.averageTime * (opStats.total - 1) + problem.timeToSolve) / opStats.total;
    }
  });
  
  // Update daily challenge stats
  if (isDailyChallenge) {
    const correctCount = problems.filter(p => p.isCorrect).length;
    const score = (correctCount / problems.length) * 100;
    const today = new Date().toDateString();
    
    newStats.dailyChallengeStats.lastCompletedDate = today;
    newStats.dailyChallengeStats.totalCompleted++;
    
    // Update streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (newStats.dailyChallengeStats.lastCompletedDate === yesterday.toDateString()) {
      newStats.dailyChallengeStats.streak++;
    } else {
      newStats.dailyChallengeStats.streak = 1;
    }
    
    // Update average score
    const prevTotal = newStats.dailyChallengeStats.totalCompleted - 1;
    newStats.dailyChallengeStats.averageScore = 
      (newStats.dailyChallengeStats.averageScore * prevTotal + score) / newStats.dailyChallengeStats.totalCompleted;
  }
  
  // Recalculate accuracy and average time
  newStats.overallStats.accuracy = (newStats.overallStats.totalCorrect / newStats.overallStats.totalProblemsSolved) * 100;
  newStats.overallStats.averageTimePerProblem = newStats.freeRunStats.totalTime / newStats.freeRunStats.totalProblems || 0;
  
  return newStats;
};