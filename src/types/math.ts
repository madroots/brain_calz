export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';

export interface MathProblem {
  id: string;
  operation: Operation;
  operand1: number;
  operand2: number;
  answer: number;
  userAnswer?: number;
  isCorrect?: boolean;
  timeToSolve?: number;
}

export interface GameConfig {
  operations: Operation[];
  numberOfProblems: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface UserStats {
  username: string;
  dailyChallengeStats: {
    lastCompletedDate: string;
    streak: number;
    totalCompleted: number;
    averageScore: number;
  };
  freeRunStats: {
    totalProblems: number;
    totalCorrect: number;
    totalTime: number;
    byOperation: Record<Operation, {
      total: number;
      correct: number;
      averageTime: number;
    }>;
  };
  overallStats: {
    totalProblemsSolved: number;
    totalCorrect: number;
    accuracy: number;
    averageTimePerProblem: number;
  };
}