import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Trophy, Zap } from 'lucide-react';
import { getStoredStats } from '@/utils/localStorage';

const Home = () => {
  const [username, setUsername] = useState('');
  const [existingUser, setExistingUser] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stats = getStoredStats();
    if (stats) {
      setExistingUser(stats.username);
    }
  }, []);

  const handleLogin = () => {
    if (username.trim()) {
      navigate('/game', { state: { username: username.trim() } });
    }
  };

  const handleContinue = () => {
    if (existingUser) {
      navigate('/game', { state: { username: existingUser } });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-bounce-in">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-hero rounded-full flex items-center justify-center shadow-glow animate-pulse-glow">
            <Calculator className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Brain Calz
          </h1>
          <p className="text-muted-foreground text-lg">
            Train your mental math skills with daily challenges and free practice!
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-primary">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome!</CardTitle>
            <CardDescription>
              Enter your username to start your Brain Calz journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {existingUser && (
              <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                <div className="flex items-center gap-2 text-success">
                  <Trophy className="w-4 h-4" />
                  <span className="font-medium">Welcome back, {existingUser}!</span>
                </div>
                <Button 
                  variant="success" 
                  className="w-full mt-3" 
                  onClick={handleContinue}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Continue Training
                </Button>
              </div>
            )}

            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-12 text-center text-lg"
                maxLength={20}
              />
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full" 
                onClick={handleLogin}
                disabled={!username.trim()}
              >
                Start Training
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              No password required • Your progress is saved locally
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 bg-primary/5 border-primary/10">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-sm font-medium">Daily Challenge</div>
              <div className="text-xs text-muted-foreground">5 problems daily</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-warning/5 border-warning/10">
            <CardContent className="p-4 text-center">
              <Zap className="w-8 h-8 text-warning mx-auto mb-2" />
              <div className="text-sm font-medium">Free Practice</div>
              <div className="text-xs text-muted-foreground">Unlimited training</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;