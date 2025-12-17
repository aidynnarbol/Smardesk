import React, { useState, useEffect } from "react";
import PageWrapper from "../components/PageWrapper.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sun, Moon, Volume2, VolumeX, Bell, 
  Zap, AlertTriangle, Check, Globe
} from "lucide-react";
import "./Settings.css";

export default function Settings() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  
  const [soundSettings, setSoundSettings] = useState(() => {
    const saved = localStorage.getItem("soundSettings");
    return saved ? JSON.parse(saved) : {
      master: 70,
      notifications: 50,
      ui: 30
    };
  });

  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "ru");
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("soundSettings", JSON.stringify(soundSettings));
  }, [soundSettings]);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    showNotification(`Тема изменена на ${newTheme === 'dark' ? 'тёмную' : 'светлую'}`);
    playSound('ui');
  };

  const updateVolume = (type, value) => {
    setSoundSettings(prev => ({
      ...prev,
      [type]: parseInt(value)
    }));
    
    if (type !== 'master') {
      playSound(type);
    }
  };

  const playSound = (type) => {
    const volume = (soundSettings.master / 100) * (soundSettings[type] / 100);
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const soundConfig = {
      ui: { frequency: 800, duration: 0.1 },
      notifications: { frequency: 600, duration: 0.2 }
    };

    const config = soundConfig[type] || soundConfig.ui;

    oscillator.frequency.value = config.frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + config.duration);
  };

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    const langNames = {
      ru: 'Русский',
      en: 'English',
      kz: 'Қазақша',
      es: 'Español'
    };
    showNotification(`Язык изменён на ${langNames[newLang]}`);
    playSound('ui');
  };

  const showNotification = (text) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3000);
  };

  const resetAllSettings = () => {
    if (window.confirm("Вы уверены? Это сбросит ВСЕ настройки к значениям по умолчанию.")) {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");

      const defaultSounds = { master: 70, notifications: 50, ui: 30 };
      setSoundSettings(defaultSounds);
      localStorage.setItem("soundSettings", JSON.stringify(defaultSounds));

      setLanguage("ru");
      localStorage.setItem("language", "ru");

      showNotification("✅ Все настройки сброшены!");
      playSound('notifications');
    }
  };

  const testSound = (type) => {
    playSound(type);
    showNotification(`Тестовый звук: ${type === 'ui' ? 'Интерфейс' : 'Уведомления'}`);
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        changeTheme(theme === 'dark' ? 'light' : 'dark');
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        const newMaster = soundSettings.master === 0 ? 70 : 0;
        updateVolume('master', newMaster);
        showNotification(newMaster === 0 ? '🔇 Звуки отключены' : '🔊 Звуки включены');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [theme, soundSettings]);

  return (
    <PageWrapper>
      <div className="settings-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="settings-title">⚙️ Настройки</h1>
          <p className="settings-subtitle">
            Персонализируйте своё рабочее пространство
          </p>

          <AnimatePresence>
            {notification && (
              <motion.div
                className="notification-toast"
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
              >
                <Check size={20} className="notification-icon" />
                <span className="notification-text">{notification}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className="settings-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="section-header">
              <div className="section-icon">
                {theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
              </div>
              <h2 className="section-title">Тема оформления</h2>
            </div>
            <p className="section-description">
              Выберите тёмную или светлую тему интерфейса. Тема применяется мгновенно ко всему приложению.
            </p>
            <div className="theme-selector">
              <div
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                onClick={() => changeTheme('light')}
              >
                <span className="theme-option-icon">☀️</span>
                <div className="theme-option-label">Светлая</div>
              </div>
              <div
                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => changeTheme('dark')}
              >
                <span className="theme-option-icon">🌙</span>
                <div className="theme-option-label">Тёмная</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="settings-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="section-header">
              <div className="section-icon">
                <Volume2 size={24} />
              </div>
              <h2 className="section-title">Звуки и громкость</h2>
            </div>
            <p className="section-description">
              Настройте громкость звуковых эффектов. Изменения применяются немедленно и сохраняются автоматически.
            </p>
            <div className="sound-controls">
              <div className="sound-item">
                <div className="sound-info">
                  <div className="sound-icon">
                    {soundSettings.master === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </div>
                  <div>
                    <div className="sound-label">Общая громкость</div>
                    <div className="sound-description">Влияет на все звуки в приложении</div>
                  </div>
                </div>
                <div className="volume-control">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={soundSettings.master}
                    onChange={(e) => updateVolume('master', e.target.value)}
                    className="volume-slider"
                  />
                  <span className="volume-value">{soundSettings.master}%</span>
                </div>
              </div>

              <div className="sound-item">
                <div className="sound-info">
                  <div className="sound-icon">
                    <Bell size={20} />
                  </div>
                  <div>
                    <div className="sound-label">Уведомления</div>
                    <div className="sound-description">Звуки важных сообщений</div>
                  </div>
                </div>
                <div className="volume-control">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={soundSettings.notifications}
                    onChange={(e) => updateVolume('notifications', e.target.value)}
                    className="volume-slider"
                    disabled={soundSettings.master === 0}
                  />
                  <span className="volume-value">{soundSettings.notifications}%</span>
                  <button
                    onClick={() => testSound('notifications')}
                    style={{
                      padding: '6px 12px',
                      background: 'var(--accent-color)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}
                  >
                    Тест
                  </button>
                </div>
              </div>

              <div className="sound-item">
                <div className="sound-info">
                  <div className="sound-icon">
                    <Zap size={20} />
                  </div>
                  <div>
                    <div className="sound-label">Интерфейс</div>
                    <div className="sound-description">Клики и переходы</div>
                  </div>
                </div>
                <div className="volume-control">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={soundSettings.ui}
                    onChange={(e) => updateVolume('ui', e.target.value)}
                    className="volume-slider"
                    disabled={soundSettings.master === 0}
                  />
                  <span className="volume-value">{soundSettings.ui}%</span>
                  <button
                    onClick={() => testSound('ui')}
                    style={{
                      padding: '6px 12px',
                      background: 'var(--accent-color)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}
                  >
                    Тест
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="settings-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="section-header">
              <div className="section-icon">
                <Globe size={24} />
              </div>
              <h2 className="section-title">Язык интерфейса</h2>
            </div>
            <p className="section-description">
              Выберите язык для отображения интерфейса приложения.
            </p>
            <div className="language-selector">
              <div
                className={`language-option ${language === 'ru' ? 'active' : ''}`}
                onClick={() => changeLanguage('ru')}
              >
                <span className="language-flag">🇷🇺</span>
                <div className="language-name">Русский</div>
              </div>
              <div
                className={`language-option ${language === 'en' ? 'active' : ''}`}
                onClick={() => changeLanguage('en')}
              >
                <span className="language-flag">🇬🇧</span>
                <div className="language-name">English</div>
              </div>
              <div
                className={`language-option ${language === 'kz' ? 'active' : ''}`}
                onClick={() => changeLanguage('kz')}
              >
                <span className="language-flag">🇰🇿</span>
                <div className="language-name">Қазақша</div>
              </div>
              <div
                className={`language-option ${language === 'es' ? 'active' : ''}`}
                onClick={() => changeLanguage('es')}
              >
                <span className="language-flag">🇪🇸</span>
                <div className="language-name">Español</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="settings-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="section-header">
              <div className="section-icon">
                <Zap size={24} />
              </div>
              <h2 className="section-title">Горячие клавиши</h2>
            </div>
            <p className="section-description">
              Используйте сочетания клавиш для быстрого доступа к функциям.
            </p>
            <div className="hotkeys-list">
              <div className="hotkey-item">
                <span className="hotkey-action">Переключить тему</span>
                <div className="hotkey-keys">
                  <span className="hotkey-key">Ctrl</span>
                  <span className="hotkey-key">D</span>
                </div>
              </div>
              <div className="hotkey-item">
                <span className="hotkey-action">Включить/выключить звуки</span>
                <div className="hotkey-keys">
                  <span className="hotkey-key">Ctrl</span>
                  <span className="hotkey-key">M</span>
                </div>
              </div>
              <div className="hotkey-item">
                <span className="hotkey-action">Открыть настройки</span>
                <div className="hotkey-keys">
                  <span className="hotkey-key">Ctrl</span>
                  <span className="hotkey-key">,</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="settings-section danger-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="section-header">
              <div className="section-icon">
                <AlertTriangle size={24} />
              </div>
              <h2 className="section-title">Сброс настроек</h2>
            </div>
            <p className="section-description">
              Вернуть все настройки к значениям по умолчанию. Это действие необратимо.
            </p>
            <button onClick={resetAllSettings} className="reset-button">
              🔄 Сбросить все настройки
            </button>
          </motion.div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}