import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Clock, Star, Target, BarChart3, Zap, Calendar } from 'lucide-react';
import { MathProblem, GameMode } from '@/types/math';
import { formatTime, getOperationSymbol, getOperationName } from '@/utils/mathUtils';

interface GameResults {
  gameType: GameMode;
  problems: MathProblem[];
  gameStartTime: number;
  gameEndTime: number;
  userStats: any; // Placeholder for user stats
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const results = location.state as GameResults | null;
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Get the confetti canvas ref
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);

  if (!results) {
    navigate('/game');
    return null;
  }

  // Calculate stats
  const { gameType, problems, gameStartTime, gameEndTime } = results;
  const totalProblems = problems.length;
  const correctAnswers = problems.filter(p => p.isCorrect).length;
  const accuracy = totalProblems > 0 ? (correctAnswers / totalProblems) * 100 : 0;
  const totalTime = (gameEndTime - gameStartTime) / 1000; // in seconds
  const averageTimePerProblem = totalProblems > 0 ? totalTime / totalProblems : 0;

  // Determine if we should show confetti (80%+ accuracy)
  useEffect(() => {
    if (accuracy >= 80) {
      setShowConfetti(true);
      // Initialize confetti
      initConfetti();
    }
  }, [accuracy]);

  // Confetti effect
  const initConfetti = () => {
    if (typeof window !== 'undefined' && showConfetti) {
      import('canvas-confetti').then(confettiModule => {
        const confetti = confettiModule.default;
        if (confetti) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff5722', '#4caf50', '#2196f3', '#ff9800', '#9c27b0']
          });
        }
      }).catch(error => {
        console.error('Failed to load canvas-confetti:', error);
      });
    }
  };

  // Format game type for display
  const getGameTypeDisplay = (type: GameMode): string => {
    switch (type) {
      case 'dailyChallenge':
        return 'Daily Challenge';
      case 'multiplicationTable':
        return 'Multiplication Table';
      case 'freeRun':
        return 'Free Practice';
      default:
        return 'Game Mode';
    }
  };

  // Get game-specific stats as separate functions to avoid JSX in object literals
  const getGameTitle = (type: GameMode): string => {
    switch (type) {
      case 'dailyChallenge':
        return 'Daily Challenge Complete!';
      case 'multiplicationTable':
        return 'Multiplication Master!';
      default:
        return 'Practice Session Complete!';
    }
  };

  const getGameDescription = (type: GameMode): string => {
    switch (type) {
      case 'dailyChallenge':
        return 'Great job maintaining your streak!';
      case 'multiplicationTable':
        return "You're getting better at multiplication!";
      default:
        return 'Keep up the good work!';
    }
  };

  const getGameIcon = (type: GameMode) => {
    switch (type) {
      case 'dailyChallenge':
        return <Trophy className="w-8 h-8 text-white" />;
      case 'multiplicationTable':
        return <Star className="w-8 h-8 text-white" />;
      default:
        return <BarChart3 className="w-8 h-8 text-white" />;
    }
  };

  const getGameBgGradient = (type: GameMode): string => {
    switch (type) {
      case 'dailyChallenge':
        return 'bg-gradient-success';
      case 'multiplicationTable':
        return 'bg-gradient-warning';
      default:
        return 'bg-gradient-primary';
    }
  };

  const gameTitle = getGameTitle(gameType);
  const gameDescription = getGameDescription(gameType);
  const gameIcon = getGameIcon(gameType);
  const gameBgGradient = getGameBgGradient(gameType);

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 flex items-center justify-center relative overflow-hidden">
      {/* Confetti Canvas - appears only when needed */}
      {showConfetti && (
        <canvas 
          ref={confettiCanvasRef} 
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
        />
      )}

      <div className="w-full max-w-md space-y-6 animate-bounce-in z-20 relative">
        {/* Header */}
        <div className="text-center">
          <div className={`mx-auto w-16 h-16 ${gameBgGradient} rounded-full flex items-center justify-center mb-4`}>
            {gameIcon}
          </div>
          <h1 className="text-2xl font-bold">{gameTitle}</h1>
          <p className="text-muted-foreground">{gameDescription}</p>
          <p className="text-muted-foreground">Results for {getGameTypeDisplay(gameType)}</p>
        </div>

        {/* Overall Stats */}
        <Card className="border-0 shadow-primary">
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <div className="text-xs text-muted-foreground">Total Time</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Accuracy</span>
                <span className="font-medium">{accuracy.toFixed(0)}%</span>
              </div>
              <Progress value={accuracy} className="h-2" />
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warning" />
                  <span className="text-sm">Avg. Time</span>
                </div>
                <span className="font-medium">{formatTime(averageTimePerProblem)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ranking and Points Placeholder */}
        <Card className="border-0 shadow-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gradient-primary rounded-lg">
                <div className="text-xl font-bold text-white">N/A</div>
                <div className="text-xs text-white/80">Rank</div>
              </div>
              <div className="text-center p-4 bg-gradient-warning rounded-lg">
                <div className="text-xl font-bold text-white">0</div>
                <div className="text-xs text-white/80">Points</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Problem Breakdown */}
        <Card className="border-0 shadow-primary">
          <CardHeader>
            <CardTitle>Problem Breakdown</CardTitle>
            <CardDescription>Detailed results for each problem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-80 overflow-y-auto">
            {problems.map((problem, index) => (
              <div 
                key={problem.id} 
                className={`p-3 rounded-lg flex items-center justify-between ${
                  problem.isCorrect ? 'bg-success/10 border border-success/20' : 'bg-error/10 border border-error/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    problem.isCorrect ? 'bg-success text-white' : 'bg-error text-white'
                  }`}>
                    {problem.isCorrect ? '✓' : '✗'}
                  </div>
                  <div>
                    <div className="font-mono">
                      {problem.operand1} {getOperationSymbol(problem.operation)} {problem.operand2} = ?
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Your answer: {problem.userAnswer} | Correct: {problem.answer}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {problem.timeToSolve ? formatTime(problem.timeToSolve) : '--'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getOperationName(problem.operation)}
                  </div>
                </div>
              </div>
            ))}
            
            {problems.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No problems to display
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => navigate('/game')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Main Menu
          </Button>
          
          <Button 
            variant="hero" 
            className="flex-1"
            onClick={() => navigate('/game', { state: { currentView: gameType } })}
          >
            Play Again
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Results;