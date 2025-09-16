import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import api from './api';

function App() {
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [challengeStats, setChallengeStats] = useState(null);
  const [freeRunStats, setFreeRunStats] = useState(null);
  const [weeklyChallenges, setWeeklyChallenges] = useState([]);
  const [currentPage, setCurrentPage] = useState('loading'); // loading, auth, home, dashboard, problem, results, settings, stats, play
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
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef(null);

  // Check for saved theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

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
        setCurrentPage('home');
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
        setCurrentPage('home');
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
  const startDailyChallenge = async (date) => {
    try {
      console.log('Starting daily challenge for date:', date);
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
          total: response.data.total_problems,
          accuracy: response.data.score / response.data.total_problems * 100
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

  // Carousel navigation
  const goToPrevDay = () => {
    if (carouselIndex > 0) {
      setCarouselIndex(carouselIndex - 1);
    }
  };

  const goToNextDay = () => {
    if (carouselIndex < weeklyChallenges.length - 1) {
      setCarouselIndex(carouselIndex + 1);
    }
  };

  // Render home screen
  const renderHomeScreen = () => (
    <div className="home-screen">
      <div className="app-logo">🧠 Brain Calz</div>
      <div className="user-greeting">Hello, {user?.username}!</div>
      
      <button 
        className="play-button" 
        onClick={() => setCurrentPage('play')}
      >
        PLAY
      </button>
      
      <button 
        className="stats-button" 
        onClick={() => setCurrentPage('stats')}
      >
        Player Stats
      </button>
      
      <button 
        className="settings-button" 
        onClick={() => setCurrentPage('settings')}
      >
        Settings
      </button>
    </div>
  );

  // Render play screen
  const renderPlayScreen = () => {
    // Get the days to display (3 days: previous, current, next)
    const startIndex = Math.max(0, carouselIndex - 1);
    const endIndex = Math.min(weeklyChallenges.length, carouselIndex + 2);
    const visibleDays = weeklyChallenges.slice(startIndex, endIndex);
    
    // Pad with empty days if needed
    while (visibleDays.length < 3) {
      visibleDays.push(null);
    }
    
    return (
      <div className="home-screen">
        <div className="screen-header">
          <button 
            className="back-button" 
            onClick={() => setCurrentPage('home')}
          >
            ←
          </button>
          <h1>Daily Challenges</h1>
          <div style={{ width: 40 }}></div> {/* Spacer for alignment */}
        </div>
        
        <div className="challenge-carousel-container">
          {carouselIndex > 0 && (
            <button className="carousel-nav prev" onClick={goToPrevDay}>
              ‹
            </button>
          )}
          
          <div className="challenge-carousel">
            {visibleDays.map((challenge, index) => {
              if (!challenge) {
                return (
                  <div key={index} className="challenge-day-card future">
                    <div className="day-name">-</div>
                    <div className="day-date">-</div>
                  </div>
                );
              }
              
              const date = new Date(challenge.date);
              const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              const isToday = date.toDateString() === new Date().toDateString();
              const isFuture = date > new Date();
              const isPast = date < new Date();
              
              // Determine card class
              let cardClass = "challenge-day-card";
              if (isToday) {
                cardClass += " today";
              } else if (isFuture) {
                cardClass += " future";
              } else if (isPast && challenge.completed) {
                cardClass += " completed";
              } else if (isPast && !challenge.completed) {
                cardClass += " past";
              }
              
              return (
                <div 
                  key={index} 
                  className={cardClass}
                  onClick={() => {
                    if (!isFuture) {
                      if (challenge.completed) {
                        // Maybe show a summary or allow review?
                        alert(`Challenge completed with score: ${challenge.score}/5`);
                      } else {
                        // Start the challenge
                        startDailyChallenge(challenge.date);
                      }
                    }
                  }}
                >
                  <div className="day-name">{dayNames[date.getDay()]}</div>
                  <div className="day-date">{date.getDate()}</div>
                  {challenge.completed && (
                    <div className="score">{challenge.score}/5</div>
                  )}
                  {isFuture && (
                    <div className="score">🔒</div>
                  )}
                </div>
              );
            })}
          </div>
          
          {carouselIndex < weeklyChallenges.length - 1 && (
            <button className="carousel-nav next" onClick={goToNextDay}>
              ›
            </button>
          )}
        </div>
        
        <div className="game-modes">
          <h2>Other Game Modes</h2>
          <button 
            className="game-mode-button" 
            onClick={() => setCurrentPage('free-run-config')}
          >
            Free Run
          </button>
        </div>
      </div>
    );
  };

  // Render settings screen
  const renderSettingsScreen = () => (
    <div className="settings-screen">
      <div className="screen-header">
        <button 
          className="back-button" 
          onClick={() => setCurrentPage('home')}
        >
          ←
        </button>
        <h1>Settings</h1>
        <div style={{ width: 40 }}></div> {/* Spacer for alignment */}
      </div>
      
      <div className="theme-toggle-switch">
        <span>Dark Mode</span>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={theme === 'dark'} 
            onChange={toggleTheme} 
          />
          <span className="slider"></span>
        </label>
      </div>
      
      <button 
        className="settings-button" 
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );

  // Render stats screen
  const renderStatsScreen = () => (
    <div className="stats-screen">
      <div className="screen-header">
        <button 
          className="back-button" 
          onClick={() => setCurrentPage('home')}
        >
          ←
        </button>
        <h1>Player Stats</h1>
        <div style={{ width: 40 }}></div> {/* Spacer for alignment */}
      </div>
      
      {user && userStats && (
        <div className="user-info">
          <h2>{user.username}'s Statistics</h2>
          
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
              <p className="stat-value">{user.total_problems_attempted || 0}</p>
            </div>
          </div>
          
          <div className="accuracy-stats">
            <h3>Accuracy Overview</h3>
            <div className="accuracy-grid">
              <div className="accuracy-item">
                <span className="accuracy-label">Daily Challenges:</span>
                <span className="accuracy-value">{userStats.user?.challenge_accuracy || 0}%</span>
              </div>
              <div className="accuracy-item">
                <span className="accuracy-label">Free Run:</span>
                <span className="accuracy-value">{userStats.user?.free_run_accuracy || 0}%</span>
              </div>
              <div className="accuracy-item">
                <span className="accuracy-label">Overall:</span>
                <span className="accuracy-value">{userStats.user?.overall_accuracy || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render authentication page
  const renderAuthPage = () => (
    <div className="auth-page">
      <h1>🧠 Brain Calz</h1>
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
      <h1>🧠 Brain Calz</h1>
      <p>Loading...</p>
    </div>
  );

  // Render problem page
  const renderProblemPage = () => (
    <div className="problem-page">
      <div className="screen-header">
        <button 
          className="back-button" 
          onClick={() => setCurrentPage('play')}
        >
          ←
        </button>
        <h1>Problem {problemIndex} of {totalProblems}</h1>
        <div style={{ width: 40 }}></div> {/* Spacer for alignment */}
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
      <div className="screen-header">
        <button 
          className="back-button" 
          onClick={() => setCurrentPage('play')}
        >
          ←
        </button>
        <h1>{freeRunSessionId ? 'Free Run Complete!' : 'Daily Challenge Complete!'}</h1>
        <div style={{ width: 40 }}></div> {/* Spacer for alignment */}
      </div>
      
      {results && (
        <div className="results-content">
          <div className="score-display">
            Your score: {results.score} out of {results.total}
          </div>
          
          {results.accuracy !== undefined && (
            <div className="accuracy-display">
              Accuracy: {Math.round(results.accuracy)}%
            </div>
          )}
          
          <div className="session-stats">
            <h3>Session Summary</h3>
            <p>Problems attempted: {results.total}</p>
            <p>Correct answers: {results.score}</p>
            {results.accuracy !== undefined && (
              <p>Session accuracy: {Math.round(results.accuracy)}%</p>
            )}
          </div>
        </div>
      )}
      
      <div className="actions">
        <button 
          onClick={() => {
            setCurrentPage('play');
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
          Continue Playing
        </button>
      </div>
    </div>
  );

  // Render free run configuration
  const renderFreeRunConfig = () => (
    <div className="free-run-config">
      <div className="screen-header">
        <button 
          className="back-button" 
          onClick={() => setCurrentPage('play')}
        >
          ←
        </button>
        <h1>Free Run Configuration</h1>
        <div style={{ width: 40 }}></div> {/* Spacer for alignment */}
      </div>
      
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
      {currentPage === 'home' && renderHomeScreen()}
      {currentPage === 'play' && renderPlayScreen()}
      {currentPage === 'settings' && renderSettingsScreen()}
      {currentPage === 'stats' && renderStatsScreen()}
      {currentPage === 'problem' && renderProblemPage()}
      {currentPage === 'results' && renderResultsPage()}
      {currentPage === 'free-run-config' && renderFreeRunConfig()}
    </div>
  );
}

export default App;