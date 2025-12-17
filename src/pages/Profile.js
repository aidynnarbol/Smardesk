import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db, storage } from "../firebase";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [user, loading] = useAuthState(auth);

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [originalAvatar, setOriginalAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [createdAt, setCreatedAt] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const fileInputRef = React.useRef(null);

  // Загрузка данных пользователя
  useEffect(() => {
    if (!user) return;

    const loadUserData = async () => {
      setLoadingData(true);

      try {
        console.log("🔥 Loading user data for:", user.uid);

        setName(user.displayName || "");
        setEmail(user.email || "");
        setAvatar(user.photoURL || "");
        setOriginalAvatar(user.photoURL || "");

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("✅ Firestore data loaded:", data);
          setName(data.name || user.displayName || "");
          setNickname(data.nickname || "");
          setAvatar(data.avatar || user.photoURL || "");
          setOriginalAvatar(data.avatar || user.photoURL || "");
          setEmail(data.email || user.email || "");
          
          // Правильно сохраняем createdAt
          if (data.createdAt) {
            setCreatedAt(data.createdAt);
          } else if (user.metadata?.creationTime) {
            // Если нет в Firestore, берем из Firebase Auth
            setCreatedAt(user.metadata.creationTime);
          }
        } else {
          console.log("⚠️ No Firestore document, creating one...");
          const timestamp = new Date().toISOString();
          await setDoc(docRef, {
            uid: user.uid,
            name: user.displayName || "",
            nickname: "",
            email: user.email || "",
            avatar: user.photoURL || "",
            createdAt: timestamp,
          });
          setCreatedAt(timestamp);
        }
      } catch (error) {
        console.error("❌ Error loading user data:", error);
        setMessage({
          type: "error",
          text: "Ошибка загрузки данных: " + error.message,
        });
      } finally {
        setLoadingData(false);
      }
    };

    loadUserData();
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Файл слишком большой (макс 2MB)" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;

    if (!name.trim()) {
      setMessage({ type: "error", text: "Имя не может быть пустым" });
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      let avatarURL = avatar;

      if (avatar && avatar.startsWith("data:")) {
        console.log("📤 Uploading new avatar...");
        const avatarRef = ref(storage, `avatars/${user.uid}`);
        await uploadString(avatarRef, avatar, "data_url");
        avatarURL = await getDownloadURL(avatarRef);
        console.log("✅ Avatar uploaded:", avatarURL);
      }

      await updateProfile(user, {
        displayName: name.trim(),
        photoURL: avatarURL,
      });
      console.log("✅ Auth profile updated");

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          name: name.trim(),
          nickname: nickname.trim(),
          avatar: avatarURL,
          updatedAt: new Date().toISOString(),
        });
        console.log("✅ Firestore document updated");
      } else {
        await setDoc(docRef, {
          uid: user.uid,
          name: name.trim(),
          nickname: nickname.trim(),
          email: user.email,
          avatar: avatarURL,
          createdAt: new Date().toISOString(),
        });
        console.log("✅ Firestore document created");
      }

      await auth.currentUser.reload();
      setOriginalAvatar(avatarURL);
      setMessage({ type: "success", text: "✅ Данные успешно сохранены!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("❌ Error saving:", error);
      setMessage({
        type: "error",
        text: "Ошибка сохранения: " + error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/welcome", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Неизвестно";
    try {
      // Проверяем, является ли это Firestore Timestamp
      let date;
      if (dateString.seconds) {
        date = new Date(dateString.seconds * 1000);
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) return "Неизвестно";
      
      return date.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Неизвестно";
    }
  };

  // Подсчет дней с регистрации
  const getDaysFromRegistration = () => {
    if (!createdAt) return "—";
    try {
      let registrationDate;
      if (createdAt.seconds) {
        registrationDate = new Date(createdAt.seconds * 1000);
      } else {
        registrationDate = new Date(createdAt);
      }
      
      if (isNaN(registrationDate.getTime())) return "—";
      
      const today = new Date();
      const diffTime = Math.abs(today - registrationDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return "Сегодня";
      if (diffDays === 1) return "1 день";
      if (diffDays < 5) return `${diffDays} дня`;
      return `${diffDays} дней`;
    } catch (error) {
      console.error("Error calculating days:", error);
      return "—";
    }
  };

  // Skeleton loader
  if (loading || loadingData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        style={{
          width: "90%",
          maxWidth: "800px",
          height: "500px",
          margin: "auto",
          marginTop: "15vh",
          borderRadius: "24px",
          background: "rgba(255, 255, 255, 0.04)",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "var(--text-color)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            marginBottom: 24,
          }}
        ></div>

        <div
          style={{
            width: "60%",
            height: 16,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 8,
            marginBottom: 10,
          }}
        ></div>
        <div
          style={{
            width: "40%",
            height: 16,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 8,
            marginBottom: 20,
          }}
        ></div>

        <motion.p
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ fontSize: "1rem", color: "rgba(255,255,255,0.7)" }}
        >
          Загрузка профиля...
        </motion.p>
      </motion.div>
    );
  }

  return (
    <div className="profile-page">
      <motion.div
        className="profile-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Левая часть - Аватар и статистика */}
        <motion.div
          className="profile-sidebar"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="profile-avatar-section">
            <div
              className="profile-avatar-large"
              onClick={() => fileInputRef.current.click()}
            >
              {avatar ? (
                <img src={avatar} alt="Avatar" />
              ) : (
                <div className="avatar-placeholder-large">
                  {name.charAt(0).toUpperCase() || "👤"}
                </div>
              )}
              <motion.div
                className="avatar-overlay-large"
                whileHover={{ opacity: 1 }}
              >
                <span>📷</span>
                <p>Изменить фото</p>
              </motion.div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                style={{ display: "none" }}
              />
            </div>

            <h2 className="profile-name">{name || "Пользователь"}</h2>
            {nickname && (
              <p className="profile-nickname">@{nickname}</p>
            )}
          </div>

          {/* Статистика */}
          <div className="profile-stats">
            <div className="stat-card">
              <span className="stat-icon">📅</span>
              <div>
                <p className="stat-label">Регистрация</p>
                <p className="stat-value">{formatDate(createdAt)}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <span className="stat-icon">⏱️</span>
              <div>
                <p className="stat-label">С нами</p>
                <p className="stat-value">{getDaysFromRegistration()}</p>
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-icon">{user?.emailVerified ? "✅" : "📧"}</span>
              <div>
                <p className="stat-label">Email</p>
                <p className="stat-value">{user?.emailVerified ? "Подтвержден" : "Не подтвержден"}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Правая часть - Форма редактирования */}
        <motion.div
          className="profile-main"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="section-title">Личная информация</h3>

          {message.text && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`message-banner ${message.type}`}
            >
              {message.type === "success" ? "✅ " : "⚠️ "}
              {message.text}
            </motion.div>
          )}

          <div className="profile-form">
            <div className="form-group">
              <label>
                <span className="label-icon">👤</span>
                Имя
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
                placeholder="Введите ваше имя"
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label>
                <span className="label-icon">✨</span>
                Никнейм
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="@username"
                disabled={saving}
                maxLength={30}
              />
              <small className="input-hint">Отображается в вашем профиле</small>
            </div>

            <div className="form-group">
              <label>
                <span className="label-icon">📧</span>
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="input-disabled"
              />
              <small className="input-hint">📌 Email нельзя изменить после регистрации</small>
            </div>
          </div>

          <div className="profile-actions">
            <motion.button
              className="btn-save"
              onClick={handleSave}
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {saving ? (
                <>
                  <span className="spinner"></span>
                  Сохранение...
                </>
              ) : (
                <>
                  <span>💾</span>
                  Сохранить
                </>
              )}
            </motion.button>

            <motion.button
              className="btn-logout"
              onClick={() => setShowLogoutModal(true)}
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>🚪</span>
              Выйти
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Модальное окно подтверждения выхода */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Выйти из аккаунта?</h3>
              <p>Вы уверены, что хотите выйти?</p>
              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setShowLogoutModal(false)}
                >
                  Отмена
                </button>
                <button className="btn-confirm" onClick={handleLogout}>
                  Выйти
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}