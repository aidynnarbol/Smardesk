// src/utils/aiInsights.js - РЕАЛЬНЫЙ AI АНАЛИЗ С ЛИМИТАМИ
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// 🔒 ЛИМИТЫ API
const LIMITS = {
  MAX_REQUESTS_PER_DAY: 20,        // Максимум запросов в день на пользователя
  CACHE_DURATION: 10 * 60 * 1000,  // Кэш на 10 минут
  COOLDOWN: 2 * 60 * 1000,         // 2 минуты между запросами
};

// 📊 Проверка лимитов
async function checkLimits(userId, insightType) {
  try {
    const limitsRef = doc(db, 'apiLimits', userId);
    const limitsDoc = await getDoc(limitsRef);
    
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    
    if (!limitsDoc.exists()) {
      // Первый запрос пользователя
      await setDoc(limitsRef, {
        date: today,
        requests: 1,
        lastRequest: now,
        [insightType]: { lastRequest: now, count: 1 }
      });
      return { allowed: true, remaining: LIMITS.MAX_REQUESTS_PER_DAY - 1 };
    }
    
    const data = limitsDoc.data();
    
    // Сброс счетчика если новый день
    if (data.date !== today) {
      await setDoc(limitsRef, {
        date: today,
        requests: 1,
        lastRequest: now,
        [insightType]: { lastRequest: now, count: 1 }
      });
      return { allowed: true, remaining: LIMITS.MAX_REQUESTS_PER_DAY - 1 };
    }
    
    // Проверка дневного лимита
    if (data.requests >= LIMITS.MAX_REQUESTS_PER_DAY) {
      return { 
        allowed: false, 
        remaining: 0, 
        reason: 'Достигнут дневной лимит AI анализа (20 запросов)' 
      };
    }
    
    // Проверка cooldown
    if (now - data.lastRequest < LIMITS.COOLDOWN) {
      return { 
        allowed: false, 
        remaining: data.requests,
        reason: 'Подождите 2 минуты перед следующим запросом'
      };
    }
    
    // Обновляем счетчики
    await setDoc(limitsRef, {
      ...data,
      requests: data.requests + 1,
      lastRequest: now,
      [insightType]: {
        lastRequest: now,
        count: (data[insightType]?.count || 0) + 1
      }
    });
    
    return { 
      allowed: true, 
      remaining: LIMITS.MAX_REQUESTS_PER_DAY - data.requests - 1 
    };
    
  } catch (error) {
    console.error('❌ Limits check error:', error);
    return { allowed: false, reason: 'Ошибка проверки лимитов' };
  }
}

// 💾 Кэширование результатов
const insightsCache = new Map();

function getCachedInsight(key) {
  const cached = insightsCache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > LIMITS.CACHE_DURATION) {
    insightsCache.delete(key);
    return null;
  }
  
  console.log('✅ Using cached insight:', key);
  return cached.data;
}

