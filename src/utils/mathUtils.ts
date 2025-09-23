import { Operation, MathProblem } from '@/types/math';

export const generateMathProblem = (operation: Operation, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): MathProblem => {
  let operand1: number, operand2: number, answer: number;
  
  const ranges = {
    easy: { min: 1, max: 10 },
    medium: { min: 1, max: 50 },
    hard: { min: 1, max: 100 }
  };
  
  const range = ranges[difficulty];
  
  switch (operation) {
    case 'addition':
      operand1 = Math.floor(Math.random() * range.max) + range.min;
      operand2 = Math.floor(Math.random() * range.max) + range.min;
      answer = operand1 + operand2;
      break;
      
    case 'subtraction':
      operand1 = Math.floor(Math.random() * range.max) + range.min;
      operand2 = Math.floor(Math.random() * operand1) + 1; // Ensure positive result
      answer = operand1 - operand2;
      break;
      
    case 'multiplication':
      operand1 = Math.floor(Math.random() * (range.max / 5)) + range.min;
      operand2 = Math.floor(Math.random() * (range.max / 5)) + range.min;
      answer = operand1 * operand2;
      break;
      
    case 'division':
      // Generate answer first, then create problem to ensure whole number results
      answer = Math.floor(Math.random() * range.max) + range.min;
      operand2 = Math.floor(Math.random() * 9) + 2; // 2-10
      operand1 = answer * operand2;
      break;
      
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    operation,
    operand1,
    operand2,
    answer
  };
};

export const getOperationSymbol = (operation: Operation): string => {
  const symbols = {
    addition: '+',
    subtraction: '−',
    multiplication: '×',
    division: '÷'
  };
  return symbols[operation];
};

export const getOperationName = (operation: Operation): string => {
  const names = {
    addition: 'Addition',
    subtraction: 'Subtraction',
    multiplication: 'Multiplication',
    division: 'Division'
  };
  return names[operation];
};

export const isDailyChallengeDone = (lastCompletedDate: string): boolean => {
  const today = new Date().toDateString();
  return lastCompletedDate === today;
};

export const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
};