import * as poseDetection from '@tensorflow-models/pose-detection';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as tf from '@tensorflow/tfjs';

let poseDetector = null;
let faceDetector = null;
let isInitialized = false;

const DEBUG_MODE = false; // Отключаем дебаг для продакшна

// 📐 ТОЧНЫЕ константы на основе УГЛОВ и РАССТОЯНИЙ
const CALIBRATION = {
  // Угол наклона головы вперед (в градусах)
  HEAD_ANGLE_CRITICAL: 35,      // Критический наклон головы
  HEAD_ANGLE_HIGH: 25,          // Высокий наклон
  HEAD_ANGLE_MEDIUM: 15,        // Средний наклон
  HEAD_ANGLE_GOOD: 10,          // Отличная осанка
  
  // Расстояние от уха до плеча (вертикальное)
  EAR_SHOULDER_RATIO_CRITICAL: 0.15,  // Голова сильно впереди
  EAR_SHOULDER_RATIO_HIGH: 0.10,      // Голова впереди
  EAR_SHOULDER_RATIO_MEDIUM: 0.05,    // Легкий наклон
  
  // Разница высоты плеч
  SHOULDER_IMBALANCE_HIGH: 40,   // Сильный перекос
  SHOULDER_IMBALANCE_MEDIUM: 25, // Средний перекос
  
  // Ширина плеч относительно головы
  SHOULDER_WIDTH_MIN: 1.4,       // Минимальная ширина (расправлены)
  
  MIN_CONFIDENCE: 0.4,
};

export async function initDetectors() {
  if (isInitialized && poseDetector && faceDetector) {
    return { poseDetector, faceDetector };
  }

  try {
    console.log('🔄 Загрузка AI моделей...');
    await tf.ready();
    await tf.setBackend('webgl');
    console.log('✅ TensorFlow backend:', tf.getBackend());

    const poseModel = poseDetection.SupportedModels.MoveNet;
    poseDetector = await poseDetection.createDetector(poseModel, {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    });
    console.log('✅ Pose detector загружен');

    const faceModel = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    faceDetector = await faceLandmarksDetection.createDetector(faceModel, {
      runtime: 'tfjs',
      refineLandmarks: true,
    });
    console.log('✅ Face detector загружен');

    isInitialized = true;
    console.log('✅ Все AI модели загружены');
    return { poseDetector, faceDetector };
  } catch (error) {
    console.error('❌ Ошибка загрузки моделей:', error);
    return null;
  }
}

export async function detectAll(videoElement) {
  if (!poseDetector || !faceDetector || !videoElement) return null;

  try {
    const [poses, faces] = await Promise.all([
      poseDetector.estimatePoses(videoElement),
      faceDetector.estimateFaces(videoElement),
    ]);

    const postureResult = analyzePose(poses);
    const faceResult = analyzeFace(faces, videoElement);
    return combineResults(postureResult, faceResult);
  } catch (error) {
    console.error('Ошибка детекции:', error);
    return null;
  }
}

