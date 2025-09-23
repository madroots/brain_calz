import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, X, Trophy, Clock } from 'lucide-react';
import { MathProblem, UserStats, Operation, GameMode } from '@/types/math';
import { generateMathProblem, getOperationSymbol, formatTime, generateMultiplicationTableProblem } from '@/utils/mathUtils';
import { updateStats } from '@/utils/localStorage';

interface MathGameProps {
  gameType: GameMode;
  userStats: UserStats;
  onComplete: (updatedStats: UserStats, gameResults?: any) => void;  // gameResults will contain the full results
  onBack: () => void;
  gameConfig?: {
    operations: Operation[];
    numberOfProblems: number;
    difficulty: 'easy' | 'medium' | 'hard';
  };
}

const MathGame = ({ gameType, userStats, onComplete, onBack, gameConfig }: MathGameProps) => {
  const [problems, setProblems] = useState<MathProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const [problemStartTime, setProblemStartTime] = useState<number>(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate problems on component mount
  useEffect(() => {
    const generateProblems = () => {
      const newProblems: MathProblem[] = [];
      
      if (gameType === 'dailyChallenge') {
        // Daily challenge: mix of all operations, medium difficulty
        const operations: Operation[] = ['addition', 'subtraction', 'multiplication', 'division'];
        for (let i = 0; i < 5; i++) {
          const operation = operations[i % operations.length];
          newProblems.push(generateMathProblem(operation, 'medium'));
        }
      } else if (gameType === 'multiplicationTable') {
        // Multiplication table training: 5 multiplication problems from 1x1 to 10x10
        for (let i = 0; i < 5; i++) {
          newProblems.push(generateMultiplicationTableProblem());
        }
      } else if (gameConfig) {
        // Free run: use selected config
        for (let i = 0; i < gameConfig.numberOfProblems; i++) {
          const randomOperation = gameConfig.operations[Math.floor(Math.random() * gameConfig.operations.length)];
          newProblems.push(generateMathProblem(randomOperation, gameConfig.difficulty));
        }
      }
      
      setProblems(newProblems);
      setGameStartTime(Date.now());
      setProblemStartTime(Date.now());
    };

    generateProblems();
  }, [gameType, gameConfig]);

  // Focus input when problem changes
  useEffect(() => {
    if (inputRef.current && !isCompleted) {
      inputRef.current.focus();
    }
  }, [currentProblemIndex, isCompleted]);

  const currentProblem = problems[currentProblemIndex];
  const progressPercentage = problems.length > 0 ? ((currentProblemIndex) / problems.length) * 100 : 0;

  const handleSubmitAnswer = () => {
    if (!currentProblem || userAnswer.trim() === '') return;

    const submittedAnswer = parseInt(userAnswer.trim());
    const timeToSolve = (Date.now() - problemStartTime) / 1000;
    const isCorrect = submittedAnswer === currentProblem.answer;

    // Update current problem with user's answer
    const updatedProblems = [...problems];
    updatedProblems[currentProblemIndex] = {
      ...currentProblem,
      userAnswer: submittedAnswer,
      isCorrect,
      timeToSolve
    };
    setProblems(updatedProblems);

    // Show result for 1 second
    setShowResult(true);
    
    setTimeout(() => {
      setShowResult(false);
      setUserAnswer('');

      if (currentProblemIndex < problems.length - 1) {
        // Move to next problem
        setCurrentProblemIndex(currentProblemIndex + 1);
        setProblemStartTime(Date.now());
      } else {
        // Game completed
        setIsCompleted(true);
        
        // Update stats
        const completedProblems = updatedProblems.map(p => ({
          operation: p.operation,
          isCorrect: p.isCorrect || false,
          timeToSolve: p.timeToSolve || 0
        }));
        
        const updatedStats = updateStats(userStats, completedProblems, gameType === 'dailyChallenge');
        
        // Prepare game results to pass to parent component
        const gameResults = {
          gameType,
          problems: updatedProblems,
          gameStartTime,
          gameEndTime: Date.now(),
          userStats: updatedStats
        };
        
        // Pass the complete game results to the parent component
        setTimeout(() => {
          onComplete(updatedStats, gameResults);
        }, 1500);
      }
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showResult) {
      handleSubmitAnswer();
    }
  };

  if (!currentProblem && !isCompleted) {
    return <div>Loading...</div>;
  }

  if (isCompleted) {
    const correctAnswers = problems.filter(p => p.isCorrect).length;
    const totalTime = (Date.now() - gameStartTime) / 1000;
    const accuracy = (correctAnswers / problems.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-subtle p-4 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-primary animate-bounce-in">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-success rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Excellent Work!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-success">{correctAnswers}</div>
                <div className="text-xs text-muted-foreground">Correct</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{accuracy.toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-warning">{formatTime(totalTime)}</div>
                <div className="text-xs text-muted-foreground">Time</div>
              </div>
            </div>

            <div className="space-y-2">
              {problems.map((problem, index) => (
                <div key={problem.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">
                    {problem.operand1} {getOperationSymbol(problem.operation)} {problem.operand2}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{problem.userAnswer}</span>
                    {problem.isCorrect ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <X className="w-4 h-4 text-error" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button variant="hero" className="w-full" onClick={onBack}>
              Continue Training
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-md mx-auto space-y-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Badge variant="outline">
            {gameType === 'dailyChallenge' ? 'Daily Challenge' : 
             gameType === 'multiplicationTable' ? 'Multiplication Table' : 
             'Free Practice'}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {formatTime((Date.now() - gameStartTime) / 1000)}
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Problem {currentProblemIndex + 1} of {problems.length}</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        {/* Problem Card */}
        <Card className="border-0 shadow-primary">
          <CardContent className="p-8">
            {showResult ? (
              <div className="text-center animate-bounce-in">
                {problems[currentProblemIndex]?.isCorrect ? (
                  <div className="text-success">
                    <Check className="w-16 h-16 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold">Correct!</h2>
                  </div>
                ) : (
                  <div className="text-error">
                    <X className="w-16 h-16 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold">Incorrect</h2>
                    <p className="text-muted-foreground mt-2">
                      The answer was {currentProblem.answer}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="text-4xl font-bold text-foreground">
                  {currentProblem.operand1} {getOperationSymbol(currentProblem.operation)} {currentProblem.operand2} = ?
                </div>
                
                <div className="space-y-4">
                  <Input
                    ref={inputRef}
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Your answer"
                    className="h-16 text-center text-2xl font-bold"
                    autoFocus
                  />
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={handleSubmitAnswer}
                    disabled={userAnswer.trim() === ''}
                  >
                    Submit Answer
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MathGame;