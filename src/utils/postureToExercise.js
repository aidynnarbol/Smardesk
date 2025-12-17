// src/utils/postureToExercise.js - УМНЫЕ РЕКОМЕНДАЦИИ УПРАЖНЕНИЙ
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

// 🎯 База знаний: проблема → упражнения
const EXERCISE_MAP = {
  slouching: {
    title: 'Сутулость',
    icon: '🔴',
    exercises: ['Растяжка спины', 'Кошка-Корова', 'Планка для спины'],
    priority: 'critical',
    reason: 'Ваша голова слишком часто наклоняется вперед'
  },
  
  neck_forward: {
    title: 'Голова вперед',
    icon: '⚠️',
    exercises: ['Подбородок к груди', 'Повороты головы', 'Растяжка шеи'],
    priority: 'high',
    reason: 'Шея находится в неправильном положении'
  },
  
  narrow_shoulders: {
    title: 'Зажатые плечи',
    icon: '💡',
    exercises: ['Разведение плеч', 'Растяжка груди', 'Круги плечами'],
    priority: 'medium',
    reason: 'Плечи слишком сжаты или наклонены вперед'
  },
  
  uneven_shoulders: {
    title: 'Перекос плеч',
    icon: '⚠️',
    exercises: ['Наклоны в стороны', 'Боковая планка', 'Растяжка боков'],
    priority: 'high',
    reason: 'Одно плечо значительно выше другого'
  },
  
  eyes_tired: {
    title: 'Усталость глаз',
    icon: '👁️',
    exercises: ['Фокус вдаль', 'Движения глазами', 'Моргание и расслабление'],
    priority: 'medium',
    reason: 'Глаза долго фокусируются на экране'
  },
  
  too_close: {
    title: 'Слишком близко',
    icon: '🚨',
    exercises: ['Фокус вдаль', 'Движения глазами', 'Растяжка спины'],
    priority: 'critical',
    reason: 'Вы сидите слишком близко к экрану'
  },
  
  general_fatigue: {
    title: 'Общая усталость',
    icon: '😴',
    exercises: ['Подъёмы на носки', 'Круги стопами', 'Растяжка бедер'],
    priority: 'medium',
    reason: 'Пора размяться и улучшить кровообращение'
  }
};

// 📊 Анализ последних 30 минут осанки
async function analyzeRecentPosture(userId) {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const q = query(
      collection(db, 'postureData'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(15) // Примерно 30 минут при частоте 2 сек
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        problems: [],
        confidence: 'low',
        message: 'Недостаточно данных для анализа'
      };
    }
    
    // Подсчет проблем
    const problems = {};
    let totalRecords = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const docDate = data.timestamp?.toDate();
      
      // Фильтруем только последние 30 минут
      if (docDate && docDate >= thirtyMinutesAgo) {
        totalRecords++;
        const status = data.status;
        
        if (status && status !== 'good') {
          problems[status] = (problems[status] || 0) + 1;
        }
      }
    });
    
    // Сортируем проблемы по частоте
    const sortedProblems = Object.entries(problems)
      .sort(([,a], [,b]) => b - a)
      .map(([problem, count]) => ({
        type: problem,
        frequency: Math.round((count / totalRecords) * 100),
        count
      }));
    
    return {
      problems: sortedProblems,
      totalRecords,
      confidence: totalRecords >= 5 ? 'high' : 'medium'
    };
    
  } catch (error) {
    console.error('❌ Posture analysis error:', error);
    return {
      problems: [],
      confidence: 'low',
      message: 'Ошибка анализа'
    };
  }
}

