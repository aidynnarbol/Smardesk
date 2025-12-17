import React, { createContext, useState, useEffect } from "react";

// Контекст камеры
export const CameraContext = createContext();

export const CameraProvider = ({ children }) => {
  const [cameraOn, setCameraOn] = useState(false);
  const [stream, setStream] = useState(null);

  // Старт камеры
  const startCamera = async () => {
    if (cameraOn) return; // Если уже включена, не включаем заново
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setCameraOn(true);
    } catch (err) {
      console.error("Ошибка при запуске камеры:", err);
      setCameraOn(false);
    }
  };

  // Стоп камеры
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setCameraOn(false);
  };

  // Переключатель камеры
  const toggleCamera = () => {
    if (cameraOn) stopCamera();
    else startCamera();
  };

  // Сохраняем состояние камеры в localStorage, чтобы оно оставалось при перезагрузке
  useEffect(() => {
    const saved = localStorage.getItem("cameraOn");
    if (saved === "true") startCamera();
  }, []);

  useEffect(() => {
    localStorage.setItem("cameraOn", cameraOn ? "true" : "false");
  }, [cameraOn]);

  return (
    <CameraContext.Provider value={{ cameraOn, stream, startCamera, stopCamera, toggleCamera }}>
      {children}
    </CameraContext.Provider>
  );
};
