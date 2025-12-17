import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import "./Auth.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    
    if (!email.trim() || !password.trim()) {
      setError("Заполните все поля");
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ Login successful");
      
      // Небольшая задержка для применения изменений
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 300);
      
    } catch (err) {
      console.error("❌ Login error:", err);
      
      switch (err.code) {
        case "auth/user-not-found":
          setError("Пользователь не найден");
          break;
        case "auth/wrong-password":
          setError("Неверный пароль");
          break;
        case "auth/invalid-email":
          setError("Неверный формат email");
          break;
        case "auth/invalid-credential":
          setError("Неверный email или пароль");
          break;
        case "auth/too-many-requests":
          setError("Слишком много попыток входа. Попробуйте позже");
          break;
        case "auth/network-request-failed":
          setError("Проблема с интернет-соединением");
          break;
        default:
          setError(err.message || "Ошибка входа");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h2>Вход</h2>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            style={{
              padding: "12px",
              marginBottom: "12px",
              borderRadius: "8px",
              background: "rgba(255, 0, 0, 0.15)",
              border: "1px solid rgba(255, 0, 0, 0.3)",
              color: "#ff6b6b",
              fontSize: "14px"
            }}
          >
            ⚠️ {error}
          </motion.div>
        )}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              padding: "12px",
              marginBottom: "12px",
              borderRadius: "8px",
              background: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              color: "#60a5fa",
              fontSize: "14px",
              textAlign: "center"
            }}
          >
            ⏳ Входим в систему...
          </motion.div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          disabled={loading}
        />

        <button onClick={handleLogin} disabled={loading}>
          {loading ? "Вход..." : "Войти"}
        </button>

        <div className="auth-footer">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </div>
      </motion.div>
    </div>
  );
}