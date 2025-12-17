import React, { useState, useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle2, Circle, Trash2, Plus, X, 
  Lightbulb, Clock, Dumbbell, MessageSquare,
  Zap, AlertCircle, TrendingUp, Eye, Activity
} from "lucide-react";
import PageWrapper from "../components/PageWrapper.jsx";
import CameraIndicator from "../components/CameraIndicator.js";
import { CameraContext } from "../context/CameraContext.js";
import "./MainPage.css";

export default function MainPage() {
  const { cameraOn, toggleCamera } = useContext(CameraContext);
  const navigate = useNavigate();

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem("notes");
    return saved ? JSON.parse(saved) : [];
  });
  const [newTask, setNewTask] = useState("");
  const [newNote, setNewNote] = useState("");
  const [completedTasks, setCompletedTasks] = useState(new Set());
  
  const [posture, setPosture] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [showAdviceCard, setShowAdviceCard] = useState(false);
  const [adviceGlow, setAdviceGlow] = useState(false);
  const [autoExpandTimer, setAutoExpandTimer] = useState(null);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [tasks, notes]);

  useEffect(() => {
    if (!cameraOn) {
      setAdvice(null);
      setShowAdviceCard(false);
      setAdviceGlow(false);
      if (autoExpandTimer) {
        clearTimeout(autoExpandTimer);
        setAutoExpandTimer(null);
      }
    }
  }, [cameraOn]);

  useEffect(() => {
    if (!cameraOn || tasks.length === 0) return;
    
    const checkInterval = setInterval(() => {
      const now = Date.now();
      const oldTasks = tasks.filter(task => {
        const age = now - task.createdAt;
        const hoursOld = age / (1000 * 60 * 60);
        return hoursOld > 24;
      });
      
      if (oldTasks.length > 0 && (!advice || advice.type !== 'old_task_reminder')) {
        handleAdviceChange({
          title: "Старые задачи требуют внимания",
          text: `У вас ${oldTasks.length} задач${oldTasks.length > 1 ? 'и' : 'а'} старше 24 часов. Может пора их завершить?`,
          actionText: "Посмотреть задачи",
          type: "old_task_reminder",
          priority: "medium",
          icon: "📋"
        });
      }
    }, 60000);
    
    return () => clearInterval(checkInterval);
  }, [cameraOn, tasks, advice]);

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((s) => [...s, { 
      text: newTask.trim(), 
      id: Date.now(),
      createdAt: Date.now()
    }]);
    setNewTask("");
  };

  const addNote = () => {
    if (!newNote.trim()) return;
    setNotes((s) => [...s, { 
      text: newNote.trim(), 
      id: Date.now(),
      createdAt: Date.now()
    }]);
    setNewNote("");
  };

  const toggleTaskCompletion = (id) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const deleteTask = (id) => {
    setTasks((s) => s.filter((t) => t.id !== id));
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };
  
  const deleteNote = (id) => setNotes((s) => s.filter((n) => n.id !== id));
  
  const isOldTask = (task) => {
    const age = Date.now() - task.createdAt;
    const hoursOld = age / (1000 * 60 * 60);
    return hoursOld > 24;
  };
  
  const getTimeAgo = (timestamp) => {
    const age = Date.now() - timestamp;
    const hours = Math.floor(age / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}д`;
    if (hours > 0) return `${hours}ч`;
    return 'сейчас';
  };
  
  const handleAdviceChange = (newAdvice) => {
    if (newAdvice && (!advice || advice.type !== newAdvice.type || !showAdviceCard)) {
      console.log('✅ Совет принят:', newAdvice.type);
      setAdvice(newAdvice);
      setAdviceGlow(true);
      setShowAdviceCard(false);
      
      if (autoExpandTimer) clearTimeout(autoExpandTimer);
      
      const timer = setTimeout(() => {
        setShowAdviceCard(true);
      }, 1500);
      setAutoExpandTimer(timer);
      
      setTimeout(() => setAdviceGlow(false), 30000);
    }
  };
  
  useEffect(() => {
    return () => {
      if (autoExpandTimer) clearTimeout(autoExpandTimer);
    };
  }, [autoExpandTimer]);
  
  const handleAdviceAction = () => {
    if (advice && advice.link) navigate(advice.link);
    setShowAdviceCard(false);
    setAdviceGlow(false);
    if (autoExpandTimer) clearTimeout(autoExpandTimer);
  };
  
  const handleWorkoutAction = () => {
    navigate('/workout');
    setShowAdviceCard(false);
    setAdviceGlow(false);
    if (autoExpandTimer) clearTimeout(autoExpandTimer);
  };
  
  const handleAdviceClose = () => {
    setShowAdviceCard(false);
    setAdviceGlow(false);
    if (autoExpandTimer) clearTimeout(autoExpandTimer);
  };
  
  const handleBulbClick = () => {
    if (advice) {
      setShowAdviceCard(!showAdviceCard);
      if (autoExpandTimer) {
        clearTimeout(autoExpandTimer);
        setAutoExpandTimer(null);
      }
    }
  };
  
  const needsWorkout = advice && (
    advice.type === 'chronic_slouch' ||
    advice.type === 'long_session' ||
    advice.type === 'severe_fatigue' ||
    advice.type === 'eye_rest'
  );

  const activeTasks = tasks.filter(t => !completedTasks.has(t.id));
  const completedTasksList = tasks.filter(t => completedTasks.has(t.id));

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return { bg: 'rgba(255, 59, 48, 0.15)', border: '#ff3b30', glow: 'rgba(255, 59, 48, 0.4)' };
      case 'high': return { bg: 'rgba(255, 187, 40, 0.15)', border: '#ffbb28', glow: 'rgba(255, 187, 40, 0.4)' };
      default: return { bg: 'rgba(108, 99, 255, 0.15)', border: '#6c63ff', glow: 'rgba(108, 99, 255, 0.4)' };
    }
  };

  const getAdviceIcon = (type, priority) => {
    if (priority === 'critical') return '🚨';
    if (priority === 'high') return '⚠️';
    if (type === 'old_task_reminder') return '📋';
    return '💡';
  };

  return (
    <PageWrapper>
      <div className="hero-main-page">
        {/* Hero Section */}
        <motion.div 
          className="hero-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="hero-background">
            <div className="gradient-orb orb-1"></div>
            <div className="gradient-orb orb-2"></div>
            <div className="gradient-orb orb-3"></div>
          </div>

          <motion.div 
            className="hero-content"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h1 className="hero-title">
              Smardesk
              <span className="hero-subtitle">Ваш умный помощник для здоровья и продуктивности</span>
            </h1>

            <div className="hero-stats">
              <div className="hero-stat">
                <Activity size={20} />
                <span>{activeTasks.length} активных задач</span>
              </div>
              <div className="hero-stat">
                <CheckCircle2 size={20} />
                <span>{completedTasksList.length} завершено сегодня</span>
              </div>
              <div className="hero-stat">
                <TrendingUp size={20} />
                <span>{cameraOn ? 'Отслеживание активно' : 'Камера выключена'}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="hero-grid">
          {/* Camera Section - Featured */}
          <motion.div 
            className="camera-hero-card"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="camera-hero-header">
              <div className="camera-status-indicator" style={{
                background: cameraOn ? 'linear-gradient(135deg, #00c49f, #06b6d4)' : 'linear-gradient(135deg, #666, #888)'
              }}>
                <Eye size={24} />
              </div>
              <div>
                <h2>Отслеживание осанки</h2>
                <p>{cameraOn ? 'Камера активна' : 'Включите камеру для мониторинга'}</p>
              </div>
              <motion.button
                className={`camera-hero-toggle ${cameraOn ? 'active' : ''}`}
                onClick={toggleCamera}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {cameraOn ? 'Выкл' : 'Вкл'}
              </motion.button>
            </div>

            <div className="camera-preview">
              <CameraIndicator 
                onPostureChange={setPosture}
                onAdviceChange={handleAdviceChange}
              />
            </div>

            {/* Posture Status Bar */}
            <AnimatePresence>
              {cameraOn && posture && (
                <motion.div
                  className="posture-status-bar"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{ 
                    background: `linear-gradient(90deg, ${posture.color}20, transparent)`,
                    borderLeft: `3px solid ${posture.color}`
                  }}
                >
                  <div className="posture-status-content">
                    <span className="posture-emoji">
                      {posture.color === '#00c49f' ? '✅' : 
                       posture.color === '#ffbb28' ? '⚠️' : '❌'}
                    </span>
                    <div>
                      <strong style={{ color: posture.color }}>{posture.message}</strong>
                      {posture.detail && <p>{posture.detail}</p>}
                    </div>
                  </div>
                  <button 
                    className="ask-ai-btn"
                    onClick={() => navigate('/chatbot')}
                  >
                    <MessageSquare size={16} />
                    Спросить AI
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Smart Advice System */}
            <AnimatePresence>
              {cameraOn && advice && (
                <motion.div
                  className="smart-advice-panel"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <div 
                    className="advice-glow-border"
                    style={{ 
                      background: `linear-gradient(135deg, ${getPriorityColor(advice.priority).border}, transparent)`,
                      boxShadow: showAdviceCard ? `0 0 30px ${getPriorityColor(advice.priority).glow}` : 'none'
                    }}
                  >
                    <div className="advice-panel-header">
                      <div className="advice-icon-wrapper" style={{ 
                        background: getPriorityColor(advice.priority).bg,
                        borderColor: getPriorityColor(advice.priority).border
                      }}>
                        <span className="advice-icon-large">
                          {getAdviceIcon(advice.type, advice.priority)}
                        </span>
                      </div>
                      <div className="advice-info">
                        <h3>{advice.title}</h3>
                        <span className="advice-priority" style={{ 
                          color: getPriorityColor(advice.priority).border 
                        }}>
                          {advice.priority === 'critical' ? 'Критично' :
                           advice.priority === 'high' ? 'Важно' : 'Рекомендация'}
                        </span>
                      </div>
                      <button 
                        className="advice-expand-btn"
                        onClick={handleBulbClick}
                      >
                        <Lightbulb size={20} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {showAdviceCard && (
                        <motion.div
                          className="advice-details"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p className="advice-text">{advice.text}</p>
                          <div className="advice-actions-row">
                            {needsWorkout && (
                              <button 
                                className="advice-action-btn primary"
                                onClick={handleWorkoutAction}
                              >
                                <Dumbbell size={16} />
                                Упражнения
                              </button>
                            )}
                            {advice.link && (
                              <button 
                                className="advice-action-btn secondary"
                                onClick={handleAdviceAction}
                              >
                                {advice.actionText || "Перейти"}
                              </button>
                            )}
                            <button 
                              className="advice-action-btn ghost"
                              onClick={handleAdviceClose}
                            >
                              Понятно
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Quick Actions Column */}
          <div className="quick-actions-column">
            {/* Tasks Card */}
            <motion.div 
              className="quick-card tasks-card"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <div className="quick-card-header">
                <h3>
                  <span className="card-icon" style={{ background: 'linear-gradient(135deg, #ff6584, #ff8fab)' }}>
                    ✓
                  </span>
                  Задачи
                </h3>
                <span className="task-counter">{activeTasks.length}</span>
              </div>

              <div className="quick-input">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Добавить задачу..."
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                />
                <button onClick={addTask} disabled={!newTask.trim()}>
                  <Plus size={18} />
                </button>
              </div>

              <div className="tasks-compact-list">
                <AnimatePresence>
                  {activeTasks.slice(0, 5).map((task) => (
                    <motion.div
                      key={task.id}
                      className={`task-compact ${isOldTask(task) ? 'old' : ''}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      layout
                    >
                      <button 
                        className="task-check"
                        onClick={() => toggleTaskCompletion(task.id)}
                      >
                        <Circle size={16} />
                      </button>
                      <span className="task-text">{task.text}</span>
                      <button 
                        className="task-remove"
                        onClick={() => deleteTask(task.id)}
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {activeTasks.length === 0 && (
                  <div className="empty-compact">
                    <span>Нет активных задач</span>
                  </div>
                )}
                {activeTasks.length > 5 && (
                  <div className="show-more">
                    +{activeTasks.length - 5} ещё
                  </div>
                )}
              </div>
            </motion.div>

            {/* Notes Card */}
            <motion.div 
              className="quick-card notes-card"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className="quick-card-header">
                <h3>
                  <span className="card-icon" style={{ background: 'linear-gradient(135deg, #00c49f, #06b6d4)' }}>
                    📝
                  </span>
                  Заметки
                </h3>
                <span className="task-counter">{notes.length}</span>
              </div>

              <div className="quick-input">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Добавить заметку..."
                  onKeyDown={(e) => e.key === "Enter" && addNote()}
                />
                <button onClick={addNote} disabled={!newNote.trim()}>
                  <Plus size={18} />
                </button>
              </div>

              <div className="notes-mini-grid">
                <AnimatePresence>
                  {notes.slice(0, 4).map((note) => (
                    <motion.div
                      key={note.id}
                      className="note-mini"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      layout
                    >
                      <p>{note.text}</p>
                      <button 
                        className="note-remove"
                        onClick={() => deleteNote(note.id)}
                      >
                        <X size={12} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {notes.length === 0 && (
                  <div className="empty-compact">
                    <span>Нет заметок</span>
                  </div>
                )}
              </div>
              {notes.length > 4 && (
                <div className="show-more">
                  +{notes.length - 4} ещё
                </div>
              )}
            </motion.div>

            {/* Quick Links */}
            <motion.div 
              className="quick-links-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <button 
                className="quick-link-btn"
                onClick={() => navigate('/statistics')}
              >
                <TrendingUp size={18} />
                Статистика
              </button>
              <button 
                className="quick-link-btn"
                onClick={() => navigate('/workout')}
              >
                <Dumbbell size={18} />
                Упражнения
              </button>
              <button 
                className="quick-link-btn"
                onClick={() => navigate('/chatbot')}
              >
                <MessageSquare size={18} />
                AI Помощник
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}