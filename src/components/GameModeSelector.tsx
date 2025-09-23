import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Plus, Minus, X, Divide } from 'lucide-react';
import { Operation, GameConfig } from '@/types/math';
import { getOperationName } from '@/utils/mathUtils';

interface GameModeSelectorProps {
  onStartGame: (config: GameConfig) => void;
  onBack: () => void;
}

const GameModeSelector = ({ onStartGame, onBack }: GameModeSelectorProps) => {
  const [selectedOperations, setSelectedOperations] = useState<Operation[]>(['addition']);
  const [numberOfProblems, setNumberOfProblems] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const operations: { type: Operation; icon: React.ReactNode; color: string }[] = [
    { type: 'addition', icon: <Plus className="w-4 h-4" />, color: 'text-green-600' },
    { type: 'subtraction', icon: <Minus className="w-4 h-4" />, color: 'text-blue-600' },
    { type: 'multiplication', icon: <X className="w-4 h-4" />, color: 'text-purple-600' },
    { type: 'division', icon: <Divide className="w-4 h-4" />, color: 'text-orange-600' },
  ];

  const problemCounts = [5, 10, 15, 20, 25];
  const difficulties = [
    { level: 'easy' as const, label: 'Easy', description: 'Numbers 1-10' },
    { level: 'medium' as const, label: 'Medium', description: 'Numbers 1-50' },
    { level: 'hard' as const, label: 'Hard', description: 'Numbers 1-100' },
  ];

  const handleOperationToggle = (operation: Operation) => {
    setSelectedOperations(prev => {
      if (prev.includes(operation)) {
        return prev.filter(op => op !== operation);
      } else {
        return [...prev, operation];
      }
    });
  };

  const handleStartGame = () => {
    if (selectedOperations.length > 0) {
      onStartGame({
        operations: selectedOperations,
        numberOfProblems,
        difficulty
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-md mx-auto space-y-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Customize Practice</h1>
            <p className="text-muted-foreground">Set up your training session</p>
          </div>
        </div>

        {/* Operations Selection */}
        <Card className="border-0 shadow-primary">
          <CardHeader>
            <CardTitle>Choose Operations</CardTitle>
            <CardDescription>Select which math operations to practice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {operations.map(({ type, icon, color }) => (
              <div key={type} className="flex items-center space-x-3">
                <Checkbox
                  id={type}
                  checked={selectedOperations.includes(type)}
                  onCheckedChange={() => handleOperationToggle(type)}
                />
                <label
                  htmlFor={type}
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <span className={color}>{icon}</span>
                  <span className="font-medium">{getOperationName(type)}</span>
                </label>
              </div>
            ))}
            {selectedOperations.length === 0 && (
              <p className="text-sm text-error">Please select at least one operation</p>
            )}
          </CardContent>
        </Card>

        {/* Number of Problems */}
        <Card className="border-0 shadow-primary">
          <CardHeader>
            <CardTitle>Number of Problems</CardTitle>
            <CardDescription>How many problems do you want to solve?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {problemCounts.map(count => (
                <Button
                  key={count}
                  variant={numberOfProblems === count ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNumberOfProblems(count)}
                  className="h-12"
                >
                  {count}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Difficulty */}
        <Card className="border-0 shadow-primary">
          <CardHeader>
            <CardTitle>Difficulty Level</CardTitle>
            <CardDescription>Choose the number range for your problems</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {difficulties.map(({ level, label, description }) => (
              <Button
                key={level}
                variant={difficulty === level ? "default" : "outline"}
                className="w-full justify-between h-auto p-4"
                onClick={() => setDifficulty(level)}
              >
                <div className="text-left">
                  <div className="font-medium">{label}</div>
                  <div className="text-xs opacity-70">{description}</div>
                </div>
                {difficulty === level && (
                  <Badge variant="secondary">Selected</Badge>
                )}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Start Button */}
        <Button
          variant="hero"
          size="lg"
          className="w-full"
          onClick={handleStartGame}
          disabled={selectedOperations.length === 0}
        >
          <Play className="w-4 h-4 mr-2" />
          Start Practice Session
        </Button>
      </div>
    </div>
  );
};

export default GameModeSelector;