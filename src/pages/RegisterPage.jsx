import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../firebase";
import "./Auth.css";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Файл слишком большой (макс 2MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRegister = async () => {
    setError("");

    if (!name.trim()) return setError("Введите имя");
    if (!email.trim()) return setError("Введите email");
    if (password.length < 6)
      return setError("Пароль должен быть минимум 6 символов");

    setLoading(true);

    try {
      // 1️⃣ Создаём пользователя
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2️⃣ Загружаем аватар (если выбран)
      let avatarURL = "";
      if (avatar) {
        const avatarRef = ref(storage, `avatars/${user.uid}`);
        await uploadString(avatarRef, avatar, "data_url");
        avatarURL = await getDownloadURL(avatarRef);
      }

      // 3️⃣ Обновляем профиль
      await updateProfile(user, {
        displayName: name,
        photoURL: avatarURL,
      });

      // 4️⃣ Сохраняем в Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        nickname: nickname || "",
        email,
        avatar: avatarURL,
        createdAt: serverTimestamp(),
      });

      // 🎉 Приветствие и переход
      alert(`Добро пожаловать, ${name}! 🎉`);
      navigate("/select");
    } catch (err) {
      console.error("Registration error:", err);
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("Этот email уже используется");
          break;
        case "auth/invalid-email":
          setError("Неверный формат email");
          break;
        case "auth/weak-password":
          setError("Слишком слабый пароль");
          break;
        default:
          setError("Ошибка регистрации: " + err.message);
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
        <h2>Регистрация</h2>

        {error && <div className="auth-error">{error}</div>}

        <div
          className="avatar-picker"
          onClick={() => fileInputRef.current.click()}
        >
          {avatar ? (
            <img src={avatar} alt="Avatar" />
          ) : (
            <div className="avatar-placeholder">+</div>
          )}
          <div className="avatar-overlay">Загрузить</div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            style={{ display: "none" }}
          />
        </div>

        <input
          type="text"
          placeholder="Имя *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
        <input
          type="text"
          placeholder="Никнейм (необязательно)"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          disabled={loading}
        />
        <input
          type="email"
          placeholder="Email *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Пароль (мин. 6 символов) *"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <button onClick={handleRegister} disabled={loading}>
          {loading ? "Регистрация..." : "Создать аккаунт"}
        </button>

        <div className="auth-footer">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </div>
      </motion.div>
    </div>
  );
}
