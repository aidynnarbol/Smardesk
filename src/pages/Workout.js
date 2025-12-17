import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Flame, CheckCircle, Clock, Zap, Volume2, VolumeX, RotateCcw, SkipForward, Maximize2, Minimize2, Play, Pause, ChevronRight, ChevronDown } from "lucide-react";
import categories from "../data/exerciseDatabase";
import "./Workout.css";

const FormattedAIMessage = ({ text }) => {
  const formatText = (str) => {
    str = str.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    str = str.replace(/\*([^\*]+?)\*/g, '<em>$1</em>');
    str = str.replace(/`(.+?)`/g, '<code style="background: rgba(108, 99, 255, 0.12); padding: 3px 7px; border-radius: 5px; font-family: monospace; font-size: 0.9em;">$1</code>');
    return str;
  };
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  return (
    <div style={{ fontSize: "0.9rem", lineHeight: "1.7" }}>
      {paragraphs.map((para, idx) => {
        if (para.startsWith('### ')) return <h3 key={idx} style={{ margin: "14px 0 10px 0", fontSize: "1.05rem", fontWeight: "600" }}>{para.replace('### ', '')}</h3>;
        if (para.startsWith('## ')) return <h2 key={idx} style={{ margin: "16px 0 12px 0", fontSize: "1.15rem", fontWeight: "600" }}>{para.replace('## ', '')}</h2>;
        if (para.includes('\n- ') || para.startsWith('- ')) {
          const items = para.split('\n').filter(line => line.trim());
          return (<ul key={idx} style={{ margin: "10px 0", paddingLeft: "22px", listStyle: "none" }}>{items.map((item, i) => {const cleaned = item.replace(/^[•\-]\s*/, '').trim(); if (!cleaned) return null; return <li key={i} style={{ marginBottom: "8px", paddingLeft: "8px", position: "relative" }}><span style={{ position: "absolute", left: "-16px", color: "#6c63ff" }}>•</span><span dangerouslySetInnerHTML={{ __html: formatText(cleaned) }} /></li>;})}</ul>);
        }
        return <p key={idx} style={{ margin: "10px 0" }} dangerouslySetInnerHTML={{ __html: formatText(para) }} />;
      })}
    </div>
  );
};

