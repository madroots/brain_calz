import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Zap, Settings, BarChart3, Home, Play } from 'lucide-react';
import { getStoredStats, createInitialStats, saveStats } from '@/utils/localStorage';
import { isDailyChallengeDone } from '@/utils/mathUtils';
import { UserStats, GameConfig } from '@/types/math';
import GameModeSelector from '@/components/GameModeSelector';
import MathGame from '@/components/MathGame';

const Game = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [currentView, setCurrentView] = useState<'menu' | 'dailyChallenge' | 'freeRun' | 'gameMode'>('menu');
  const [freeRunConfig, setFreeRunConfig] = useState<GameConfig | null>(null);
  const username = location.state?.username;

  useEffect(() => {
    if (!username) {
      navigate('/');
      return;
    }

    let stats = getStoredStats();
    if (!stats || stats.username !== username) {
      stats = createInitialStats(username);
      saveStats(stats);
    }
    setUserStats(stats);
  }, [username, navigate]);

  if (!userStats) {
    return <div>Loading...</div>;
  }

  const dailyChallengeCompleted = isDailyChallengeDone(userStats.dailyChallengeStats.lastCompletedDate);

  const handleGameComplete = (updatedStats: UserStats) => {
    setUserStats(updatedStats);
    saveStats(updatedStats);
    setCurrentView('menu');
  };

  if (currentView === 'dailyChallenge') {
    return (
      <MathGame
        gameType="dailyChallenge"
        userStats={userStats}
        onComplete={handleGameComplete}
        onBack={() => setCurrentView('menu')}
      />
    );
  }

  if (currentView === 'gameMode') {
    return (
      <GameModeSelector
        onStartGame={(config) => {
          setFreeRunConfig(config);
          setCurrentView('freeRun');
        }}
        onBack={() => setCurrentView('menu')}
      />
    );
  }

  if (currentView === 'freeRun') {
    return (
      <MathGame
        gameType="freeRun"
        userStats={userStats}
        onComplete={handleGameComplete}
        onBack={() => setCurrentView('menu')}
        gameConfig={freeRunConfig || undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-md mx-auto space-y-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome to Brain Calz!</h1>
            <p className="text-muted-foreground">{userStats.username}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/stats', { state: { userStats } })}
            >
              <BarChart3 className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
            >
              <Home className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <Card className="border-0 shadow-primary">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {userStats.overallStats.totalProblemsSolved}
                </div>
                <div className="text-xs text-muted-foreground">Total Solved</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">
                  {userStats.overallStats.accuracy.toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-warning">
                  {userStats.dailyChallengeStats.streak}
                </div>
                <div className="text-xs text-muted-foreground">Day Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Challenge */}
        <Card className="border-0 shadow-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">Daily Challenge</CardTitle>
              </div>
              {dailyChallengeCompleted ? (
                <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                  Completed
                </Badge>
              ) : (
                <Badge variant="default" className="animate-pulse-glow">
                  Available
                </Badge>
              )}
            </div>
            <CardDescription>
              Complete 5 mental math problems to maintain your streak
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Progress today</span>
              <span>{dailyChallengeCompleted ? '5/5' : '0/5'}</span>
            </div>
            <Progress value={dailyChallengeCompleted ? 100 : 0} className="h-2" />
            <Button 
              variant={dailyChallengeCompleted ? "secondary" : "hero"}
              className="w-full"
              onClick={() => setCurrentView('dailyChallenge')}
              disabled={dailyChallengeCompleted}
            >
              <Play className="w-4 h-4 mr-2" />
              {dailyChallengeCompleted ? 'Challenge Completed' : 'Start Daily Challenge'}
            </Button>
          </CardContent>
        </Card>

        {/* Free Run */}
        <Card className="border-0 shadow-primary">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-warning" />
              <CardTitle className="text-xl">Free Practice</CardTitle>
            </div>
            <CardDescription>
              Choose your operations and practice as much as you want
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="warning"
              className="w-full"
              onClick={() => setCurrentView('gameMode')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Customize & Play
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Game;