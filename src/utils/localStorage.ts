import { UserStats, Operation, GameMode } from '@/types/math';
import { 
  getStoredRankingData, 
  saveRankingData, 
  calculatePoints, 
  updateStreak, 
  claimDailyBonus, 
  addToSpeedHistory, 
  updateTotalPoints,
  getTodayUTC
} from '@/utils/rankingSystem';

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
  isDailyChallenge: boolean = false,
  gameMode: GameMode = 'freeRun',  // Add gameMode parameter
  isCompleteSession: boolean = true  // Add isCompleteSession parameter
): UserStats => {
  const newStats = { ...stats };
  
  // Calculate session stats
  const totalTime = problems.reduce((sum, problem) => sum + problem.timeToSolve, 0);
  const avgTimePerProblem = problems.length > 0 ? totalTime / problems.length : 0;
  const correctCount = problems.filter(p => p.isCorrect).length;
  const accuracy = problems.length > 0 ? (correctCount / problems.length) * 100 : 0;
  
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
    const score = (correctCount / problems.length) * 100;
    const today = new Date().toDateString();
    
    newStats.dailyChallengeStats.lastCompletedDate = today;
    newStats.dailyChallengeStats.totalCompleted++;
    
    // Update streak - this will be handled by the ranking system
    // Recalculate average score
    const prevTotal = newStats.dailyChallengeStats.totalCompleted - 1;
    newStats.dailyChallengeStats.averageScore = 
      (newStats.dailyChallengeStats.averageScore * prevTotal + score) / newStats.dailyChallengeStats.totalCompleted;
  }
  
  // Recalculate overall accuracy and average time
  newStats.overallStats.accuracy = (newStats.overallStats.totalCorrect / newStats.overallStats.totalProblemsSolved) * 100;
  newStats.overallStats.averageTimePerProblem = newStats.freeRunStats.totalTime / newStats.freeRunStats.totalProblems || 0;
  
  // Calculate points using the new ranking system if needed
  // For now, we'll skip this to prevent any issues
  // We'll call the point calculation separately in the components that need it
  if (isCompleteSession) {
    try {
      // Calculate points using the new ranking system
      const pointsData = calculatePoints(gameMode, problems.length, accuracy, avgTimePerProblem, isCompleteSession);
      
      // Update streak if this is a daily challenge
      if (isDailyChallenge) {
        updateStreak();
      }
      
      // Claim daily bonus if eligible
      if (isCompleteSession) {
        claimDailyBonus();
      }
      
      // Add to speed history
      addToSpeedHistory(gameMode, avgTimePerProblem);
      
      // Update total points
      updateTotalPoints(pointsData.totalPoints);
    } catch (error) {
      console.error("Error in ranking system:", error);
      // Continue without ranking updates in case of errors
    }
  }
  
  return newStats;
};