export default function Workout() {
  const [activeCategory, setActiveCategory] = useState("Осанка и спина");
  const [mainIndex, setMainIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timer, setTimer] = useState(categories[activeCategory][mainIndex].duration);
  const [tipIndex, setTipIndex] = useState(0);
  const [showAI, setShowAI] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [exerciseListExpanded, setExerciseListExpanded] = useState(false);
  const [completedExercises, setCompletedExercises] = useState(() => {
    const saved = localStorage.getItem("completedExercises");
    return saved ? JSON.parse(saved) : [];
  });
  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem("workoutStreak");
    return saved ? JSON.parse(saved) : 0;
  });
  const videoContainerRef = useRef(null);
  const timerRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    setTimer(categories[activeCategory][mainIndex].duration);
    setIsPlaying(false);
    setTipIndex(0);
  }, [activeCategory, mainIndex]);

  useEffect(() => {
    if (isPlaying && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            handleComplete();
            if (soundOn) playSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, timer, soundOn]);

  useEffect(() => {
    if (isPlaying) {
      const tipInterval = setInterval(() => {
        setTipIndex(prev => (prev + 1) % categories[activeCategory][mainIndex].tips.length);
      }, 7000);
      return () => clearInterval(tipInterval);
    }
  }, [isPlaying, activeCategory, mainIndex]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  const playSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGa+7OihUBELTKXh8LRiHAU2j9TxzHksBSR3x+/dj0AKE12z6OymUxMMRp7f8r5sIQUrlc7y2Ik2CBhluuzooVARC0yk4u+0YhwFNo/U8cx5LAUkd8fv3Y9AChNdtOjspVMTDEWe3/K+bCEFK5XO8tmJNggYZbrs6KFQEQtMpOLvtGIcBTaP1PHMeSwFJHfH792PQAoTXbTo7KVTEwxFnt/yvmwhBSuVzvLZiTYIGGW67OihUBELTKTi77RiHAU2j9TxzHksBSR3x+/dj0AKE1206OylUxMMRZ7f8r5sIQUrlc7y2Ik2CBhluuzooVARC0yk4u+0YhwFNo/U8cx5LAUkd8fv3Y9AChNdtOjspVMTDEWe3/K+bCEFK5XO8tmJNggYZbrs6KFQEQtMpOLvtGIcBTaP1PHMeSwFJHfH792PQAoTXbTo7KVTEwxFnt/yvmwhBSuVzvLZiTYIGGW67OihUBELTKTi77RiHAU2j9TxzHksBSR3x+/dj0AKE1206OylUxMMRZ7f8r5sIQUrlc7y2Ik2CBhluuzooVARC0yk4u+0YhwFNo/U8cx5LAUkd8fv3Y9AChNdtOjspVMTDEWe3/K+bCEFK5XO8tmJNggYZbrs6KFQEQtMpOLvtGIcBTaP1PHMeSwFJHfH792PQAoTXbTo7KVTEwxFnt/yvmwhBSuVzvLZiTYIGGW67OihUBELTKTi77RiHAU2j9TxzHksBSR3x+/dj0AKE1206OylUxMMRZ7f8r5sIQUrlc7y2Ik2CBhluuzooVARC0yk4u+0YhwFNo/U8cx5LAUkd8fv');
    audio.volume = 0.25;
    audio.play().catch(() => {});
  };

  const handleComplete = () => {
    const today = new Date().toISOString().split('T')[0];
    const exerciseName = categories[activeCategory][mainIndex].name;
    const newCompleted = [...completedExercises, { name: exerciseName, date: today }];
    setCompletedExercises(newCompleted);
    localStorage.setItem("completedExercises", JSON.stringify(newCompleted));
    
    const todayCompleted = newCompleted.filter(e => e.date === today);
    if (todayCompleted.length === 1) {
      setStreak(prev => {
        const newStreak = prev + 1;
        localStorage.setItem("workoutStreak", JSON.stringify(newStreak));
        return newStreak;
      });
    }
  };

  const sendAIMessage = async () => {
    if (!aiInput.trim()) return;
    const userMsg = aiInput;
    setAiInput("");
    setAiMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setAiLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Вопрос об упражнении "${categories[activeCategory][mainIndex].name}": ${userMsg}` })
      });
      const data = await response.json();
      setAiMessages(prev => [...prev, { role: "bot", text: data.reply }]);
    } catch (error) {
      setAiMessages(prev => [...prev, { role: "bot", text: "Ошибка связи с AI. Попробуй ещё раз." }]);
    }
    setAiLoading(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const currentExercise = categories[activeCategory][mainIndex];
  const progress = ((categories[activeCategory][mainIndex].duration - timer) / categories[activeCategory][mainIndex].duration) * 100;
  const todayCount = completedExercises.filter(e => e.date === new Date().toISOString().split('T')[0]).length;

  return (
    <div className="workout-page">
      <div className="workout-container">
        {/* Header */}
        <motion.div 
          className="workout-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="header-left">
            <h1 className="page-title">Упражнения</h1>
            <p className="page-subtitle">Профессиональная программа тренировок</p>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <Flame className="stat-icon" size={20} />
              <div className="stat-content">
                <span className="stat-value">{streak}</span>
                <span className="stat-label">дней подряд</span>
              </div>
            </div>
            <div className="stat-card">
              <CheckCircle className="stat-icon" size={20} />
              <div className="stat-content">
                <span className="stat-value">{todayCount}</span>
                <span className="stat-label">сегодня</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Categories */}
        <div className="categories-nav">
          {Object.keys(categories).map((cat) => (
            <button
              key={cat}
              className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory(cat);
                setMainIndex(0);
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Main Grid */}
        <div className="workout-grid">
          {/* Left - Video & Info Combined */}
          <div className="video-section">
            <div className="video-card">
              {/* Video Player */}
              <div 
                ref={videoContainerRef}
                className={`video-player ${isFullscreen ? 'fullscreen' : ''}`}
              >
                <img
                  src={currentExercise.file}
                  alt={currentExercise.name}
                  className="exercise-video"
                  onError={(e) => {
                    console.error('Failed to load image:', currentExercise.file);
                    e.target.src = 'https://via.placeholder.com/800x500?text=Упражнение+не+загрузилось';
                  }}
                />
                
                {/* Overlay */}
                <div className="video-overlay">
                  <button 
                    className="fullscreen-btn"
                    onClick={toggleFullscreen}
                  >
                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>
                  
                  {isPlaying && (
                    <div className="playing-indicator">
                      <div className="pulse-ring" />
                      <span className="pulse-dot" />
                    </div>
                  )}
                </div>

                {/* Progress */}
                {isPlaying && (
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                {/* Fullscreen Timer */}
                {isFullscreen && (
                  <div className="fullscreen-timer">
                    <div className="fullscreen-timer-digits">
                      {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="fullscreen-timer-label">
                      {isPlaying ? '⏱ Идет отсчет' : '⏸ Пауза'}
                    </div>
                  </div>
                )}
              </div>

              {/* Exercise Info */}
              <div className="exercise-info">
                <h2 className="exercise-title">{currentExercise.name}</h2>
                <div className="exercise-meta">
                  <span className="meta-badge">
                    <Clock size={14} />
                    {currentExercise.duration}с
                  </span>
                  <span className="meta-badge difficulty">{currentExercise.difficulty}</span>
                  {currentExercise.muscles && currentExercise.muscles.map((muscle, i) => (
                    <span key={i} className="meta-badge">{muscle}</span>
                  ))}
                </div>

                {/* Benefits */}
                {currentExercise.benefits && (
                  <div className="benefits-banner">
                    <Zap size={16} />
                    <p>{currentExercise.benefits}</p>
                  </div>
                )}

                {/* Tips */}
                <div className="tips-section">
                  <div className="tips-header">
                    <span>Техника выполнения</span>
                    <div className="tips-dots">
                      {currentExercise.tips.map((_, i) => (
                        <span 
                          key={i} 
                          className={`tip-dot ${i === tipIndex ? 'active' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tipIndex}
                      className="tip-content"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      <ChevronRight size={16} />
                      <p>{currentExercise.tips[tipIndex]}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Timer & Controls */}
                <div className="controls-section">
                  <div className="timer-display">
                    <div className={`timer-digits ${timer < 10 ? 'warning' : ''}`}>
                      {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="timer-status">
                      {timer === 0 ? '✓ Завершено' : isPlaying ? '⏱ Идет отсчет' : '⏸ Пауза'}
                    </div>
                  </div>

                  <div className="control-buttons">
                    <button
                      className="btn-play"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                      <span>{isPlaying ? 'Пауза' : 'Начать'}</span>
                    </button>
                    
                    <button
                      className="btn-icon"
                      onClick={() => {
                        setTimer(categories[activeCategory][mainIndex].duration);
                        setIsPlaying(false);
                      }}
                      title="Сбросить"
                    >
                      <RotateCcw size={18} />
                    </button>

                    <button
                      className="btn-icon"
                      onClick={() => setMainIndex((mainIndex + 1) % categories[activeCategory].length)}
                      title="Следующее"
                    >
                      <SkipForward size={18} />
                    </button>

                    <button
                      className={`btn-icon ${soundOn ? 'active' : ''}`}
                      onClick={() => setSoundOn(!soundOn)}
                      title="Звук"
                    >
                      {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="sidebar-section">
            {/* Exercise List - Collapsible */}
            <div 
              className={`exercise-list-card ${exerciseListExpanded ? 'expanded' : ''}`}
              onMouseEnter={() => setExerciseListExpanded(true)}
              onMouseLeave={() => setExerciseListExpanded(false)}
            >
              <div className="card-header">
                <h3>Программа</h3>
                <div className="card-header-right">
                  <span className="exercise-count">{categories[activeCategory].length}</span>
                  <ChevronDown 
                    size={18} 
                    className={`expand-icon ${exerciseListExpanded ? 'rotated' : ''}`}
                  />
                </div>
              </div>
              
              <AnimatePresence>
                {exerciseListExpanded && (
                  <motion.div
                    className="exercise-list"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {categories[activeCategory].map((ex, idx) => (
                      <div
                        key={idx}
                        className={`exercise-item ${idx === mainIndex ? 'active' : ''}`}
                        onClick={() => setMainIndex(idx)}
                      >
                        <div className="exercise-number">{idx + 1}</div>
                        <div className="exercise-content">
                          <div className="exercise-name">{ex.name}</div>
                          <div className="exercise-duration">
                            <Clock size={12} />
                            {ex.duration}с
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* AI Assistant */}
            <div className="ai-card">
              <button
                className={`ai-toggle ${showAI ? 'active' : ''}`}
                onClick={() => setShowAI(!showAI)}
              >
                <MessageCircle size={18} />
                <span>AI помощник</span>
              </button>

              <AnimatePresence>
                {showAI && (
                  <motion.div
                    className="ai-chat"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <div className="ai-messages">
                      {aiMessages.length === 0 ? (
                        <div className="ai-empty">
                          <MessageCircle size={28} />
                          <p>Задай вопрос об упражнении</p>
                        </div>
                      ) : (
                        <>
                          {aiMessages.map((msg, idx) => (
                            <div key={idx} className={`ai-message ${msg.role}`}>
                              <div className="message-bubble">
                                {msg.role === "bot" ? (
                                  <FormattedAIMessage text={msg.text} />
                                ) : (
                                  msg.text
                                )}
                              </div>
                            </div>
                          ))}
                          <div ref={chatEndRef} />
                        </>
                      )}
                      {aiLoading && (
                        <div className="ai-loading">
                          <div className="loading-dots">
                            <span /><span /><span />
                          </div>
                          AI думает...
                        </div>
                      )}
                    </div>
                    <div className="ai-input-wrapper">
                      <input
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !aiLoading && sendAIMessage()}
                        placeholder="Напиши вопрос..."
                        disabled={aiLoading}
                      />
                      <button
                        onClick={sendAIMessage}
                        disabled={aiLoading || !aiInput.trim()}
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}