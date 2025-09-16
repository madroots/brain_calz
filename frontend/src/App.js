import React, { useState, useEffect } from 'react';
import './App.css';
import api from './api';

function App() {
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [challengeStats, setChallengeStats] = useState(null);
  const [freeRunStats, setFreeRunStats] = useState(null);
  const [weeklyChallenges, setWeeklyChallenges] = useState([]);
  const [currentPage, setCurrentPage] = useState('loading'); // loading, auth, dashboard, problem, results
  const [currentProblem, setCurrentProblem] = useState(null);
  const [challengeId, setChallengeId] = useState(null);
  const [freeRunSessionId, setFreeRunSessionId] = useState(null);
  const [problemIndex, setProblemIndex] = useState(0);
  const [totalProblems, setTotalProblems] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [results, setResults] = useState(null);
  const [freeRunConfig, setFreeRunConfig] = useState({
    modules: ['addition'],
    difficultyLevel: 1,
    problemCount: 5
  });
  const [username, setUsername] = useState('');
  const [loginError, setLoginError] = useState('');

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check if user is authenticated
  const checkAuthStatus = async () => {
    try {
      const response = await api.get('/auth/status');
      if (response.data.authenticated) {
        setUser(response.data.user);
        setCurrentPage('dashboard');
        fetchData();
      } else {
        setCurrentPage('auth');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setCurrentPage('auth');
    }
  };

  // Handle login
  const handleLogin = async () => {
    if (!username.trim()) {
      setLoginError('Please enter a username');
      return;
    }
    
    try {
      setLoginError('');
      console.log('Attempting to login with username:', username.trim());
      const response = await api.post('/auth/login', { username: username.trim() });
      console.log('Login response:', response.data);
      if (response.data.success) {
        setUser(response.data.user);
        setCurrentPage('dashboard');
        fetchData();
      } else {
        setLoginError('Login failed: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Login failed: ' + (error.response?.data?.error || error.message || 'Unknown error'));
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      setUserStats(null);
      setChallengeStats(null);
      setFreeRunStats(null);
      setWeeklyChallenges([]);
      setCurrentPage('auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Fetch user data and weekly challenges on app load
  const fetchData = async () => {
    try {
      console.log('Fetching user data...');
      const userResponse = await api.get('/user');
      console.log('User data received:', userResponse.data);
      setUser(userResponse.data);
      
      console.log('Fetching user stats...');
      const statsResponse = await api.get('/user-stats');
      console.log('User stats received:', statsResponse.data);
      setUserStats(statsResponse.data);
      
      console.log('Fetching challenge stats...');
      const challengeStatsResponse = await api.get('/challenge-stats');
      console.log('Challenge stats received:', challengeStatsResponse.data);
      setChallengeStats(challengeStatsResponse.data);
      
      console.log('Fetching free run stats...');
      const freeRunStatsResponse = await api.get('/free-run-stats');
      console.log('Free run stats received:', freeRunStatsResponse.data);
      setFreeRunStats(freeRunStatsResponse.data);
      
      console.log('Fetching weekly challenges...');
      const challengesResponse = await api.get('/weekly-challenges');
      console.log('Weekly challenges received:', challengesResponse.data);
      setWeeklyChallenges(challengesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Start daily challenge
  const startDailyChallenge = async () => {
    try {
      console.log('Starting daily challenge...');
      const response = await api.post('/start-daily-challenge');
      console.log('Daily challenge started:', response.data);
      setChallengeId(response.data.challenge_id);
      setCurrentProblem(response.data.current_problem);
      setProblemIndex(response.data.current_problem_index);
      setTotalProblems(response.data.total_problems);
      setCurrentPage('problem');
      setUserAnswer('');
    } catch (error) {
      console.error('Error starting challenge:', error);
    }
  };

  // Submit answer
  const submitAnswer = async () => {
    if (userAnswer === '' || isNaN(userAnswer)) return;
    
    // Check if we're in a free run session
    if (freeRunSessionId) {
      await submitFreeRunAnswer();
    } else {
      await submitDailyChallengeAnswer();
    }
  };

  // Submit answer for daily challenge
  const submitDailyChallengeAnswer = async () => {
    try {
      const response = await api.post('/submit-answer', {
        challenge_id: challengeId,
        problem_id: currentProblem.id,
        user_answer: parseInt(userAnswer),
        time_taken: 0 // In a real app, we would track time
      });
      
      setUserAnswer('');
      
      if (response.data.completed) {
        // Challenge completed
        setResults({
          score: response.data.score,
          total: response.data.total_problems
        });
        setCurrentPage('results');
        
        // Refresh weekly challenges
        const challengesResponse = await api.get('/weekly-challenges');
        setWeeklyChallenges(challengesResponse.data);
      } else {
        // Move to next problem
        setCurrentProblem(response.data.next_problem);
        setProblemIndex(response.data.current_problem_index);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  // Submit answer for free run
  const submitFreeRunAnswer = async () => {
    try {
      const response = await api.post('/submit-free-run-answer', {
        session_id: freeRunSessionId,
        user_answer: parseInt(userAnswer),
        time_taken: 0 // In a real app, we would track time
      });
      
      setUserAnswer('');
      
      if (response.data.completed) {
        // Free run completed
        setResults({
          score: response.data.score,
          total: response.data.total_problems,
          accuracy: response.data.accuracy
        });
        setFreeRunSessionId(null);
        setCurrentPage('results');
      } else {
        // Move to next problem
        setCurrentProblem(response.data.next_problem);
        setProblemIndex(response.data.current_problem_index);
      }
    } catch (error) {
      console.error('Error submitting free run answer:', error);
    }
  };

  // Start free run
  const startFreeRun = async () => {
    try {
      console.log('Starting free run with config:', freeRunConfig);
      const response = await api.post('/start-free-run', {
        modules: freeRunConfig.modules,
        difficulty_level: freeRunConfig.difficultyLevel,
        problem_count: freeRunConfig.problemCount
      });
      
      console.log('Free run started:', response.data);
      setFreeRunSessionId(response.data.session_id);
      setCurrentProblem(response.data.current_problem);
      setProblemIndex(response.data.current_problem_index);
      setTotalProblems(response.data.total_problems);
      setCurrentPage('problem');
      setUserAnswer('');
    } catch (error) {
      console.error('Error starting free run:', error);
    }
  };

  // Handle key press for answer submission
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      submitAnswer();
    }
  };

  // Render authentication page
  const renderAuthPage = () => (
    <div className="auth-page">
      <h1>Brain Calz</h1>
      <p>Train your mental math skills daily!</p>
      
      <div className="auth-form">
        <h2>Welcome</h2>
        <p>Please enter your username to continue:</p>
        
        {loginError && (
          <div className="error-message">
            {loginError}
          </div>
        )}
        
        <input
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (loginError) setLoginError('');
          }}
          placeholder="Enter your username"
          className="username-input"
          onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
        />
        
        <button onClick={handleLogin} className="primary-button">
          Continue
        </button>
      </div>
    </div>
  );

  // Render loading page
  const renderLoadingPage = () => (
    <div className="loading-page">
      <h1>Brain Calz</h1>
      <p>Loading...</p>
    </div>
  );

  // Render dashboard
  const renderDashboard = () => (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Brain Calz</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout ({user?.username})
        </button>
      </div>
      
      <p>Train your mental math skills daily!</p>
      
      {user && (
        <div className="user-info">
          <h2>Welcome, {user.username}!</h2>
          
          <div className="stats-overview">
            <div className="stat-card">
              <h3>Current Streak</h3>
              <p className="stat-value">{user.streak} days</p>
            </div>
            
            <div className="stat-card">
              <h3>Max Streak</h3>
              <p className="stat-value">{user.max_streak} days</p>
            </div>
            
            <div className="stat-card">
              <h3>Total Problems Attempted</h3>
              <p className="stat-value">{user.total_problems_attempted}</p>
            </div>
          </div>
          
          <div className="accuracy-stats">
            <h3>Accuracy Overview</h3>
            <div className="accuracy-grid">
              <div className="accuracy-item">
                <span className="accuracy-label">Daily Challenges:</span>
                <span className="accuracy-value">{userStats?.user?.challenge_accuracy || 0}%</span>
              </div>
              <div className="accuracy-item">
                <span className="accuracy-label">Free Run:</span>
                <span className="accuracy-value">{userStats?.user?.free_run_accuracy || 0}%</span>
              </div>
              <div className="accuracy-item">
                <span className="accuracy-label">Overall:</span>
                <span className="accuracy-value">{userStats?.user?.overall_accuracy || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="weekly-overview">
        <h2>This Week's Challenges</h2>
        <div className="week-grid">
          {weeklyChallenges.map((challenge, index) => {
            const date = new Date(challenge.date);
            const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div 
                key={index} 
                className={`day-card ${challenge.completed ? 'completed' : ''} ${isToday ? 'today' : ''}`}
              >
                <div className="day-name">{dayNames[date.getDay()]}</div>
                <div className="day-date">{date.getDate()}</div>
                {challenge.completed && (
                  <div className="score">{challenge.score}/{totalProblems || 5}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="actions">
        <button onClick={startDailyChallenge} className="primary-button">
          Start Daily Challenge
        </button>
        <button 
          onClick={() => setCurrentPage('free-run-config')} 
          className="secondary-button"
        >
          Free Run / Extra Practice
        </button>
      </div>
    </div>
  );

  // Render problem page
  const renderProblemPage = () => (
    <div className="problem-page">
      <div className="problem-header">
        <div className="progress">
          Problem {problemIndex} of {totalProblems}
        </div>
      </div>
      
      {currentProblem && (
        <div className="problem-content">
          <div className="problem">
            {currentProblem.operand1} {getOperator(currentProblem.problem_type)} {currentProblem.operand2} = ?
          </div>
          
          <input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            autoFocus
            className="answer-input"
          />
          
          <button onClick={submitAnswer} className="primary-button">
            Submit Answer
          </button>
        </div>
      )}
    </div>
  );

  // Render results page
  const renderResultsPage = () => (
    <div className="results-page">
      <h2>{freeRunSessionId ? 'Free Run Complete!' : 'Daily Challenge Complete!'}</h2>
      
      {results && (
        <div className="results-content">
          <div className="score-display">
            Your score: {results.score} out of {results.total}
          </div>
          
          {results.accuracy !== undefined && (
            <div className="accuracy-display">
              Accuracy: {results.accuracy}%
            </div>
          )}
          
          {!freeRunSessionId && challengeStats && (
            <div className="challenge-stats">
              <h3>Challenge Stats</h3>
              <p>Current streak: {challengeStats.streak} days</p>
              <p>Max streak: {challengeStats.max_streak} days</p>
              <p>Total problems attempted: {challengeStats.total_problems_solved}</p>
            </div>
          )}
          
          {userStats && (
            <div className="additional-stats">
              <h3>Overall Progress</h3>
              <p>Total challenges completed: {userStats.user.total_challenges_completed}</p>
              <p>Overall accuracy: {userStats.user.overall_accuracy}%</p>
            </div>
          )}
        </div>
      )}
      
      <div className="actions">
        <button 
          onClick={() => {
            setCurrentPage('dashboard');
            setResults(null);
            setFreeRunSessionId(null);
            setChallengeId(null);
            
            // Refresh stats
            const refreshStats = async () => {
              try {
                const userResponse = await api.get('/user');
                setUser(userResponse.data);
                
                const challengeStatsResponse = await api.get('/challenge-stats');
                setChallengeStats(challengeStatsResponse.data);
                
                const freeRunStatsResponse = await api.get('/free-run-stats');
                setFreeRunStats(freeRunStatsResponse.data);
                
                const statsResponse = await api.get('/user-stats');
                setUserStats(statsResponse.data);
                
                const challengesResponse = await api.get('/weekly-challenges');
                setWeeklyChallenges(challengesResponse.data);
              } catch (error) {
                console.error('Error refreshing stats:', error);
              }
            };
            
            refreshStats();
          }}
          className="primary-button"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  // Render free run configuration
  const renderFreeRunConfig = () => (
    <div className="free-run-config">
      <h2>Free Run Configuration</h2>
      
      <div className="config-section">
        <h3>Modules</h3>
        <div className="checkbox-group">
          {['addition', 'subtraction', 'multiplication', 'division'].map(module => (
            <label key={module} className="checkbox-label">
              <input
                type="checkbox"
                checked={freeRunConfig.modules.includes(module)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFreeRunConfig({
                      ...freeRunConfig,
                      modules: [...freeRunConfig.modules, module]
                    });
                  } else {
                    setFreeRunConfig({
                      ...freeRunConfig,
                      modules: freeRunConfig.modules.filter(m => m !== module)
                    });
                  }
                }}
              />
              {module.charAt(0).toUpperCase() + module.slice(1)}
            </label>
          ))}
        </div>
      </div>
      
      <div className="config-section">
        <h3>Difficulty Level</h3>
        <select
          value={freeRunConfig.difficultyLevel}
          onChange={(e) => setFreeRunConfig({
            ...freeRunConfig,
            difficultyLevel: parseInt(e.target.value)
          })}
          className="select-input"
        >
          <option value={1}>Easy</option>
          <option value={2}>Medium</option>
          <option value={3}>Hard</option>
        </select>
      </div>
      
      <div className="config-section">
        <h3>Number of Problems</h3>
        <select
          value={freeRunConfig.problemCount}
          onChange={(e) => setFreeRunConfig({
            ...freeRunConfig,
            problemCount: parseInt(e.target.value)
          })}
          className="select-input"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={20}>20</option>
        </select>
      </div>
      
      <div className="actions">
        <button 
          onClick={startFreeRun} 
          className="primary-button"
          disabled={freeRunConfig.modules.length === 0}
        >
          Start Free Run
        </button>
        <button 
          onClick={() => setCurrentPage('dashboard')} 
          className="secondary-button"
        >
          Back
        </button>
      </div>
    </div>
  );

  // Helper function to get operator symbol
  const getOperator = (problemType) => {
    switch (problemType) {
      case 'addition': return '+';
      case 'subtraction': return '-';
      case 'multiplication': return '×';
      case 'division': return '÷';
      default: return '+';
    }
  };

  // Render the appropriate page based on current state
  if (currentPage === 'loading') {
    return renderLoadingPage();
  }

  return (
    <div className="App">
      {currentPage === 'auth' && renderAuthPage()}
      {currentPage === 'dashboard' && renderDashboard()}
      {currentPage === 'problem' && renderProblemPage()}
      {currentPage === 'results' && renderResultsPage()}
      {currentPage === 'free-run-config' && renderFreeRunConfig()}
    </div>
  );
}

export default App;