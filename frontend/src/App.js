import React, { useState, useEffect } from 'react';
import './App.css';
import api from './api';
import useTranslation from './hooks/useTranslation';

function App() {
  const { t, language, changeLanguage } = useTranslation();
  
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
      setLoginError(t('auth.error.emptyUsername'));
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
        setLoginError(`${t('auth.error.loginFailed')}: ${response.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(`${t('auth.error.loginFailed')}: ${error.response?.data?.error || error.message || 'Unknown error'}`);
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
      <div className="app-logo">🧠 {t('app.title')}</div>
      <div className="user-greeting">{t('home.greeting', { username: user?.username })}</div>
      
      <button 
        className="play-button" 
        onClick={() => setCurrentPage('play')}
      >
        {t('home.playButton')}
      </button>
      
      <button 
        className="stats-button" 
        onClick={() => setCurrentPage('stats')}
      >
        {t('home.statsButton')}
      </button>
      
      <button 
        className="settings-button" 
        onClick={() => setCurrentPage('settings')}
      >
        {t('home.settingsButton')}
      </button>
    </div>
  );

  // Render play screen with improved carousel
  const renderPlayScreen = () => {
    const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
    
    // Find today's challenge index
    useEffect(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find today's challenge index
      let todayIndex = 0;
      for (let i = 0; i < weeklyChallenges.length; i++) {
        const challengeDate = new Date(weeklyChallenges[i].date);
        challengeDate.setHours(0, 0, 0, 0);
        if (challengeDate.getTime() === today.getTime()) {
          todayIndex = i;
          break;
        }
      }
      
      setCurrentCarouselIndex(todayIndex);
    }, [weeklyChallenges]);
    
    // Function to get card position classes
    const getCardPositionClass = (index) => {
      const diff = index - currentCarouselIndex;
      
      if (diff === 0) return 'center';
      if (diff === -1) return 'left';
      if (diff === 1) return 'right';
      if (diff === -2) return 'far-left';
      if (diff === 2) return 'far-right';
      return '';
    };
    
    // Function to get card state classes
    const getCardStateClass = (challenge) => {
      const challengeDate = new Date(challenge.date);
      challengeDate.setHours(0, 0, 0, 0);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      
      if (challengeDate > todayDate) {
        return 'future';
      } else if (challenge.completed) {
        return 'completed';
      } else if (challengeDate < todayDate) {
        return 'missed';
      }
      return '';
    };
    
    // Function to get status icon
    const getStatusIcon = (challenge) => {
      const challengeDate = new Date(challenge.date);
      challengeDate.setHours(0, 0, 0, 0);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      
      if (challengeDate > todayDate) {
        return '🔒';
      } else if (challenge.completed) {
        return '✔';
      } else if (challengeDate < todayDate) {
        return '✖';
      }
      return '';
    };
    
    // Function to format date
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    // Function to handle card click
    const handleCardClick = (challenge, index) => {
      const challengeDate = new Date(challenge.date);
      challengeDate.setHours(0, 0, 0, 0);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      
      // Future days are not clickable
      if (challengeDate > todayDate) {
        return;
      }
      
      // Completed/past challenges show results
      if (challenge.completed || challengeDate < todayDate) {
        // TODO: Show results page/modal
        alert(`Challenge completed with score: ${challenge.score}/5`);
      } else {
        // Start today's challenge
        startDailyChallenge(challenge.date);
      }
    };
    
    return (
      <div className="home-screen">
        <div className="screen-header">
          <button 
            className="back-button" 
            onClick={() => setCurrentPage('home')}
          >
            ←
          </button>
          <h1>{t('play.title')}</h1>
          <div style={{ width: 40 }}></div> {/* Spacer for alignment */}
        </div>
        
        <div className="challenge-carousel-container">
          <div className="carousel-track">
            {weeklyChallenges.map((challenge, index) => {
              const positionClass = getCardPositionClass(index);
              const stateClass = getCardStateClass(challenge);
              const statusIcon = getStatusIcon(challenge);
              const challengeDate = new Date(challenge.date);
              const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              const isToday = challengeDate.toDateString() === new Date().toDateString();
              
              return (
                <div 
                  key={index}
                  className={`carousel-card ${positionClass} ${stateClass}`}
                  onClick={() => handleCardClick(challenge, index)}
                >
                  <div className="card-day">
                    {isToday ? 'TODAY' : dayNames[challengeDate.getDay()]}
                  </div>
                  <div className="card-date">
                    {formatDate(challenge.date)}
                  </div>
                  <div className="card-status">
                    {statusIcon}
                  </div>
                  
                  {challenge.completed && (
                    <div className="card-score">
                      {challenge.score}/5
                    </div>
                  )}
                  
                  {!challenge.completed && challengeDate <= new Date() && challengeDate.toDateString() === new Date().toDateString() && (
                    <button 
                      className="start-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startDailyChallenge(challenge.date);
                      }}
                    >
                      Start
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          
          {currentCarouselIndex > 0 && (
            <button 
              className="carousel-nav prev" 
              onClick={() => setCurrentCarouselIndex(currentCarouselIndex - 1)}
            >
              ‹
            </button>
          )}
          
          {currentCarouselIndex < weeklyChallenges.length - 1 && (
            <button 
              className="carousel-nav next" 
              onClick={() => setCurrentCarouselIndex(currentCarouselIndex + 1)}
            >
              ›
            </button>
          )}
        </div>
        
        <div className="game-modes">
          <h2>{t('play.otherGameModes')}</h2>
          <button 
            className="game-mode-button" 
            onClick={() => setCurrentPage('free-run-config')}
          >
            {t('play.freeRunButton')}
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
        <h1>{t('settings.title')}</h1>
        <div style={{ width: 40 }}></div> {/* Spacer for alignment */}
      </div>
      
      <div className="theme-toggle-switch">
        <span>{t('settings.darkMode')}</span>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={theme === 'dark'} 
            onChange={toggleTheme} 
          />
          <span className="slider"></span>
        </label>
      </div>
      
      <div className="language-selector">
        <span>Language / Idioma / Langue / Jazyk</span>
        <select 
          value={language} 
          onChange={(e) => changeLanguage(e.target.value)}
          className="language-select"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="sk">Slovenčina</option>
        </select>
      </div>
      
      <button 
        className="settings-button" 
        onClick={handleLogout}
      >
        {t('settings.logoutButton')}
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
        <h1>{t('stats.title')}</h1>
        <div style={{ width: 40 }}></div> {/* Spacer for alignment */}
      </div>
      
      {user && userStats && (
        <div className="user-info">
          <h2>{t('stats.greeting', { username: user.username })}</h2>
          
          <div className="stats-overview">
            <div className="stat-card">
              <h3>{t('stats.currentStreak')}</h3>
              <p className="stat-value">{user.streak} days</p>
            </div>
            
            <div className="stat-card">
              <h3>{t('stats.maxStreak')}</h3>
              <p className="stat-value">{user.max_streak} days</p>
            </div>
            
            <div className="stat-card">
              <h3>{t('stats.totalProblems')}</h3>
              <p className="stat-value">{user.total_problems_attempted || 0}</p>
            </div>
          </div>
          
          <div className="accuracy-stats">
            <h3>{t('stats.accuracy.title')}</h3>
            <div className="accuracy-grid">
              <div className="accuracy-item">
                <span className="accuracy-label">{t('stats.accuracy.dailyChallenges')}</span>
                <span className="accuracy-value">{userStats.user?.challenge_accuracy || 0}%</span>
              </div>
              <div className="accuracy-item">
                <span className="accuracy-label">{t('stats.accuracy.freeRun')}</span>
                <span className="accuracy-value">{userStats.user?.free_run_accuracy || 0}%</span>
              </div>
              <div className="accuracy-item">
                <span className="accuracy-label">{t('stats.accuracy.overall')}</span>
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
      <h1>🧠 {t('app.title')}</h1>
      <p>{t('app.welcome')}</p>
      
      <div className="auth-form">
        <h2>{t('auth.title')}</h2>
        <p>{t('auth.prompt')}</p>
        
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
          placeholder={t('auth.usernamePlaceholder')}
          className="username-input"
          onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
        />
        
        <button onClick={handleLogin} className="primary-button">
          {t('auth.continueButton')}
        </button>
      </div>
    </div>
  );

  // Render loading page
  const renderLoadingPage = () => (
    <div className="loading-page">
      <h1>🧠 {t('app.title')}</h1>
      <p>{t('app.loading')}</p>
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
        <h1>{t('problem.title', { current: problemIndex, total: totalProblems })}</h1>
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
            placeholder={t('problem.placeholder')}
          />
          
          <button onClick={submitAnswer} className="primary-button">
            {t('problem.submitButton')}
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
        <h1>{freeRunSessionId ? t('results.freeRunComplete') : t('results.dailyComplete')}</h1>
        <div style={{ width: 40 }}></div> {/* Spacer for alignment */}
      </div>
      
      {results && (
        <div className="results-content">
          <div className="score-display">
            {t('results.score', { score: results.score, total: results.total })}
          </div>
          
          {results.accuracy !== undefined && (
            <div className="accuracy-display">
              {t('results.accuracy', { accuracy: Math.round(results.accuracy) })}
            </div>
          )}
          
          <div className="session-stats">
            <h3>{t('results.sessionSummary')}</h3>
            <p>{t('results.problemsAttempted', { count: results.total })}</p>
            <p>{t('results.correctAnswers', { count: results.score })}</p>
            {results.accuracy !== undefined && (
              <p>{t('results.sessionAccuracy', { accuracy: Math.round(results.accuracy) })}%</p>
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
          {t('results.continueButton')}
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
        <h1>{t('freeRun.title')}</h1>
        <div style={{ width: 40 }}></div> {/* Spacer for alignment */}
      </div>
      
      <div className="config-section">
        <h3>{t('freeRun.modules')}</h3>
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
              {t(`modules.${module}`)}
            </label>
          ))}
        </div>
      </div>
      
      <div className="config-section">
        <h3>{t('freeRun.difficulty')}</h3>
        <select
          value={freeRunConfig.difficultyLevel}
          onChange={(e) => setFreeRunConfig({
            ...freeRunConfig,
            difficultyLevel: parseInt(e.target.value)
          })}
          className="select-input"
        >
          <option value={1}>{t('freeRun.easy')}</option>
          <option value={2}>{t('freeRun.medium')}</option>
          <option value={3}>{t('freeRun.hard')}</option>
        </select>
      </div>
      
      <div className="config-section">
        <h3>{t('freeRun.problemCount')}</h3>
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
          {t('freeRun.startButton')}
        </button>
      </div>
    </div>
  );

  // Helper function to get operator symbol
  const getOperator = (problemType) => {
    switch (problemType) {
      case 'addition': return t('operators.addition');
      case 'subtraction': return t('operators.subtraction');
      case 'multiplication': return t('operators.multiplication');
      case 'division': return t('operators.division');
      default: return t('operators.addition');
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