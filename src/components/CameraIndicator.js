import React, { useContext, useRef, useEffect, useState } from "react";
import { CameraContext } from "../context/CameraContext.js";
import { initDetectors, detectAll, BehaviorAnalyzer } from "../utils/postureDetection.js";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function CameraIndicator({ onPostureChange, onAdviceChange }) {
  const { cameraOn, stream } = useContext(CameraContext);
  const videoRef = useRef(null);
  const detectorsRef = useRef(null);
  const analyzerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Загрузка моделей...');

  // Инициализация анализатора при монтировании
  useEffect(() => {
    if (!analyzerRef.current) {
      analyzerRef.current = new BehaviorAnalyzer();
      console.log('✅ BehaviorAnalyzer created');
    }
  }, []);

  // Привязываем поток к видео
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      console.log('📹 Video stream connected');
    }
  }, [stream]);

  // Инициализация детекторов при включении камеры
  useEffect(() => {
    if (!cameraOn) {
      if (onPostureChange) onPostureChange(null);
      console.log('📷 Camera OFF - posture reset');
      return;
    }
    
    setLoading(true);
    setLoadingText('🔄 Загрузка AI моделей...');
    console.log('📷 Camera ON - loading models...');
    
    initDetectors().then(detectors => {
      if (detectors) {
        detectorsRef.current = detectors;
        setLoadingText('✅ Модели загружены!');
        setTimeout(() => setLoading(false), 500);
        console.log('✅ Detectors ready');
      } else {
        setLoadingText('❌ Ошибка загрузки');
        setTimeout(() => setLoading(false), 2000);
        console.error('❌ Detectors failed to load');
      }
    }).catch(err => {
      console.error('❌ Detector init failed:', err);
      setLoadingText('❌ Ошибка загрузки моделей');
      setTimeout(() => setLoading(false), 2000);
    });
    
    // Сброс анализатора при новой сессии
    if (analyzerRef.current) {
      analyzerRef.current.reset();
      console.log('🔄 Analyzer reset for new session');
    }
  }, [cameraOn, onPostureChange]);

  // 🔥 Сохранение в Firebase
  const savePostureToFirebase = async (result) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('⚠️ No user authenticated - skipping save');
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      const docRef = await addDoc(collection(db, "postureData"), {
        userId: user.uid,
        status: result.status, // 'good' or 'slouching'
        confidence: result.confidence || 0,
        timestamp: serverTimestamp(),
        sessionDate: today
      });

      console.log('💾 Saved to Firebase:', result.status, 'ID:', docRef.id);
    } catch (error) {
      console.error('❌ Firebase save error:', error);
    }
  };

  // Детекция каждые 2 секунды
  useEffect(() => {
    if (!cameraOn || !videoRef.current || !detectorsRef.current || loading) {
      return;
    }
    
    console.log('🎬 Starting detection loop...');
    
    const interval = setInterval(async () => {
      if (videoRef.current && detectorsRef.current && analyzerRef.current) {
        try {
          const result = await detectAll(videoRef.current);
          
          if (result) {
            console.log('📸 Detected:', result.status);
            
            // Обновляем UI
            if (onPostureChange) {
              onPostureChange(result);
            }
            
            // 🔥 Сохраняем в Firebase
            await savePostureToFirebase(result);
            
            // Анализируем поведение
            analyzerRef.current.update(result);
            
            // Проверяем советы
            const advice = analyzerRef.current.getSmartAdvice();
            if (advice) {
              console.log('💡 Advice:', advice.type);
              if (onAdviceChange) {
                onAdviceChange(advice);
              }
            }
          }
        } catch (error) {
          console.error('❌ Detection error:', error);
        }
      }
    }, 2000);
    
    return () => {
      console.log('⏹️ Stopping detection loop');
      clearInterval(interval);
    };
  }, [cameraOn, loading, onPostureChange, onAdviceChange]);

  return (
    <div className="camera-wrapper">
      {cameraOn ? (
        <>
          <video ref={videoRef} autoPlay muted className="camera-video" />
          {loading && (
            <div className="camera-loading-overlay">
              {loadingText}
            </div>
          )}
        </>
      ) : (
        <div className="camera-placeholder">Камера выключена</div>
      )}
    </div>
  );
}