// Функция для вычисления угла между тремя точками
function calculateAngle(point1, point2, point3) {
  const radians = Math.atan2(point3.y - point2.y, point3.x - point2.x) - 
                  Math.atan2(point1.y - point2.y, point1.x - point2.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

// Функция для вычисления расстояния между точками
function getDistance(point1, point2) {
  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
}

function analyzePose(poses) {
  if (!poses || poses.length === 0) {
    return { 
      type: 'pose', 
      status: 'no_person', 
      message: '🔍 Не видно человека',
      color: '#ffbb28'
    };
  }

  const kp = poses[0].keypoints;
  const conf = CALIBRATION.MIN_CONFIDENCE;
  
  const nose = kp.find(p => p.name === 'nose');
  const leftShoulder = kp.find(p => p.name === 'left_shoulder');
  const rightShoulder = kp.find(p => p.name === 'right_shoulder');
  const leftEar = kp.find(p => p.name === 'left_ear');
  const rightEar = kp.find(p => p.name === 'right_ear');
  const leftEye = kp.find(p => p.name === 'left_eye');
  const rightEye = kp.find(p => p.name === 'right_eye');

  // Проверка видимости ключевых точек
  if (!nose || !leftShoulder || !rightShoulder ||
      nose.score < conf || leftShoulder.score < conf || rightShoulder.score < conf) {
    return { 
      type: 'pose', 
      status: 'turn_to_camera', 
      message: '🔍 Повернитесь к камере',
      detail: 'Нужно видеть лицо и плечи',
      color: '#ffbb28'
    };
  }

  // === 1. АНАЛИЗ УГЛА НАКЛОНА ГОЛОВЫ ===
  // Вычисляем центр плеч
  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
  const shoulderMid = { x: shoulderMidX, y: shoulderMidY };
  
  // Используем уши для более точного определения
  let headAngle = 0;
  if (leftEar && rightEar && leftEar.score > conf && rightEar.score > conf) {
    const earMidX = (leftEar.x + rightEar.x) / 2;
    const earMidY = (leftEar.y + rightEar.y) / 2;
    const earMid = { x: earMidX, y: earMidY };
    
    // Угол между вертикалью и линией ухо-плечо
    const verticalPoint = { x: shoulderMidX, y: shoulderMidY - 100 };
    headAngle = calculateAngle(verticalPoint, shoulderMid, earMid);
    
    // Расстояние уха до плеча (горизонтальное)
    const earShoulderDistance = Math.abs(earMidX - shoulderMidX);
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    const earShoulderRatio = earShoulderDistance / shoulderWidth;
    
    if (DEBUG_MODE) {
      console.log('📐 Угол головы:', headAngle.toFixed(1) + '°', '| Ratio:', earShoulderRatio.toFixed(2));
    }
    
    // КРИТИЧЕСКАЯ СУТУЛОСТЬ
    if (headAngle > CALIBRATION.HEAD_ANGLE_CRITICAL || earShoulderRatio > CALIBRATION.EAR_SHOULDER_RATIO_CRITICAL) {
      return {
        type: 'pose',
        status: 'slouching_critical',
        message: '🔴 СИЛЬНАЯ СУТУЛОСТЬ!',
        detail: 'Голова сильно впереди. Откиньтесь назад!',
        severity: 'critical',
        color: '#ff3333'
      };
    }
    
    // ВЫСОКАЯ СУТУЛОСТЬ
    if (headAngle > CALIBRATION.HEAD_ANGLE_HIGH || earShoulderRatio > CALIBRATION.EAR_SHOULDER_RATIO_HIGH) {
      return {
        type: 'pose',
        status: 'slouching',
        message: '⚠️ Заметная сутулость',
        detail: 'Подтяните голову и спину назад',
        severity: 'high',
        color: '#ff6584'
      };
    }
    
    // СРЕДНЯЯ СУТУЛОСТЬ
    if (headAngle > CALIBRATION.HEAD_ANGLE_MEDIUM || earShoulderRatio > CALIBRATION.EAR_SHOULDER_RATIO_MEDIUM) {
      return {
        type: 'pose',
        status: 'slight_slouch',
        message: '💡 Лёгкая сутулость',
        detail: 'Немного выпрямите спину',
        severity: 'medium',
        color: '#ffbb28'
      };
    }
  }

  // === 2. АНАЛИЗ ШИРИНЫ ПЛЕЧ ===
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
  let headWidth = 0;
  
  if (leftEar && rightEar && leftEar.score > conf && rightEar.score > conf) {
    headWidth = Math.abs(leftEar.x - rightEar.x);
  } else if (leftEye && rightEye && leftEye.score > conf && rightEye.score > conf) {
    headWidth = Math.abs(leftEye.x - rightEye.x) * 1.5; // Глаза уже, чем уши
  }
  
  if (headWidth > 0) {
    const shoulderToHeadRatio = shoulderWidth / headWidth;
    
    if (shoulderToHeadRatio < CALIBRATION.SHOULDER_WIDTH_MIN) {
      return {
        type: 'pose',
        status: 'narrow_shoulders',
        message: '💡 Плечи сжаты',
        detail: 'Расправьте плечи назад',
        severity: 'medium',
        color: '#ffbb28'
      };
    }
  }
  
  // === 3. АНАЛИЗ ПЕРЕКОСА ПЛЕЧ ===
  const shoulderHeightDiff = Math.abs(leftShoulder.y - rightShoulder.y);
  
  if (shoulderHeightDiff > CALIBRATION.SHOULDER_IMBALANCE_HIGH) {
    return {
      type: 'pose',
      status: 'uneven_shoulders',
      message: '⚠️ Плечи сильно неровные',
      detail: leftShoulder.y < rightShoulder.y ? 'Левое плечо выше' : 'Правое плечо выше',
      severity: 'high',
      color: '#ff6584'
    };
  }
  
  if (shoulderHeightDiff > CALIBRATION.SHOULDER_IMBALANCE_MEDIUM) {
    return {
      type: 'pose',
      status: 'slight_tilt',
      message: '💡 Небольшой перекос плеч',
      detail: 'Выровняйте плечи',
      severity: 'medium',
      color: '#ffbb28'
    };
  }

  // === ВСЁ ОТЛИЧНО! ===
  return {
    type: 'pose',
    status: 'perfect',
    message: '✅ Осанка отличная!',
    detail: 'Продолжайте сидеть ровно 👍',
    severity: 'good',
    color: '#00c49f'
  };
}

function analyzeFace(faces, videoElement) {
  if (!faces || faces.length === 0) {
    return { type: 'face', status: 'no_face' };
  }

  const face = faces[0];
  const keypoints = face.keypoints;

  const leftEyePoints = keypoints.filter(kp => kp.name && kp.name.includes('leftEye'));
  const rightEyePoints = keypoints.filter(kp => kp.name && kp.name.includes('rightEye'));
  const mouthPoints = keypoints.filter(kp => kp.name && kp.name.includes('lips'));

  // Проверка расстояния до экрана
  if (leftEyePoints.length > 0 && rightEyePoints.length > 0) {
    const eyeDistance = Math.abs(leftEyePoints[0].x - rightEyePoints[0].x);
    const videoWidth = videoElement.videoWidth || 640;
    const distanceRatio = eyeDistance / videoWidth;
    
    if (distanceRatio > 0.30) {
      return {
        type: 'face',
        status: 'too_close',
        message: '🔴 ОПАСНО БЛИЗКО!',
        detail: 'Отодвиньтесь на 50-70 см от экрана',
        severity: 'critical',
        color: '#ff3333',
        isTooClose: true
      };
    }
    
    if (distanceRatio > 0.24) {
      return {
        type: 'face',
        status: 'slightly_close',
        message: '⚠️ Слишком близко',
        detail: 'Отодвиньтесь на 10-20 см',
        severity: 'high',
        color: '#ff6584',
        isTooClose: true
      };
    }
    
    if (distanceRatio > 0.20) {
      return {
        type: 'face',
        status: 'bit_close',
        message: '💡 Чуть ближе нормы',
        detail: 'Оптимально: 50-70 см от экрана',
        severity: 'medium',
        color: '#ffbb28',
        isTooClose: true
      };
    }
  }

  // Определение зевка
  if (mouthPoints.length > 10) {
    const upperLips = mouthPoints.filter(kp => kp.name && kp.name.includes('upperLips'));
    const lowerLips = mouthPoints.filter(kp => kp.name && kp.name.includes('lowerLips'));
    
    if (upperLips.length > 0 && lowerLips.length > 0) {
      const upperY = upperLips[Math.floor(upperLips.length / 2)].y;
      const lowerY = lowerLips[Math.floor(lowerLips.length / 2)].y;
      const mouthHeight = Math.abs(upperY - lowerY);
      
      if (mouthHeight > 40) {
        return {
          type: 'face',
          status: 'yawning',
          message: '💤 ЗЕВОК!',
          detail: 'Вы устали, нужен перерыв',
          severity: 'high',
          color: '#ff6584',
          isYawn: true
        };
      }
    }
  }

  // Определение закрытых глаз
  if (leftEyePoints.length > 6 && rightEyePoints.length > 6) {
    const leftEyeHeight = Math.abs(leftEyePoints[1]?.y - leftEyePoints[5]?.y) || 0;
    const rightEyeHeight = Math.abs(rightEyePoints[1]?.y - rightEyePoints[5]?.y) || 0;
    const avgEyeHeight = (leftEyeHeight + rightEyeHeight) / 2;
    
    if (avgEyeHeight < 2.0) {
      return {
        type: 'face',
        status: 'eyes_closed',
        message: '😴 Глаза закрыты',
        detail: 'Вы засыпаете?',
        severity: 'high',
        color: '#ff6584',
        isEyesClosed: true
      };
    }
  }

  return { type: 'face', status: 'ok' };
}

function combineResults(postureResult, faceResult) {
  // Приоритет: критические > высокие > средние > хорошие
  if (faceResult.severity === 'critical') return faceResult;
  if (postureResult.severity === 'critical') return postureResult;
  if (faceResult.isYawn || faceResult.isEyesClosed) return faceResult;
  if (postureResult.severity === 'high') return postureResult;
  if (faceResult.severity === 'high') return faceResult;
  if (postureResult.severity === 'medium') return postureResult;
  if (faceResult.severity === 'medium') return faceResult;
  return postureResult;
}

// 🧠 УМНЫЙ АНАЛИЗАТОР ПОВЕДЕНИЯ
export class BehaviorAnalyzer {
  constructor() {
    // Счетчики
    this.yawnCount = 0;
    this.closedEyesCount = 0;
    this.tooCloseSeconds = 0;
    this.slouchingSeconds = 0;
    this.goodPostureSeconds = 0;
    this.totalWorkSeconds = 0;
    
    // Временные метки
    this.lastYawnTime = 0;
    this.lastAdviceTime = 0;
    this.lastAdviceType = null;
    this.startTime = Date.now();
    this.lastBreakTime = Date.now();
    this.lastWaterTime = Date.now();
    this.lastWorkoutTime = Date.now();
    
    // История
    this.recentYawns = [];
    this.recentClosedEyes = [];
    
    console.log('✅ BehaviorAnalyzer инициализирован');
  }

  update(detectionResult) {
    if (!detectionResult) return;
    
    const now = Date.now();
    this.totalWorkSeconds += 2;

    // Зевки
    if (detectionResult.isYawn && now - this.lastYawnTime > 8000) {
      this.yawnCount++;
      this.lastYawnTime = now;
      this.recentYawns.push(now);
      this.recentYawns = this.recentYawns.filter(time => now - time < 300000); // 5 минут
    }

    // Закрытые глаза
    if (detectionResult.isEyesClosed) {
      this.closedEyesCount++;
      this.recentClosedEyes.push(now);
      this.recentClosedEyes = this.recentClosedEyes.filter(time => now - time < 180000); // 3 минуты
    }

    // Сутулость
    if (detectionResult.status === 'slouching' || 
        detectionResult.status === 'slouching_critical' ||
        detectionResult.status === 'slight_slouch' ||
        detectionResult.status === 'narrow_shoulders') {
      this.slouchingSeconds += 2;
    }

    // Хорошая осанка
    if (detectionResult.severity === 'good') {
      this.goodPostureSeconds += 2;
    }

    // Слишком близко
    if (detectionResult.isTooClose) {
      this.tooCloseSeconds += 2;
    }
  }

  getSmartAdvice() {
    const now = Date.now();
    const totalMinutes = this.totalWorkSeconds / 60;
    const timeSinceLastAdvice = (now - this.lastAdviceTime) / 1000;
    
    // Минимальный интервал между советами - 45 секунд
    if (timeSinceLastAdvice < 45) return null;

    // 🚨 КРИТИЧЕСКИЕ СОВЕТЫ (приоритет 1)
    
    // Сильная усталость (2+ зевка за 5 минут)
    if (this.recentYawns.length >= 2 && this.lastAdviceType !== 'severe_fatigue') {
      this.lastAdviceTime = now;
      this.lastAdviceType = 'severe_fatigue';
      this.lastBreakTime = now;
      return {
        title: "🚨 Вы очень устали!",
        text: `Вы зевнули ${this.yawnCount} раз за последние 5 минут. Срочно сделайте перерыв и прогуляйтесь.`,
        actionText: "СДЕЛАТЬ ПЕРЕРЫВ",
        type: "severe_fatigue",
        priority: "critical",
        needsWorkout: true
      };
    }

    // Опасность для зрения (слишком близко > 1 минуты)
    if (this.tooCloseSeconds > 60 && this.lastAdviceType !== 'eye_danger') {
      this.lastAdviceTime = now;
      this.lastAdviceType = 'eye_danger';
      return {
        title: "🚨 ОПАСНО для зрения!",
        text: "Вы слишком долго сидите близко к экрану. Это может навредить глазам. Отодвиньтесь и сделайте гимнастику для глаз.",
        actionText: "ГИМНАСТИКА ДЛЯ ГЛАЗ",
        type: "eye_danger",
        priority: "critical",
        needsWorkout: true
      };
    }

    // Хроническая сутулость (> 2 минут)
    if (this.slouchingSeconds > 120 && this.lastAdviceType !== 'chronic_slouch') {
      this.lastAdviceTime = now;
      this.lastAdviceType = 'chronic_slouch';
      this.lastWorkoutTime = now;
      return {
        title: "🚨 Опасная сутулость!",
        text: `Вы сидите с плохой осанкой уже ${Math.floor(this.slouchingSeconds / 60)} минут. Это может привести к болям в спине!`,
        actionText: "УПРАЖНЕНИЯ ДЛЯ СПИНЫ",
        type: "chronic_slouch",
        priority: "critical",
        needsWorkout: true
      };
    }

    // ⚠️ ВЫСОКИЙ ПРИОРИТЕТ
    
    // Признаки усталости (1 зевок)
    if (this.yawnCount >= 1 && this.lastAdviceType !== 'fatigue' && 
        (now - this.lastYawnTime) < 60000) {
      this.lastAdviceTime = now;
      this.lastAdviceType = 'fatigue';
      return {
        title: "💤 Признаки усталости",
        text: "Вы начинаете зевать. Возможно, пора сделать перерыв или выпить воды.",
        actionText: "СДЕЛАТЬ ПАУЗУ",
        type: "fatigue",
        priority: "high",
        needsWorkout: false
      };
    }

    // 💡 СРЕДНИЙ ПРИОРИТЕТ
    
    // Pomodoro - напоминание о перерыве каждые 25 минут
    const minutesSinceBreak = (now - this.lastBreakTime) / 60000;
    if (minutesSinceBreak >= 25 && this.lastAdviceType !== 'pomodoro_break') {
      this.lastAdviceTime = now;
      this.lastAdviceType = 'pomodoro_break';
      this.lastBreakTime = now;
      return {
        title: "⏰ Время перерыва!",
        text: `Вы работаете ${Math.floor(minutesSinceBreak)} минут без перерыва. По технике Pomodoro пора отдохнуть 5 минут.`,
        actionText: "ПЕРЕРЫВ 5 МИНУТ",
        type: "pomodoro_break",
        priority: "medium",
        needsWorkout: true
      };
    }

    // Напоминание о воде каждый час
    const minutesSinceWater = (now - this.lastWaterTime) / 60000;
    if (minutesSinceWater >= 60 && this.lastAdviceType !== 'water_reminder') {
      this.lastAdviceTime = now;
      this.lastAdviceType = 'water_reminder';
      this.lastWaterTime = now;
      return {
        title: "💧 Не забывайте пить воду!",
        text: "Прошел час с последнего напоминания. Выпейте стакан воды для здоровья и концентрации.",
        actionText: "ВЫПИТЬ ВОДЫ",
        type: "water_reminder",
        priority: "medium",
        needsWorkout: false
      };
    }

    // Напоминание о воркауте каждые 1.5 часа
    const minutesSinceWorkout = (now - this.lastWorkoutTime) / 60000;
    if (minutesSinceWorkout >= 90 && this.lastAdviceType !== 'workout_reminder') {
      this.lastAdviceTime = now;
      this.lastAdviceType = 'workout_reminder';
      this.lastWorkoutTime = now;
      return {
        title: "🧘‍♀️ Время размяться!",
        text: "Уже прошло 1.5 часа. Сделайте упражнения для спины и шеи, чтобы избежать боли и усталости.",
        actionText: "НАЧАТЬ УПРАЖНЕНИЯ",
        type: "workout_reminder",
        priority: "medium",
        needsWorkout: true
      };
    }

    return null;
  }

  reset() {
    console.log('🔄 Analyzer reset');
    this.yawnCount = 0;
    this.closedEyesCount = 0;
    this.tooCloseSeconds = 0;
    this.slouchingSeconds = 0;
    this.goodPostureSeconds = 0;
    this.totalWorkSeconds = 0;
    this.lastYawnTime = 0;
    this.lastAdviceTime = 0;
    this.lastAdviceType = null;
    this.startTime = Date.now();
    this.lastBreakTime = Date.now();
    this.lastWaterTime = Date.now();
    this.lastWorkoutTime = Date.now();
    this.recentYawns = [];
    this.recentClosedEyes = [];
  }
}