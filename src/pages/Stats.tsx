import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Target, Clock, Flame, Plus, Minus, X, Divide, Star } from 'lucide-react';
import { UserStats, Operation } from '@/types/math';
import { formatTime, getOperationName } from '@/utils/mathUtils';
import { getStoredRankingData } from '@/utils/rankingSystem';

const Stats = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userStats: UserStats = location.state?.userStats;

  if (!userStats) {
    navigate('/');
    return null;
  }

  const operationIcons = {
    addition: <Plus className="w-4 h-4" />,
    subtraction: <Minus className="w-4 h-4" />,
    multiplication: <X className="w-4 h-4" />,
    division: <Divide className="w-4 h-4" />
  };

  const operationColors = {
    addition: 'text-green-600',
    subtraction: 'text-blue-600',
    multiplication: 'text-purple-600',
    division: 'text-orange-600'
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-md mx-auto space-y-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Your Stats</h1>
            <p className="text-muted-foreground">{userStats.username}</p>
          </div>
        </div>

        {/* Overall Stats */}
        <Card className="border-0 shadow-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Overall Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {userStats.overallStats.totalProblemsSolved}
                </div>
                <div className="text-xs text-muted-foreground">Problems Solved</div>
              </div>
              <div className="text-center p-4 bg-success/5 rounded-lg">
                <div className="text-2xl font-bold text-success">
                  {userStats.overallStats.totalCorrect}
                </div>
                <div className="text-xs text-muted-foreground">Correct Answers</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Accuracy</span>
                <span className="font-medium">{userStats.overallStats.accuracy.toFixed(1)}%</span>
              </div>
              <Progress value={userStats.overallStats.accuracy} className="h-2" />
            </div>

            {userStats.overallStats.averageTimePerProblem > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warning" />
                  <span className="text-sm">Average Time</span>
                </div>
                <span className="font-medium">
                  {formatTime(userStats.overallStats.averageTimePerProblem)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Challenge Stats */}
        <Card className="border-0 shadow-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warning" />
              Daily Challenge
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-warning">
                  {userStats.dailyChallengeStats.streak}
                </div>
                <div className="text-xs text-muted-foreground">Current Streak</div>
              </div>
              <div>
                <div className="text-xl font-bold text-primary">
                  {userStats.dailyChallengeStats.totalCompleted}
                </div>
                <div className="text-xs text-muted-foreground">Total Completed</div>
              </div>
              <div>
                <div className="text-xl font-bold text-success">
                  {userStats.dailyChallengeStats.averageScore.toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">Average Score</div>
              </div>
            </div>

            {userStats.dailyChallengeStats.streak > 0 && (
              <div className="flex items-center justify-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <Flame className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium">
                  {userStats.dailyChallengeStats.streak} day streak! Keep it up! 🔥
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Free Run Stats */}
        <Card className="border-0 shadow-primary">
          <CardHeader>
            <CardTitle>Free Practice Stats</CardTitle>
            <CardDescription>
              Your performance in practice sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-primary/5 rounded-lg">
                <div className="text-lg font-bold text-primary">
                  {userStats.freeRunStats.totalProblems}
                </div>
                <div className="text-xs text-muted-foreground">Problems</div>
              </div>
              <div className="p-3 bg-success/5 rounded-lg">
                <div className="text-lg font-bold text-success">
                  {userStats.freeRunStats.totalCorrect}
                </div>
                <div className="text-xs text-muted-foreground">Correct</div>
              </div>
            </div>

            {userStats.freeRunStats.totalProblems > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Free Run Accuracy</span>
                  <span className="font-medium">
                    {((userStats.freeRunStats.totalCorrect / userStats.freeRunStats.totalProblems) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={(userStats.freeRunStats.totalCorrect / userStats.freeRunStats.totalProblems) * 100} 
                  className="h-2" 
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Operation Breakdown */}
        <Card className="border-0 shadow-primary">
          <CardHeader>
            <CardTitle>Operation Breakdown</CardTitle>
            <CardDescription>Your performance by operation type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.entries(userStats.freeRunStats.byOperation) as [Operation, any][])
              .filter(([_, stats]) => stats.total > 0)
              .map(([operation, stats]) => (
                <div key={operation} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={operationColors[operation]}>
                        {operationIcons[operation]}
                      </span>
                      <span className="font-medium">{getOperationName(operation)}</span>
                    </div>
                    <Badge variant="outline">
                      {stats.correct}/{stats.total}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Accuracy</span>
                      <span>{((stats.correct / stats.total) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={(stats.correct / stats.total) * 100} className="h-1" />
                    {stats.averageTime > 0 && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Avg. Time</span>
                        <span>{formatTime(stats.averageTime)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            
            {Object.values(userStats.freeRunStats.byOperation).every(stats => stats.total === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Start practicing to see your operation stats!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ranking Stats */}
        <Card className="border-0 shadow-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-600" />
              Your Ranking
            </CardTitle>
            <CardDescription>
              Your rank and total points earned
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gradient-primary rounded-lg">
                {(() => {
                  const rankingData = getStoredRankingData();
                  let rank = 'N/A';
                  
                  if (rankingData.totalPoints >= 2000) {
                    rank = 'Diamond';
                  } else if (rankingData.totalPoints >= 1000) {
                    rank = 'Platinum';
                  } else if (rankingData.totalPoints >= 500) {
                    rank = 'Gold';
                  } else if (rankingData.totalPoints >= 100) {
                    rank = 'Silver';
                  } else {
                    rank = 'Bronze';
                  }
                  
                  return (
                    <>
                      <div className="text-xl font-bold text-white">{rank}</div>
                      <div className="text-xs text-white/80">Rank</div>
                    </>
                  );
                })()}
              </div>
              <div className="text-center p-4 bg-gradient-warning rounded-lg">
                {(() => {
                  const rankingData = getStoredRankingData();
                  return (
                    <>
                      <div className="text-xl font-bold text-white">{rankingData.totalPoints}</div>
                      <div className="text-xs text-white/80">Total Points</div>
                    </>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Game Button */}
        <Button 
          variant="hero" 
          className="w-full" 
          onClick={() => navigate('/game', { state: { username: userStats.username } })}
        >
          Back to Training
        </Button>
      </div>
    </div>
  );
};

export default Stats;