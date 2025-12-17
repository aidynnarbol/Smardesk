// src/components/ExerciseRecommendation.jsx - УМНЫЕ РЕКОМЕНДАЦИИ
import React, { useState, useEffect } from 'react';
import { Activity, ArrowRight, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { generateExerciseRecommendations, shouldShowExerciseAlert, getExerciseCategory } from '../utils/postureToExercise';

export default function ExerciseRecommendation() {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    loadRecommendations();
    
    // Проверяем алерты каждые 2 минуты
    const alertInterval = setInterval(checkForAlerts, 2 * 60 * 1000);
    
    return () => clearInterval(alertInterval);
  }, []);
  
  const loadRecommendations = async () => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const recs = await generateExerciseRecommendations(user.uid);
      setRecommendations(recs);
      setLoading(false);
    } catch (error) {
      console.error('❌ Recommendations error:', error);
      setLoading(false);
    }
  };
  
  const checkForAlerts = async () => {
    const user = auth.currentUser;
    if (!user || dismissed) return;
    
    try {
      const alertData = await shouldShowExerciseAlert(user.uid);
      if (alertData) {
        setAlert(alertData);
        
        // Показываем браузерное уведомление
        if (Notification.permission === 'granted') {
          new Notification(alertData.title, {
            body: alertData.message,
            icon: '/logo.svg',
            badge: '/logo.svg'
          });
        }
      }
    } catch (error) {
      console.error('❌ Alert check error:', error);
    }
  };
  
  const handleExerciseClick = (exerciseName) => {
    const category = getExerciseCategory(exerciseName);
    navigate('/workout', { state: { category, exercise: exerciseName } });
  };
  
  const dismissAlert = () => {
    setAlert(null);
    setDismissed(true);
    setTimeout(() => setDismissed(false), 10 * 60 * 1000); // Повторная проверка через 10 минут
  };
  
  if (loading) {
    return (
      <div style={{
        background: 'var(--card-color)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 8px 24px var(--shadow-color)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <Activity size={32} style={{ opacity: 0.5, marginBottom: '12px' }} />
          <p>Анализирую вашу осанку...</p>
        </div>
      </div>
    );
  }
  
  // Критический алерт
  if (alert && alert.severity === 'critical') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={{
            background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 107, 107, 0.1))',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(255, 107, 107, 0.3)',
            border: '2px solid rgba(255, 107, 107, 0.5)',
            position: 'relative'
          }}
        >
          <button
            onClick={dismissAlert}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{
              fontSize: '3rem',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}>
              {alert.title.includes('🚨') ? '🚨' : '⚠️'}
            </div>
            
            <div style={{ flex: 1 }}>
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '1.3rem',
                fontWeight: 700,
                color: '#ff6b6b'
              }}>
                {alert.title}
              </h3>
              <p style={{
                margin: '0 0 16px 0',
                fontSize: '1rem',
                color: 'var(--text-color)',
                lineHeight: 1.6
              }}>
                {alert.message}
              </p>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>
                  Рекомендуемые упражнения:
                </strong>
                {alert.exercises.map((ex, i) => (
                  <div
                    key={i}
                    onClick={() => handleExerciseClick(ex)}
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.transform = 'translateX(0)';
                    }}
                  >
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{ex}</span>
                    <ArrowRight size={16} />
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => navigate('/workout')}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#ff6b6b',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#ff5252';
                  e.target.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#ff6b6b';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                {alert.action}
              </button>
            </div>
          </div>
          
          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.1); opacity: 0.8; }
            }
          `}</style>
        </motion.div>
      </AnimatePresence>
    );
  }
  
  // Обычные рекомендации
  if (!recommendations || !recommendations.hasRecommendations) {
    return (
      <div style={{
        background: 'var(--card-color)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 8px 24px var(--shadow-color)',
        border: '1px solid var(--border-color)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📸</div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-color)' }}>
          Нужно больше данных
        </h3>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {recommendations?.message || 'Включите камеру на 5+ минут чтобы получить персональные рекомендации'}
        </p>
        
        {recommendations?.generalExercises && (
          <div style={{ marginTop: '20px', textAlign: 'left' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Пока что попробуйте эти упражнения:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recommendations.generalExercises.map((ex, i) => (
                <div
                  key={i}
                  onClick={() => handleExerciseClick(ex.name)}
                  style={{
                    padding: '10px',
                    background: 'var(--input-bg)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    border: '1px solid var(--border-color)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'var(--card-hover-color)';
                    e.target.style.borderColor = 'var(--accent-color)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'var(--input-bg)';
                    e.target.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-color)' }}>
                    {ex.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {ex.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Персональные рекомендации
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--card-color)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 8px 24px var(--shadow-color)',
        border: '1px solid var(--border-color)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6c63ff, #764ba2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.3rem'
        }}>
          🎯
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-color)' }}>
            Рекомендации для тебя
          </h3>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {recommendations.message}
          </p>
        </div>
      </div>
      
      {/* Главная проблема */}
      <div style={{
        padding: '12px',
        background: 'rgba(255, 187, 40, 0.1)',
        border: '1px solid rgba(255, 187, 40, 0.3)',
        borderRadius: '12px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>{recommendations.mainProblem.icon}</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-color)' }}>
            {recommendations.mainProblem.title}
          </span>
          <span style={{
            marginLeft: 'auto',
            fontSize: '0.85rem',
            color: '#ffbb28',
            fontWeight: 700
          }}>
            {recommendations.mainProblem.frequency}%
          </span>
        </div>
      </div>
      
      {/* Список рекомендаций */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {recommendations.recommendations.map((rec, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => handleExerciseClick(rec.exercise)}
            style={{
              padding: '12px',
              background: 'var(--input-bg)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--card-hover-color)';
              e.currentTarget.style.borderColor = 'var(--accent-color)';
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--input-bg)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--text-color)',
                marginBottom: '4px'
              }}>
                {rec.exercise}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}>
                {rec.reason} • {rec.frequency}%
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                padding: '4px 8px',
                background: rec.priority === 'critical' ? '#ff6b6b20' : rec.priority === 'high' ? '#ffbb2820' : '#6c63ff20',
                color: rec.priority === 'critical' ? '#ff6b6b' : rec.priority === 'high' ? '#ffbb28' : '#6c63ff',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}>
                {rec.priority === 'critical' ? 'Срочно' : rec.priority === 'high' ? 'Важно' : 'Полезно'}
              </span>
              <ArrowRight size={16} color="var(--accent-color)" />
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Кнопка перехода */}
      <button
        onClick={() => navigate('/workout')}
        style={{
          width: '100%',
          padding: '12px',
          marginTop: '16px',
          borderRadius: '12px',
          border: 'none',
          background: 'linear-gradient(135deg, #6c63ff, #764ba2)',
          color: 'white',
          fontWeight: 600,
          fontSize: '0.95rem',
          cursor: 'pointer',
          transition: 'all 0.3s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.02)';
          e.target.style.boxShadow = '0 8px 20px rgba(108, 99, 255, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = 'none';
        }}
      >
        <Activity size={18} />
        Начать упражнения
      </button>
    </motion.div>
  );
}