function setCachedInsight(key, data) {
  insightsCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// 🤖 Генерация AI инсайта для ОСАНКИ
export async function generatePostureInsight(userId, postureData, totalRecords) {
  const cacheKey = `posture-${userId}-${postureData.length}`;
  
  // Проверяем кэш
  const cached = getCachedInsight(cacheKey);
  if (cached) return cached;
  
  // Проверяем лимиты
  const limitCheck = await checkLimits(userId, 'posture');
  if (!limitCheck.allowed) {
    return `⚠️ ${limitCheck.reason}. AI инсайты доступны снова завтра.`;
  }
  
  try {
    // Подготовка данных для анализа
    const goodCount = postureData.reduce((sum, d) => sum + d.good, 0);
    const slouchCount = postureData.reduce((sum, d) => sum + d.slouching, 0);
    const totalPoints = goodCount + slouchCount;
    const goodPercentage = totalPoints > 0 ? Math.round((goodCount / totalPoints) * 100) : 0;
    
    const peakHours = postureData
      .sort((a, b) => b.slouching - a.slouching)
      .slice(0, 3)
      .map(d => d.time);
    
    // 🎯 Запрос к OpenAI
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Проанализируй данные осанки пользователя и дай КРАТКИЙ персональный совет (максимум 2 предложения):

Статистика:
- Правильная осанка: ${goodPercentage}%
- Проблемные часы: ${peakHours.join(', ')}
- Всего измерений: ${totalRecords}

Дай конкретный совет что делать и когда делать перерывы. Без общих фраз.`,
        type: 'insight', // специальный флаг для shorter ответов
        limit: true
      })
    });
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    const data = await response.json();
    const insight = data.reply || 'Продолжайте следить за осанкой!';
    
    // Кэшируем результат
    setCachedInsight(cacheKey, insight);
    
    console.log(`✅ AI Posture insight generated (${limitCheck.remaining} requests left)`);
    return insight;
    
  } catch (error) {
    console.error('❌ AI Insight error:', error);
    
    // Fallback - умный статический ответ на основе данных
    const goodCount = postureData.reduce((sum, d) => sum + d.good, 0);
    const totalPoints = postureData.reduce((sum, d) => sum + d.good + d.slouching, 0);
    const goodPercentage = totalPoints > 0 ? Math.round((goodCount / totalPoints) * 100) : 0;
    
    if (goodPercentage >= 80) {
      return `🎯 Отлично! У вас ${goodPercentage}% правильной осанки. Продолжайте в том же духе!`;
    } else if (goodPercentage >= 60) {
      return `💡 Неплохо (${goodPercentage}%), но есть куда расти. Делайте перерыв каждые 25 минут для упражнений.`;
    } else if (goodPercentage >= 40) {
      return `⚠️ Внимание! Только ${goodPercentage}% правильной осанки. Настройте экран на уровне глаз и делайте упражнения каждый час.`;
    } else {
      return `🚨 Критично! Всего ${goodPercentage}% правильной осанки. Срочно пересмотрите рабочее место и делайте частые перерывы.`;
    }
  }
}

// 🌐 Генерация AI инсайта для АКТИВНОСТИ
export async function generateActivityInsight(userId, studySwitches, funSwitches, totalSites, recentSwitches) {
  const cacheKey = `activity-${userId}-${studySwitches}-${funSwitches}`;
  
  // Проверяем кэш
  const cached = getCachedInsight(cacheKey);
  if (cached) return cached;
  
  // Проверяем лимиты
  const limitCheck = await checkLimits(userId, 'activity');
  if (!limitCheck.allowed) {
    return `⚠️ ${limitCheck.reason}. AI инсайты доступны снова завтра.`;
  }
  
  try {
    const totalSwitches = studySwitches + funSwitches;
    const focusPercentage = totalSwitches > 0 ? Math.round((studySwitches / totalSwitches) * 100) : 50;
    
    // Последние 5 переключений
    const recentPattern = recentSwitches
      .slice(-5)
      .map(s => `${s.site} (${s.category})`)
      .join(', ');
    
    // 🎯 Запрос к OpenAI
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Проанализируй активность пользователя и дай КРАТКИЙ совет (максимум 2 предложения):

Статистика:
- Фокус на учебе/работе: ${focusPercentage}%
- Переключений на учебу: ${studySwitches}
- Переключений на отдых: ${funSwitches}
- Последние сайты: ${recentPattern || 'нет данных'}

Дай конкретный совет по балансу работы и отдыха. Без общих фраз.`,
        type: 'insight',
        limit: true
      })
    });
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    const data = await response.json();
    const insight = data.reply || 'Следите за балансом работы и отдыха!';
    
    // Кэшируем результат
    setCachedInsight(cacheKey, insight);
    
    console.log(`✅ AI Activity insight generated (${limitCheck.remaining} requests left)`);
    return insight;
    
  } catch (error) {
    console.error('❌ AI Insight error:', error);
    
    // Fallback - умный статический ответ
    const totalSwitches = studySwitches + funSwitches;
    const focusPercentage = totalSwitches > 0 ? Math.round((studySwitches / totalSwitches) * 100) : 50;
    
    if (focusPercentage >= 75) {
      return `🎯 Отличный фокус! ${focusPercentage}% времени на продуктивных сайтах. Не забывайте делать перерывы.`;
    } else if (focusPercentage >= 50) {
      return `💡 Хороший баланс (${focusPercentage}%). Попробуйте использовать технику Pomodoro для большей продуктивности.`;
    } else if (focusPercentage >= 30) {
      return `⚠️ Много времени на развлечениях (${100 - focusPercentage}%). Установите блокировщик отвлекающих сайтов в рабочее время.`;
    } else {
      return `🚨 Критично мало фокуса (${focusPercentage}%)! Попробуйте метод блокировки сайтов и четкое планирование времени.`;
    }
  }
}

// 🔥 Генерация AI инсайта для STREAK
export async function generateStreakInsight(userId, streak, totalDays) {
  const cacheKey = `streak-${userId}-${streak}`;
  
  // Проверяем кэш
  const cached = getCachedInsight(cacheKey);
  if (cached) return cached;
  
  // Для streak используем более простую логику без AI (экономим API)
  let insight;
  
  if (streak === 0) {
    insight = '🌱 Начните свой путь! Включите камеру сегодня чтобы начать отслеживание.';
  } else if (streak === 1) {
    insight = '🎉 Отличное начало! Продолжайте завтра чтобы начать серию.';
  } else if (streak < 7) {
    insight = `🔥 ${streak} дней подряд! Ещё ${7 - streak} дней до первой недели.`;
  } else if (streak === 7) {
    insight = '🏆 Неделя streak! Вы формируете полезную привычку.';
  } else if (streak < 14) {
    insight = `💪 ${streak} дней! Продолжайте - вы на пути к 2 неделям!`;
  } else if (streak === 14) {
    insight = '🌟 2 недели streak! Вы невероятны! Привычка почти закреплена.';
  } else if (streak < 30) {
    insight = `🚀 ${streak} дней подряд! Вы на пути к месячному streak!`;
  } else if (streak === 30) {
    insight = '👑 МЕСЯЦ STREAK! Вы легенда! Здоровая осанка стала вашей привычкой.';
  } else {
    insight = `⭐ ${streak} дней! Вы достигли мастерства! Продолжайте вдохновлять!`;
  }
  
  // Кэшируем
  setCachedInsight(cacheKey, insight);
  
  return insight;
}

// 📊 Получить статистику использования API
export async function getAPIUsageStats(userId) {
  try {
    const limitsRef = doc(db, 'apiLimits', userId);
    const limitsDoc = await getDoc(limitsRef);
    
    if (!limitsDoc.exists()) {
      return {
        requests: 0,
        remaining: LIMITS.MAX_REQUESTS_PER_DAY,
        resetTime: 'завтра'
      };
    }
    
    const data = limitsDoc.data();
    const today = new Date().toISOString().split('T')[0];
    
    if (data.date !== today) {
      return {
        requests: 0,
        remaining: LIMITS.MAX_REQUESTS_PER_DAY,
        resetTime: 'завтра'
      };
    }
    
    return {
      requests: data.requests || 0,
      remaining: LIMITS.MAX_REQUESTS_PER_DAY - (data.requests || 0),
      resetTime: 'завтра'
    };
    
  } catch (error) {
    console.error('❌ API usage stats error:', error);
    return {
      requests: 0,
      remaining: LIMITS.MAX_REQUESTS_PER_DAY,
      resetTime: 'неизвестно'
    };
  }
}