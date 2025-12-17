// src/hooks/useSiteTracker.js - ИСПРАВЛЕННАЯ ВЕРСИЯ С DEBUG
import { useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export function useSiteTracker() {
  const lastSiteRef = useRef(null);
  const startTimeRef = useRef(null);
  const isActiveRef = useRef(false);
  const recordingIndicatorRef = useRef(null);

  useEffect(() => {
    // Создаём визуальный индикатор
    const createRecordingIndicator = () => {
      const indicator = document.createElement('div');
      indicator.id = 'smardesk-recording-indicator';
      indicator.innerHTML = `
        <div style="
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 10px 18px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 9999;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          animation: pulse 2s ease-in-out infinite;
          cursor: pointer;
        " onclick="console.log('Tracker active')">
          <span style="
            width: 8px;
            height: 8px;
            background: #ff6b6b;
            border-radius: 50%;
            animation: blink 1s ease-in-out infinite;
          "></span>
          🔴 Трекер активен
        </div>
        <style>
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.95; }
            50% { transform: scale(1.03); opacity: 1; }
          }
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        </style>
      `;
      document.body.appendChild(indicator);
      return indicator;
    };

    const getCurrentSite = () => {
      // Получаем полный hostname
      const hostname = window.location.hostname || 'localhost';
      console.log('🌐 Current hostname:', hostname);
      return hostname;
    };

    // 🔍 СУПЕР-УМНЫЙ алгоритм сопоставления
    const matchSite = (currentSite, trackedSites) => {
      const currentLower = currentSite.toLowerCase().replace('www.', '');
      
      console.log('🔎 Matching:', currentLower, 'against:', trackedSites);
      
      for (const trackedSite of trackedSites) {
        const trackedLower = trackedSite.toLowerCase().replace('www.', '');
        
        // 1. Точное совпадение
        if (currentLower === trackedLower) {
          console.log('✅ Exact match:', trackedSite);
          return trackedSite;
        }
        
        // 2. Текущий содержит отслеживаемый (например youtube.com содержит youtube)
        if (currentLower.includes(trackedLower)) {
          console.log('✅ Contains match:', trackedSite);
          return trackedSite;
        }
        
        // 3. Отслеживаемый содержит текущий
        if (trackedLower.includes(currentLower)) {
          console.log('✅ Reverse match:', trackedSite);
          return trackedSite;
        }
        
        // 4. Совпадение основы домена (youtube vs youtube.com)
        const currentBase = currentLower.split('.')[0];
        const trackedBase = trackedLower.split('.')[0];
        if (currentBase === trackedBase && currentBase.length > 2) {
          console.log('✅ Base match:', trackedSite);
          return trackedSite;
        }
      }
      
      console.log('❌ No match found');
      return null;
    };

    const logActivity = async (site, duration = 0) => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.log('⚠️ Tracker: Пользователь не авторизован');
          return;
        }

        const savedSites = localStorage.getItem("smardeskSites");
        if (!savedSites) {
          console.log('⚠️ Tracker: Список сайтов не настроен (перейди в Настройки)');
          return;
        }

        const { study = [], fun = [] } = JSON.parse(savedSites);
        const allSites = [...study, ...fun];

        if (allSites.length === 0) {
          console.log('⚠️ Tracker: Список сайтов пуст');
          return;
        }

        console.log('📋 Configured sites:', allSites);

        // Используем умный алгоритм
        const matchedSite = matchSite(site, allSites);

        if (!matchedSite) {
          console.log(`⚠️ Сайт "${site}" НЕ отслеживается`);
          console.log('💡 Добавь его в Настройках!');
          return;
        }

        // Определяем категорию
        const category = matchSite(site, study) ? 'study' : 'fun';
        const today = new Date().toISOString().split('T')[0];

        // Записываем в Firebase
        await addDoc(collection(db, "siteActivity"), {
          userId: user.uid,
          site: matchedSite,
          originalSite: site,
          category: category,
          duration: duration,
          timestamp: serverTimestamp(),
          sessionDate: today
        });

        console.log(`✅ ЗАПИСАНО: ${matchedSite} (${category}) - ${duration}с`);
        
        // Обновляем индикатор
        if (recordingIndicatorRef.current) {
          const text = recordingIndicatorRef.current.querySelector('div');
          if (text) {
            text.style.animation = 'none';
            setTimeout(() => {
              text.style.animation = 'pulse 2s ease-in-out infinite';
            }, 10);
          }
        }
      } catch (error) {
        console.error('❌ Tracker error:', error);
      }
    };

    const handleVisibilityChange = () => {
      const currentSite = getCurrentSite();

      if (document.hidden) {
        console.log('👋 Вкладка скрыта');
        // Сохраняем время
        if (lastSiteRef.current && startTimeRef.current && isActiveRef.current) {
          const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
          if (duration >= 2) { // Минимум 2 секунды
            console.log(`💾 Сохраняю ${duration}с на ${lastSiteRef.current}`);
            logActivity(lastSiteRef.current, duration);
          }
        }
        isActiveRef.current = false;
        startTimeRef.current = null;
        
        if (recordingIndicatorRef.current) {
          recordingIndicatorRef.current.style.display = 'none';
        }
      } else {
        console.log('👀 Вкладка активна');
        // Начинаем отсчет
        lastSiteRef.current = currentSite;
        startTimeRef.current = Date.now();
        isActiveRef.current = true;
        logActivity(currentSite, 0); // Начало сессии
        
        if (recordingIndicatorRef.current) {
          recordingIndicatorRef.current.style.display = 'block';
        }
      }
    };

    const handleBeforeUnload = () => {
      if (lastSiteRef.current && startTimeRef.current && isActiveRef.current) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (duration >= 2) {
          console.log(`💾 Сохраняю перед закрытием: ${duration}с`);
          logActivity(lastSiteRef.current, duration);
        }
      }
    };

    // 🚀 ИНИЦИАЛИЗАЦИЯ
    console.log('🚀 === TRACKER STARTED ===');
    const currentSite = getCurrentSite();
    lastSiteRef.current = currentSite;
    startTimeRef.current = Date.now();
    isActiveRef.current = true;
    logActivity(currentSite, 0);

    // Создаём индикатор
    recordingIndicatorRef.current = createRecordingIndicator();

    // События
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Периодическое сохранение каждые 15 секунд
    const intervalId = setInterval(() => {
      if (!document.hidden && isActiveRef.current && lastSiteRef.current && startTimeRef.current) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (duration >= 15) {
          console.log(`⏰ Автосохранение: ${duration}с`);
          logActivity(lastSiteRef.current, duration);
          startTimeRef.current = Date.now(); // Сброс таймера
        }
      }
    }, 15000);

    // Очистка
    return () => {
      console.log('🛑 === TRACKER STOPPED ===');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(intervalId);
      
      if (recordingIndicatorRef.current) {
        recordingIndicatorRef.current.remove();
      }
      
      // Финальное сохранение
      if (lastSiteRef.current && startTimeRef.current && isActiveRef.current) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (duration >= 2) {
          console.log(`💾 Финальное сохранение: ${duration}с`);
          logActivity(lastSiteRef.current, duration);
        }
      }
    };
  }, []);

  return null;
}