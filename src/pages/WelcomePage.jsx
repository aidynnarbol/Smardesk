// WelcomePage.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import "../App.css";

export default function WelcomePage() {
  const navigate = useNavigate();
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    // Если пользователь залогинен — перекидываем на главную
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Загрузка...</div>;
  }

  return (
    <div className="welcome-container">
      <motion.div
        className="welcome-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Добро пожаловать в <span style={{color:"var(--accent-color)"}}>Smardesk</span></h1>
        <p className="muted">Управляй фокусом, задачами и статистикой — начнём с создания профиля.</p>

        <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "center" }}>
          <button className="btn-primary" onClick={() => navigate("/register")}>
            Регистрация
          </button>
          <button 
            className="btn-primary" 
            style={{ background: "transparent", border: "1px solid var(--border-color)" }} 
            onClick={() => navigate("/login")}
          >
            Войти
          </button>
        </div>

        <p className="muted" style={{ marginTop: 16 }}>
          После регистрации вы сможете выбрать сайты для учёбы и отдыха — это нужно для статистики.
        </p>
      </motion.div>
    </div>
  );
}