// 🎯 Генерация персональных рекомендаций
export async function generateExerciseRecommendations(userId) {
  console.log('🔍 Analyzing posture for recommendations...');
  
  const analysis = await analyzeRecentPosture(userId);
  
  // Если недостаточно данных
  if (analysis.confidence === 'low' || analysis.problems.length === 0) {
    return {
      hasRecommendations: false,
      message: '📸 Включите камеру на 5+ минут чтобы получить персональные рекомендации упражнений',
      generalExercises: [
        {
          name: 'Растяжка спины',
          category: 'Осанка и спина',
          reason: 'Общая профилактика'
        },
        {
          name: 'Фокус вдаль',
          category: 'Глаза',
          reason: 'Отдых для глаз'
        },
        {
          name: 'Подъёмы на носки',
          category: 'Ноги и разминка',
          reason: 'Улучшение кровообращения'
        }
      ]
    };
  }
  
  // Генерируем рекомендации на основе проблем
  const recommendations = [];
  const seenExercises = new Set();
  
  for (const problem of analysis.problems) {
    const mapping = EXERCISE_MAP[problem.type];
    
    if (mapping) {
      // Добавляем упражнения, избегая дубликатов
      for (const exercise of mapping.exercises) {
        if (!seenExercises.has(exercise)) {
          recommendations.push({
            exercise,
            problem: mapping.title,
            priority: mapping.priority,
            frequency: problem.frequency,
            reason: mapping.reason,
            icon: mapping.icon
          });
          seenExercises.add(exercise);
        }
      }
    }
  }
  
  // Сортируем по приоритету и частоте
  const priorityOrder = { critical: 3, high: 2, medium: 1 };
  recommendations.sort((a, b) => {
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.frequency - a.frequency;
  });
  
  // Берем топ-5
  const topRecommendations = recommendations.slice(0, 5);
  
  // Определяем главную проблему
  const mainProblem = analysis.problems[0];
  const mainMapping = EXERCISE_MAP[mainProblem.type];
  
  return {
    hasRecommendations: true,
    mainProblem: {
      title: mainMapping?.title || 'Проблема с осанкой',
      frequency: mainProblem.frequency,
      icon: mainMapping?.icon || '⚠️'
    },
    recommendations: topRecommendations,
    analysisQuality: analysis.confidence,
    totalRecords: analysis.totalRecords,
    message: `На основе ${analysis.totalRecords} измерений за последние 30 минут`
  };
}

// 🔔 Проверка - нужно ли показать уведомление
export async function shouldShowExerciseAlert(userId) {
  try {
    const analysis = await analyzeRecentPosture(userId);
    
    // Если нет данных - не показываем
    if (analysis.problems.length === 0) return null;
    
    // Критические проблемы (>60% времени)
    const criticalProblem = analysis.problems.find(p => p.frequency > 60);
    if (criticalProblem) {
      const mapping = EXERCISE_MAP[criticalProblem.type];
      return {
        severity: 'critical',
        title: `${mapping?.icon || '🚨'} ${mapping?.title || 'Проблема с осанкой'}`,
        message: `${criticalProblem.frequency}% времени! ${mapping?.reason || 'Нужно сделать упражнения'}`,
        exercises: mapping?.exercises || [],
        action: 'Исправить сейчас'
      };
    }
    
    // Высокий приоритет (>40% времени)
    const highProblem = analysis.problems.find(p => p.frequency > 40);
    if (highProblem) {
      const mapping = EXERCISE_MAP[highProblem.type];
      return {
        severity: 'high',
        title: `${mapping?.icon || '⚠️'} ${mapping?.title || 'Внимание'}`,
        message: `Замечена проблема (${highProblem.frequency}% времени)`,
        exercises: mapping?.exercises?.slice(0, 2) || [],
        action: 'Посмотреть упражнения'
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Exercise alert check error:', error);
    return null;
  }
}

// 🎨 Получить категорию упражнения (для навигации в Workout)
export function getExerciseCategory(exerciseName) {
  const categories = {
    'Осанка и спина': ['Растяжка спины', 'Кошка-Корова', 'Повороты корпуса', 'Планка для спины', 'Разведение плеч', 'Растяжка груди'],
    'Глаза': ['Фокус вдаль', 'Движения глазами', 'Моргание и расслабление'],
    'Ноги и разминка': ['Подъёмы на носки', 'Круги стопами', 'Растяжка бедер'],
    'Шея и голова': ['Подбородок к груди', 'Повороты головы', 'Растяжка шеи', 'Круги плечами', 'Наклоны в стороны']
  };
  
  for (const [category, exercises] of Object.entries(categories)) {
    if (exercises.some(ex => ex.toLowerCase().includes(exerciseName.toLowerCase()))) {
      return category;
    }
  }
  
  return 'Осанка и спина'; // По умолчанию
}

// 📈 Статистика эффективности упражнений
export async function trackExerciseCompletion(userId, exerciseName, problemType) {
  try {
    // Логируем что пользователь сделал упражнение
    // Это можно использовать для анализа эффективности
    const docRef = await addDoc(collection(db, 'exerciseLog'), {
      userId,
      exercise: exerciseName,
      problemType,
      timestamp: serverTimestamp(),
      date: new Date().toISOString().split('T')[0]
    });
    
    console.log('✅ Exercise completion logged:', exerciseName);
    return true;
  } catch (error) {
    console.error('❌ Exercise log error:', error);
    return false;
  }
}