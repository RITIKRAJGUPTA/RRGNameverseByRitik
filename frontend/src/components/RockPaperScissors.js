import React, { useState, useEffect, useRef } from 'react';
import { 
  FiRefreshCw, FiAward, FiTrendingUp, FiVolume2, 
  FiVolumeX, FiHelpCircle, FiShare2, FiDownload,
  FiStar, FiUsers, FiTarget, FiZap
} from 'react-icons/fi';
import { FaHandRock, FaHandPaper, FaHandScissors, FaCrown, FaFire } from 'react-icons/fa';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function RockPaperScissors() {
  const choices = [
    { id: 'rock', name: 'Rock', icon: <FaHandRock />, color: '#8B4513', beats: 'scissors' },
    { id: 'paper', name: 'Paper', icon: <FaHandPaper />, color: '#FFFFFF', beats: 'rock' },
    { id: 'scissors', name: 'Scissors', icon: <FaHandScissors />, color: '#C0C0C0', beats: 'paper' }
  ];

  const [userChoice, setUserChoice] = useState(null);
  const [computerChoice, setComputerChoice] = useState(null);
  const [result, setResult] = useState('');
  const [score, setScore] = useState({ user: 0, computer: 0, draws: 0 });
  const [history, setHistory] = useState([]);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [round, setRound] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [gameMode, setGameMode] = useState('normal');
  const [timer, setTimer] = useState(3);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [theme, setTheme] = useState('default');
  const gameAreaRef = useRef(null);
  const audioRef = useRef(null);

  // Sound effects
  const sounds = {
    win: 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3',
    lose: 'https://assets.mixkit.co/sfx/preview/mixkit-losing-bleeps-2026.mp3',
    draw: 'https://assets.mixkit.co/sfx/preview/mixkit-retro-game-emergency-alarm-1000.mp3',
    click: 'https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3',
    select: 'https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3'
  };

  // Initialize from localStorage
  useEffect(() => {
    const savedScore = JSON.parse(localStorage.getItem('rpsScore')) || { user: 0, computer: 0, draws: 0 };
    const savedHistory = JSON.parse(localStorage.getItem('rpsHistory')) || [];
    const savedMaxStreak = parseInt(localStorage.getItem('rpsMaxStreak')) || 0;
    const savedAchievements = JSON.parse(localStorage.getItem('rpsAchievements')) || [];
    
    setScore(savedScore);
    setHistory(savedHistory.slice(-10)); // Keep last 10 games
    setMaxStreak(savedMaxStreak);
    setAchievements(savedAchievements);
  }, []);

  const playSound = (type) => {
    if (!soundEnabled || !audioRef.current) return;
    
    audioRef.current.src = sounds[type];
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(e => console.log("Audio play failed:", e));
  };

  const checkAchievements = (newScore) => {
    const newAchievements = [];
    
    if (newScore.user >= 10 && !achievements.includes('first_10')) {
      newAchievements.push({ id: 'first_10', title: 'Decade of Wins', icon: '🏆' });
    }
    if (streak >= 5 && !achievements.includes('streak_5')) {
      newAchievements.push({ id: 'streak_5', title: 'Hot Streak', icon: '🔥' });
    }
    if (round >= 20 && !achievements.includes('round_20')) {
      newAchievements.push({ id: 'round_20', title: 'Veteran Player', icon: '⭐' });
    }
    if (score.computer === 0 && newScore.computer > 0 && !achievements.includes('first_loss')) {
      newAchievements.push({ id: 'first_loss', title: 'First Blood', icon: '⚔️' });
    }
    
    if (newAchievements.length > 0) {
      setAchievements([...achievements, ...newAchievements.map(a => a.id)]);
      localStorage.setItem('rpsAchievements', JSON.stringify([...achievements, ...newAchievements.map(a => a.id)]));
      
      // Celebrate with confetti
      newAchievements.forEach(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      });
      
      return newAchievements;
    }
    return [];
  };

  const playGame = async (choice) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    playSound('select');
    
    // Countdown animation
    setIsTimerActive(true);
    let countdown = 3;
    
    const countdownInterval = setInterval(() => {
      setTimer(countdown);
      countdown--;
      
      if (countdown < 0) {
        clearInterval(countdownInterval);
        setIsTimerActive(false);
        setTimer(3);
        
        // Game logic
        const compChoice = gameMode === 'normal' 
          ? choices[Math.floor(Math.random() * choices.length)]
          : choices.find(c => c.id === ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)]);
        
        setUserChoice(choice);
        setComputerChoice(compChoice);
        
        let newResult = '';
        let newScore = { ...score };
        
        if (choice.id === compChoice.id) {
          newResult = "It's a draw!";
          newScore.draws += 1;
          playSound('draw');
        } else if (choice.beats === compChoice.id) {
          newResult = 'You win!';
          newScore.user += 1;
          setStreak(prev => {
            const newStreak = prev + 1;
            if (newStreak > maxStreak) {
              setMaxStreak(newStreak);
              localStorage.setItem('rpsMaxStreak', newStreak.toString());
            }
            return newStreak;
          });
          playSound('win');
          
          // Confetti for win
          if (streak >= 2) {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 }
            });
          }
        } else {
          newResult = 'Computer wins!';
          newScore.computer += 1;
          setStreak(0);
          playSound('lose');
        }
        
        setResult(newResult);
        setScore(newScore);
        localStorage.setItem('rpsScore', JSON.stringify(newScore));
        
        // Add to history
        const gameRecord = {
          round,
          user: choice.id,
          computer: compChoice.id,
          result: newResult,
          timestamp: new Date().toISOString()
        };
        
        const newHistory = [...history, gameRecord].slice(-10);
        setHistory(newHistory);
        localStorage.setItem('rpsHistory', JSON.stringify(newHistory));
        
        // Check achievements
        const newAchievements = checkAchievements(newScore);
        
        setRound(prev => prev + 1);
        
        // Animation complete
        setTimeout(() => setIsAnimating(false), 1000);
      }
    }, 600);
  };

  const resetGame = () => {
    setUserChoice(null);
    setComputerChoice(null);
    setResult('');
    setStreak(0);
    setRound(1);
    playSound('click');
  };

  const resetScore = () => {
    if (window.confirm('Reset all scores and history?')) {
      setScore({ user: 0, computer: 0, draws: 0 });
      setHistory([]);
      setStreak(0);
      setMaxStreak(0);
      setRound(1);
      setAchievements([]);
      localStorage.removeItem('rpsScore');
      localStorage.removeItem('rpsHistory');
      localStorage.removeItem('rpsMaxStreak');
      localStorage.removeItem('rpsAchievements');
    }
  };

  const downloadStats = async () => {
    if (gameAreaRef.current) {
      const canvas = await html2canvas(gameAreaRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 180;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.setFillColor(30, 30, 46);
      pdf.rect(0, 0, 210, 297, 'F');
      
      pdf.setFontSize(28);
      pdf.setTextColor(255, 215, 0);
      pdf.text('Rock Paper Scissors', 105, 25, null, null, 'center');
      pdf.setFontSize(16);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Game Statistics Report', 105, 35, null, null, 'center');
      
      pdf.addImage(imgData, 'PNG', 15, 45, imgWidth, imgHeight);
      
      pdf.setFontSize(12);
      pdf.setTextColor(200, 200, 200);
      pdf.text(`Report generated: ${new Date().toLocaleDateString()}`, 105, 280, null, null, 'center');
      
      pdf.save(`RPS_Stats_${new Date().getTime()}.pdf`);
    }
  };

  const shareGame = () => {
    const text = `🎮 I'm playing Rock Paper Scissors on Ritik's Insight Hub!\nScore: ${score.user} - ${score.computer}\nStreak: ${streak} wins\nTry it out!`;
    navigator.share?.({
      title: 'Rock Paper Scissors',
      text: text,
      url: window.location.href
    }).catch(() => {
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    });
  };

  const themes = {
    default: { bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', accent: '#00b4d8' },
    neon: { bg: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', accent: '#00ff88' },
    sunset: { bg: 'linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%)', accent: '#ff6b6b' },
    ocean: { bg: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', accent: '#4cc9f0' }
  };

  const currentTheme = themes[theme];

  return (
    <>
      <style>
        {`
        
/* ============================================
   MOBILE RESPONSIVE STYLES
   ============================================ */

/* Tablet & Mobile Base */
@media (max-width: 992px) {
  .game-card {
    padding: 20px !important;
    margin: 0 10px !important;
  }
  
  .score-card {
    padding: 12px !important;
    min-width: 80px !important;
  }
  
  .score-card h2 {
    font-size: 2rem !important;
  }
  
  .score-card h5 {
    font-size: 0.8rem !important;
  }
  
  .choice-btn {
    width: 90px !important;
    height: 90px !important;
    font-size: 2rem !important;
  }
  
  .choice-name {
    font-size: 0.7rem !important;
    margin-top: 6px !important;
  }
  
  .choice-display {
    width: 100px !important;
    height: 100px !important;
    font-size: 2.5rem !important;
  }
  
  .result-display {
    font-size: 1.8rem !important;
  }
}

/* Mobile Styles (up to 768px) */
@media (max-width: 768px) {
  /* Container padding */
  .container {
    padding-left: 12px !important;
    padding-right: 12px !important;
  }
  
  /* Header */
  .rps-container {
    padding-top: 60px !important;
  }
  
  .rps-container .display-4 {
    font-size: 1.8rem !important;
  }
  
  .rps-container .display-4 .me-3,
  .rps-container .display-4 .ms-3 {
    margin-left: 8px !important;
    margin-right: 8px !important;
  }
  
  .rps-container .lead {
    font-size: 0.9rem !important;
    padding: 0 15px !important;
  }
  
  /* Theme selector */
  .theme-selector {
    gap: 8px !important;
  }
  
  .theme-dot {
    width: 25px !important;
    height: 25px !important;
  }
  
  /* Game card */
  .game-card {
    padding: 15px !important;
    border-radius: 16px !important;
  }
  
  /* Controls row - stack vertically */
  .d-flex.justify-content-between.align-items-center.mb-4 {
    flex-direction: column !important;
    gap: 12px !important;
    align-items: stretch !important;
  }
  
  .mode-badge {
    align-self: center !important;
    font-size: 0.85rem !important;
    padding: 6px 12px !important;
  }
  
  .d-flex.gap-3 {
    justify-content: center !important;
    gap: 10px !important;
  }
  
  .control-btn {
    width: 40px !important;
    height: 40px !important;
    font-size: 0.9rem !important;
  }
  
  /* Instructions alert */
  .alert-info {
    padding: 12px !important;
    font-size: 0.8rem !important;
    margin: 0 0 15px 0 !important;
  }
  
  .alert-info h5 {
    font-size: 0.9rem !important;
  }
  
  .alert-info ul {
    padding-left: 20px !important;
    margin-top: 5px !important;
  }
  
  .alert-info li {
    font-size: 0.75rem !important;
  }
  
  /* Score Board - 3 cards row */
  .row.justify-content-center.mb-5 {
    margin-bottom: 20px !important;
  }
  
  .score-card {
    padding: 8px !important;
    margin: 0 4px !important;
    min-width: 70px !important;
  }
  
  .score-card h2 {
    font-size: 1.5rem !important;
    margin-bottom: 0 !important;
  }
  
  .score-card h5 {
    font-size: 0.7rem !important;
    margin-bottom: 4px !important;
  }
  
  .score-card small {
    font-size: 0.6rem !important;
  }
  
  /* Streak & Round row */
  .d-flex.justify-content-center.gap-4.mt-3 {
    gap: 12px !important;
    flex-wrap: wrap !important;
  }
  
  .streak-badge {
    padding: 4px 10px !important;
    font-size: 0.7rem !important;
  }
  
  .text-muted {
    font-size: 0.7rem !important;
  }
  
  /* Timer circle */
  .timer-circle {
    width: 70px !important;
    height: 70px !important;
    font-size: 2rem !important;
  }
  
  .text-center.mb-4 p {
    font-size: 0.8rem !important;
    margin-top: 8px !important;
  }
  
  /* Player Choices - Mobile layout */
  .d-flex.justify-content-center.gap-4 {
    gap: 12px !important;
    flex-wrap: wrap !important;
  }
  
  .choice-btn {
    width: 80px !important;
    height: 80px !important;
    font-size: 1.8rem !important;
  }
  
  .choice-btn .choice-name {
    font-size: 0.65rem !important;
    margin-top: 5px !important;
  }
  
  /* VS Battle Area */
  .vs-container {
    height: auto !important;
    margin-bottom: 20px !important;
  }
  
  .vs-badge {
    padding: 5px 12px !important;
    font-size: 1rem !important;
    top: -15px !important;
    position: relative !important;
    z-index: 20 !important;
  }
  
  /* Row alignment for VS area */
  .vs-container .row {
    flex-direction: column !important;
    align-items: center !important;
    gap: 20px !important;
  }
  
  .vs-container .col-md-5 {
    text-align: center !important;
    width: 100% !important;
  }
  
  .vs-container .col-md-2 {
    display: none !important;
  }
  
  /* VS badge reposition for mobile */
  .vs-badge {
    position: relative !important;
    display: inline-block !important;
    margin: 10px auto !important;
    background: rgba(0,0,0,0.8) !important;
  }
  
  .choice-display {
    width: 90px !important;
    height: 90px !important;
    font-size: 2rem !important;
  }
  
  .choice-display .choice-name {
    font-size: 0.7rem !important;
  }
  
  .mt-3 strong {
    font-size: 0.8rem !important;
  }
  
  /* Result Display */
  .result-display {
    font-size: 1.5rem !important;
    margin: 15px 0 !important;
  }
  
  .text-center p.text-muted {
    font-size: 0.7rem !important;
  }
  
  /* Achievements */
  .mt-4 h5 {
    font-size: 0.9rem !important;
    margin-bottom: 8px !important;
  }
  
  .achievement-badge {
    font-size: 0.65rem !important;
    padding: 4px 8px !important;
  }
  
  /* History & Stats */
  .mt-4 h5 {
    font-size: 0.9rem !important;
  }
  
  .history-item {
    padding: 8px !important;
    font-size: 0.7rem !important;
    flex-wrap: wrap !important;
    gap: 6px !important;
  }
  
  .history-item span {
    font-size: 0.7rem !important;
  }
  
  /* Action Buttons - Stack on mobile */
  .d-flex.justify-content-center.gap-3.mt-5 {
    flex-direction: column !important;
    gap: 10px !important;
    align-items: stretch !important;
  }
  
  .btn-outline-light,
  .btn-outline-warning,
  .btn-outline-info,
  .btn-outline-success {
    width: 100% !important;
    padding: 10px !important;
    font-size: 0.85rem !important;
  }
  
  /* Footer */
  .text-center.mt-5 p {
    font-size: 0.7rem !important;
    padding: 0 10px !important;
  }
}

/* Small Mobile (up to 480px) */
@media (max-width: 480px) {
  .container {
    padding-left: 8px !important;
    padding-right: 8px !important;
  }
  
  .game-card {
    padding: 12px !important;
  }
  
  .display-4 {
    font-size: 1.4rem !important;
  }
  
  /* Score cards - even smaller */
  .score-card {
    min-width: 55px !important;
  }
  
  .score-card h2 {
    font-size: 1.2rem !important;
  }
  
  .score-card h5 {
    font-size: 0.6rem !important;
  }
  
  /* Choice buttons */
  .choice-btn {
    width: 65px !important;
    height: 65px !important;
    font-size: 1.5rem !important;
  }
  
  .choice-btn .choice-name {
    font-size: 0.55rem !important;
  }
  
  /* Choice display */
  .choice-display {
    width: 75px !important;
    height: 75px !important;
    font-size: 1.6rem !important;
  }
  
  /* VS badge */
  .vs-badge {
    padding: 4px 10px !important;
    font-size: 0.8rem !important;
  }
  
  /* Result */
  .result-display {
    font-size: 1.2rem !important;
  }
}

/* Landscape mode for mobile */
@media (max-width: 768px) and (orientation: landscape) {
  .rps-container {
    padding-top: 50px !important;
  }
  
  .game-card {
    padding: 12px !important;
  }
  
  .score-card {
    padding: 5px !important;
  }
  
  .score-card h2 {
    font-size: 1.3rem !important;
  }
  
  .choice-btn {
    width: 60px !important;
    height: 60px !important;
    font-size: 1.3rem !important;
  }
  
  .choice-btn .choice-name {
    font-size: 0.5rem !important;
  }
  
  .vs-container .row {
    flex-direction: row !important;
    gap: 10px !important;
  }
  
  .choice-display {
    width: 65px !important;
    height: 65px !important;
    font-size: 1.4rem !important;
  }
  
  .result-display {
    font-size: 1rem !important;
    margin: 10px 0 !important;
  }
  
  .btn-outline-light,
  .btn-outline-warning,
  .btn-outline-info,
  .btn-outline-success {
    padding: 6px !important;
    font-size: 0.7rem !important;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .choice-btn:hover:not(:disabled) {
    transform: none !important;
  }
  
  .choice-btn:active {
    transform: scale(0.95) !important;
    transition: transform 0.05s !important;
  }
  
  .control-btn:active {
    transform: scale(0.9) !important;
  }
  
  /* Larger tap targets */
  .choice-btn,
  .control-btn,
  .theme-dot,
  .btn {
    cursor: pointer !important;
    -webkit-tap-highlight-color: transparent !important;
  }
  
  /* Better touch feedback */
  .choice-btn.active {
    transform: scale(1.05) !important;
  }
}

/* Ensure no overflow issues */
.rps-container {
  overflow-x: hidden !important;
}

.container {
  max-width: 100% !important;
  overflow-x: hidden !important;
}

/* Fix for very small devices */
@media (max-width: 360px) {
  .score-card {
    min-width: 50px !important;
  }
  
  .score-card h2 {
    font-size: 1rem !important;
  }
  
  .choice-btn {
    width: 55px !important;
    height: 55px !important;
    font-size: 1.2rem !important;
  }
  
  .d-flex.justify-content-center.gap-4 {
    gap: 8px !important;
  }
}
          .rps-container {
            background: ${currentTheme.bg};
            min-height: 100vh;
            color: white;
            transition: all 0.3s ease;
          }
          
          .game-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .choice-btn {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 4px solid transparent;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            position: relative;
            overflow: hidden;
          }
          
          .choice-btn:hover:not(:disabled) {
            transform: translateY(-10px) scale(1.1);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
            border-color: ${currentTheme.accent};
          }
          
          .choice-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .choice-btn.active {
            transform: scale(1.1);
            border-color: ${currentTheme.accent};
            box-shadow: 0 0 30px ${currentTheme.accent};
            animation: pulse 1.5s infinite;
          }
          
          .choice-name {
            font-size: 0.9rem;
            margin-top: 10px;
            font-weight: 600;
            opacity: 0.9;
          }
          
          .vs-container {
            position: relative;
            height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .vs-badge {
            position: absolute;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            padding: 10px 20px;
            border-radius: 30px;
            font-size: 1.5rem;
            font-weight: bold;
            z-index: 10;
            border: 3px solid ${currentTheme.accent};
          }
          
          .choice-display {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 4rem;
            background: rgba(255, 255, 255, 0.1);
            border: 5px solid rgba(255, 255, 255, 0.2);
          }
          
          .result-display {
            font-size: 2.5rem;
            font-weight: 800;
            margin: 30px 0;
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
          }
          
          .win { color: #4cd964; }
          .lose { color: #ff3b30; }
          .draw { color: #ffcc00; }
          
          .score-card {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 15px;
            padding: 20px;
            margin: 10px;
            min-width: 120px;
          }
          
          .streak-badge {
            background: linear-gradient(45deg, #ff6b6b, #ffd93d);
            color: black;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            display: inline-flex;
            align-items: center;
            gap: 5px;
          }
          
          .timer-circle {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 5px solid ${currentTheme.accent};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            font-weight: bold;
            margin: 0 auto;
            background: rgba(0, 0, 0, 0.3);
            animation: pulse 1s infinite;
          }
          
          .history-item {
            padding: 10px;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.05);
            margin-bottom: 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .achievement-badge {
            background: linear-gradient(45deg, #ffd700, #ffa500);
            color: black;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.8rem;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            margin: 2px;
          }
          
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
          }
          
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
          
          .shake { animation: shake 0.5s ease-in-out; }
          .bounce { animation: bounce 0.5s ease-in-out; }
          
          .theme-selector {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
          }
          
          .theme-dot {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            border: 3px solid transparent;
          }
          
          .theme-dot.active {
            border-color: white;
            transform: scale(1.2);
          }
          
          .control-btn {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.2);
            color: white;
            transition: all 0.3s;
            cursor: pointer;
          }
          
          .control-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-3px);
          }
          
          .mode-badge {
            padding: 8px 16px;
            border-radius: 20px;
            background: ${currentTheme.accent};
            color: white;
            font-weight: bold;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
        `}
      </style>

      {/* Audio Element */}
      <audio ref={audioRef} preload="auto" />

      <div className="rps-container" style={{ paddingTop: '80px', minHeight: '100vh' }}>
        <div className="container py-5">
          <div ref={gameAreaRef}>
            {/* Header */}
            <div className="text-center mb-5">
              <h1 className="display-4 fw-bold mb-3">
                <FaHandRock className="me-3" />
                Rock Paper Scissors
                <FaHandScissors className="ms-3" />
              </h1>
              <p className="lead mb-4">The ultimate battle of wits and chance</p>
              
              {/* Theme Selector */}
              <div className="theme-selector justify-content-center mb-4">
                {Object.entries(themes).map(([key, themeData]) => (
                  <div
                    key={key}
                    className={`theme-dot ${theme === key ? 'active' : ''}`}
                    style={{ background: themeData.bg }}
                    onClick={() => setTheme(key)}
                    title={key.charAt(0).toUpperCase() + key.slice(1)}
                  />
                ))}
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="game-card">
                  {/* Game Mode & Controls */}
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="mode-badge">
                      <FiZap className="me-2" />
                      {gameMode === 'normal' ? 'Normal Mode' : 'Challenge Mode'}
                    </div>
                    
                    <div className="d-flex gap-3">
                      <button 
                        className="control-btn"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        title={soundEnabled ? "Disable Sound" : "Enable Sound"}
                      >
                        {soundEnabled ? <FiVolume2 /> : <FiVolumeX />}
                      </button>
                      
                      <button 
                        className="control-btn"
                        onClick={() => setShowInstructions(!showInstructions)}
                        title="How to Play"
                      >
                        <FiHelpCircle />
                      </button>
                      
                      <button 
                        className="control-btn"
                        onClick={() => setShowStats(!showStats)}
                        title="Statistics"
                      >
                        <FiTrendingUp />
                      </button>
                      
                      <button 
                        className="control-btn"
                        onClick={resetGame}
                        title="New Game"
                      >
                        <FiRefreshCw />
                      </button>
                    </div>
                  </div>

                  {/* Instructions */}
                  {showInstructions && (
                    <div className="alert alert-info mb-4">
                      <h5><FiHelpCircle className="me-2" /> How to Play</h5>
                      <ul className="mb-0">
                        <li>Rock beats Scissors ✊ beats ✌️</li>
                        <li>Scissors beats Paper ✌️ beats ✋</li>
                        <li>Paper beats Rock ✋ beats ✊</li>
                        <li>Click on your choice to start the round</li>
                        <li>Win 5 in a row for special achievements!</li>
                      </ul>
                    </div>
                  )}

                  {/* Score Board */}
                  <div className="row justify-content-center mb-5">
                    <div className="col-md-8">
                      <div className="d-flex justify-content-around">
                        <div className="score-card text-center">
                          <h5 className="text-primary">YOU</h5>
                          <h2 className="display-3 fw-bold">{score.user}</h2>
                          <small>Wins</small>
                        </div>
                        
                        <div className="score-card text-center">
                          <h5 className="text-warning">DRAWS</h5>
                          <h2 className="display-3 fw-bold">{score.draws}</h2>
                          <small>Ties</small>
                        </div>
                        
                        <div className="score-card text-center">
                          <h5 className="text-danger">COMPUTER</h5>
                          <h2 className="display-3 fw-bold">{score.computer}</h2>
                          <small>Wins</small>
                        </div>
                      </div>
                      
                      {/* Streak & Round */}
                      <div className="d-flex justify-content-center gap-4 mt-3">
                        <div className="streak-badge">
                          <FaFire /> {streak} Win Streak
                        </div>
                        <div className="text-muted">
                          <FiAward className="me-2" />
                          Best Streak: {maxStreak}
                        </div>
                        <div className="text-muted">
                          <FiTarget className="me-2" />
                          Round: {round}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timer Countdown */}
                  {isTimerActive && (
                    <div className="text-center mb-4">
                      <div className="timer-circle">
                        {timer}
                      </div>
                      <p className="mt-3">Get ready!</p>
                    </div>
                  )}

                  {/* Game Area */}
                  {!isTimerActive && (
                    <>
                      {/* Player Choices */}
                      <div className="row justify-content-center mb-5">
                        <div className="col-md-10">
                          <div className="d-flex justify-content-center gap-4">
                            {choices.map(choice => (
                              <button
                                key={choice.id}
                                className={`choice-btn ${userChoice?.id === choice.id ? 'active' : ''} ${isAnimating ? 'disabled' : ''}`}
                                onClick={() => playGame(choice)}
                                disabled={isAnimating}
                                style={{ 
                                  color: choice.color,
                                  borderColor: userChoice?.id === choice.id ? currentTheme.accent : 'transparent'
                                }}
                              >
                                {choice.icon}
                                <span className="choice-name">{choice.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* VS Battle Area */}
                      {(userChoice || computerChoice) && !isTimerActive && (
                        <div className="vs-container mb-4">
                          <div className="vs-badge">VS</div>
                          
                          <div className="row align-items-center">
                            <div className="col-md-5 text-end">
                              <div className="choice-display d-inline-flex">
                                {userChoice?.icon}
                                <span className="choice-name mt-2">{userChoice?.name}</span>
                              </div>
                              <div className="mt-3">
                                <strong>Your Choice</strong>
                              </div>
                            </div>
                            
                            <div className="col-md-2 text-center">
                              {/* VS stays in middle */}
                            </div>
                            
                            <div className="col-md-5">
                              <div className="choice-display d-inline-flex">
                                {computerChoice?.icon}
                                <span className="choice-name mt-2">{computerChoice?.name}</span>
                              </div>
                              <div className="mt-3">
                                <strong>Computer's Choice</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Result Display */}
                      {result && (
                        <div className="text-center">
                          <h2 className={`result-display ${
                            result.includes('win') ? 'win' : 
                            result.includes('lose') ? 'lose' : 'draw'
                          }`}>
                            {result}
                          </h2>
                          
                          {/* Next Move Hint */}
                          {userChoice && (
                            <p className="text-muted">
                              {userChoice.name} {result.includes('win') ? 'beats' : result.includes('lose') ? 'loses to' : 'ties with'} {computerChoice?.name}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Achievements */}
                  {achievements.length > 0 && (
                    <div className="mt-4">
                      <h5><FiAward className="me-2" /> Your Achievements</h5>
                      <div className="d-flex flex-wrap gap-2">
                        {achievements.map((ach, idx) => (
                          <div key={idx} className="achievement-badge">
                            {ach === 'first_10' && '🏆 Decade of Wins'}
                            {ach === 'streak_5' && '🔥 Hot Streak'}
                            {ach === 'round_20' && '⭐ Veteran Player'}
                            {ach === 'first_loss' && '⚔️ First Blood'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* History & Stats */}
                  {showStats && (
                    <div className="mt-4">
                      <h5><FiTrendingUp className="me-2" /> Game History</h5>
                      <div className="history-list">
                        {history.slice().reverse().map((game, idx) => (
                          <div key={idx} className="history-item">
                            <span>Round {game.round}</span>
                            <span>
                              <span className="text-primary">You: {game.user}</span> vs 
                              <span className="text-danger"> Comp: {game.computer}</span>
                            </span>
                            <span className={
                              game.result.includes('win') ? 'text-success' : 
                              game.result.includes('lose') ? 'text-danger' : 'text-warning'
                            }>
                              {game.result}
                            </span>
                          </div>
                        ))}
                        {history.length === 0 && (
                          <p className="text-center text-muted">No games played yet</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="d-flex justify-content-center gap-3 mt-5">
                    <button 
                      className="btn btn-outline-light btn-lg"
                      onClick={resetGame}
                    >
                      <FiRefreshCw className="me-2" />
                      New Round
                    </button>
                    
                    <button 
                      className="btn btn-outline-warning btn-lg"
                      onClick={resetScore}
                    >
                      Reset Score
                    </button>
                    
                    <button 
                      className="btn btn-outline-info btn-lg"
                      onClick={downloadStats}
                    >
                      <FiDownload className="me-2" />
                      Export Stats
                    </button>
                    
                    <button 
                      className="btn btn-outline-success btn-lg"
                      onClick={shareGame}
                    >
                      <FiShare2 className="me-2" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-5">
            <p className="text-muted">
              <small>
                Best of 3? First to 5? Set your own challenges! 🎮
                <br />
                Win rate: {score.user + score.computer > 0 
                  ? `${Math.round((score.user / (score.user + score.computer)) * 100)}%` 
                  : '0%'}
              </small>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}