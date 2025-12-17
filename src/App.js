import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar.js";
import ProtectedRoute from "./components/ProtectedRoute.js";

import MainPage from "./pages/MainPage.jsx";
import Statistics from "./pages/Statistics.js";
import Workout from "./pages/Workout.js";
import ChatBot from "./pages/ChatBot.js";
import Profile from "./pages/Profile.js";
import Settings from "./pages/Settings.js";
import Premium from "./pages/Premium.js";
import Help from "./pages/Help.js";

import WelcomePage from "./pages/WelcomePage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SelectPage from "./pages/SelectPage.jsx";

import { CameraProvider } from "./context/CameraContext.js";
import { useSiteTracker } from "./hooks/useSiteTracker.js"; // ✅ импорт хука

import "./App.css";

function AppWrapper() {
  const location = useLocation();
  const hideNavbarPaths = ["/welcome", "/register", "/login", "/select"];
  const showNavbar = !hideNavbarPaths.includes(location.pathname);

  return (
    <div className="app-container">
      {showNavbar && <Navbar />}
      <Routes>
        {/* Публичные роуты */}
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/select" element={<SelectPage />} />

        {/* Защищённые роуты */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/statistics"
          element={
            <ProtectedRoute>
              <Statistics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workout"
          element={
            <ProtectedRoute>
              <Workout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chatbot"
          element={
            <ProtectedRoute>
              <ChatBot />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/premium"
          element={
            <ProtectedRoute>
              <Premium />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <Help />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default function App() {
  useSiteTracker(); // ✅ вызывем хук здесь, без нового объявления функции

  return (
    <CameraProvider>
      <Router>
        <AppWrapper />
      </Router>
    </CameraProvider>
  );
}
