import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Mic, MicOff, Download, Brain, Heart, Zap, Clock, 
  BarChart3, User, X, ChevronDown, Plus
} from "lucide-react";
import { db, auth } from "../firebase";
import { 
  collection, addDoc, getDocs, query, where, orderBy, 
  onSnapshot, serverTimestamp, deleteDoc, doc 
} from "firebase/firestore";
import "./ChatBot.css";

// Компонент для форматирования сообщений
const FormattedMessage = ({ text }) => {
  const formatText = (str) => {
    str = str.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    str = str.replace(/\*(.+?)\*/g, '<em>$1</em>');
    str = str.replace(/__(.+?)__/g, '<strong>$1</strong>');
    str = str.replace(/_(.+?)_/g, '<em>$1</em>');
    str = str.replace(/`(.+?)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>');
    return str;
  };

  const paragraphs = text.split('\n\n').filter(p => p.trim());
  
  return (
    <div>
      {paragraphs.map((para, idx) => {
        if (para.startsWith('### ')) {
          return (
            <h3 key={idx} style={{ marginBottom: 8, marginTop: 12, fontSize: '1.1rem', fontWeight: 'bold' }}>
              {para.replace('### ', '')}
            </h3>
          );
        }
        
        if (para.startsWith('## ')) {
          return (
            <h2 key={idx} style={{ marginBottom: 10, marginTop: 14, fontSize: '1.3rem', fontWeight: 'bold' }}>
              {para.replace('## ', '')}
            </h2>
          );
        }
        
        if (para.startsWith('# ')) {
          return (
            <h1 key={idx} style={{ marginBottom: 12, marginTop: 16, fontSize: '1.5rem', fontWeight: 'bold' }}>
              {para.replace('# ', '')}
            </h1>
          );
        }
        
        if (para.includes('\n- ') || para.includes('\n• ')) {
          const items = para.split('\n').filter(line => line.trim());
          return (
            <ul key={idx} style={{ marginBottom: 12, paddingLeft: 20, marginTop: 0 }}>
              {items.map((item, i) => {
                const cleaned = item.replace(/^[•\-]\s*/, '').trim();
                if (!cleaned) return null;
                return (
                  <li 
                    key={i} 
                    style={{ marginBottom: 4 }}
                    dangerouslySetInnerHTML={{ __html: formatText(cleaned) }}
                  />
                );
              })}
            </ul>
          );
        }
        
        if (/^\d+\./.test(para.trim())) {
          const items = para.split('\n').filter(line => line.trim());
          return (
            <ol key={idx} style={{ marginBottom: 12, paddingLeft: 20, marginTop: 0 }}>
              {items.map((item, i) => {
                const cleaned = item.replace(/^\d+\.\s*/, '').trim();
                if (!cleaned) return null;
                return (
                  <li 
                    key={i} 
                    style={{ marginBottom: 4 }}
                    dangerouslySetInnerHTML={{ __html: formatText(cleaned) }}
                  />
                );
              })}
            </ol>
          );
        }
        
        return (
          <p 
            key={idx} 
            style={{ marginBottom: 12, marginTop: 0, lineHeight: "1.6" }}
            dangerouslySetInnerHTML={{ __html: formatText(para) }}
          />
        );
      })}
    </div>
  );
};

// Режимы AI
const AI_MODES = {
  assistant: { 
    name: "Ассистент", 
    icon: <User size={16} />, 
    color: "#6c63ff",
    description: "Общие вопросы и помощь"
  },
  coach: { 
    name: "Тренер", 
    icon: <Zap size={16} />, 
    color: "#00c49f",
    description: "Упражнения и мотивация"
  },
  analyst: { 
    name: "Аналитик", 
    icon: <BarChart3 size={16} />, 
    color: "#ff6584",
    description: "Анализ данных и статистика"
  },
  psychologist: { 
    name: "Психолог", 
    icon: <Heart size={16} />, 
    color: "#ffbb28",
    description: "Эмоции и благополучие"
  }
};

// Получение контекста пользователя
const getUserContext = () => {
  const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  const notes = JSON.parse(localStorage.getItem("notes") || "[]");
  const completedExercises = JSON.parse(localStorage.getItem("completedExercises") || "[]");
  const streak = parseInt(localStorage.getItem("workoutStreak") || "0");
  
  return {
    name: "Пользователь",
    streak,
    completedExercises: completedExercises.length,
    tasks: tasks.slice(0, 5),
    notes: notes.slice(0, 3)
  };
};

// Быстрые действия
const getQuickActions = () => {
  const actions = [];
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 12) {
    actions.push({ text: "🌅 План на день", prompt: "Помоги составить план на день" });
    actions.push({ text: "🧘 Утренняя зарядка", prompt: "Покажи утреннюю зарядку" });
  }
  
  if (hour >= 12 && hour < 18) {
    actions.push({ text: "🎯 Улучшить осанку", prompt: "Как улучшить осанку?" });
    actions.push({ text: "⏰ Начать Pomodoro", action: "start_pomodoro" });
  }
  
  if (hour >= 18 && hour < 23) {
    actions.push({ text: "📊 Итоги дня", prompt: "Покажи итоги дня" });
    actions.push({ text: "🌙 Расслабление", prompt: "Упражнения для расслабления" });
  }
  
  actions.push({ text: "📈 Мой прогресс", prompt: "Покажи мою статистику и прогресс" });
  actions.push({ text: "💪 Упражнения", action: "goto_workout" });
  
  return actions.slice(0, 6);
};

export default function ChatBot() {
  // Основные состояния
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem("chats");
    return saved ? JSON.parse(saved) : [{ id: "chat-1", title: "Чат 1", messages: [], createdAt: Date.now() }];
  });
  const [activeChat, setActiveChat] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(null);
  const [editingChatIndex, setEditingChatIndex] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  
  // Режимы и настройки
  const [currentMode, setCurrentMode] = useState("assistant");
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [userContext] = useState(getUserContext());
  const [quickActions] = useState(getQuickActions());
  
  // Pomodoro
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  
  // Уведомления
  const [notifications, setNotifications] = useState([]);
  
  const messagesEndRef = useRef(null);

  // Сохранение чатов
  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);

  // Отправка отложенного сообщения
  useEffect(() => {
    if (pendingMessage && chats[activeChat]) {
      const msg = pendingMessage;
      setPendingMessage(null);
      setTimeout(() => {
        sendMessageInternal(msg);
      }, 100);
    }
  }, [activeChat, pendingMessage]);

  // Скролл вниз
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, activeChat]);

  // Pomodoro таймер
  useEffect(() => {
    if (!pomodoroActive) return;
    
    const interval = setInterval(() => {
      setPomodoroTime(prev => {
        if (prev <= 1) {
          setPomodoroActive(false);
          showNotification("⏰ Pomodoro завершён!", "Время на перерыв! Встань, потянись.");
          return 25 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [pomodoroActive]);

  // Система уведомлений
  const showNotification = (title, body) => {
    const notif = { id: Date.now(), title, body };
    setNotifications(prev => [...prev, notif]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    }, 5000);

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "🤖" });
    }
  };

  const addNewChat = () => {
    // Находим максимальный номер чата
    const chatNumbers = chats.map(c => {
      const match = c.title.match(/Чат (\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const maxNumber = Math.max(0, ...chatNumbers);
    
    const newChat = { 
      id: `chat-${Date.now()}`,
      title: `Чат ${maxNumber + 1}`, 
      messages: [],
      createdAt: Date.now()
    };
    setChats([...chats, newChat]);
    setActiveChat(chats.length);
  };

  const deleteChat = (index) => {
    if (chats.length === 1) {
      alert("Нельзя удалить последний чат!");
      return;
    }
    
    // Подтверждение удаления
    if (!window.confirm(`Удалить "${chats[index].title}"? Все сообщения будут потеряны.`)) {
      return;
    }
    
    const newChats = chats.filter((_, i) => i !== index);
    setChats(newChats);
    
    if (activeChat >= newChats.length) {
      setActiveChat(Math.max(0, newChats.length - 1));
    } else if (activeChat === index) {
      setActiveChat(0);
    }
  };

  const startEditingChat = (index, e) => {
    e.stopPropagation();
    setEditingChatIndex(index);
    setEditingTitle(chats[index].title);
  };

  const saveEditedTitle = (index) => {
    if (editingTitle.trim()) {
      const newChats = [...chats];
      newChats[index].title = editingTitle.trim();
      setChats(newChats);
    }
    setEditingChatIndex(null);
    setEditingTitle("");
  };

  const cancelEditingTitle = () => {
    setEditingChatIndex(null);
    setEditingTitle("");
  };

  const handleQuickAction = (action) => {
    if (action.action === "start_pomodoro") {
      setPomodoroActive(true);
      showNotification("⏰ Pomodoro запущен", "25 минут фокуса. Я напомню о перерыве.");
    } else if (action.action === "goto_workout") {
      window.location.href = "/workout";
    } else if (action.prompt) {
      sendMessage(action.prompt);
    }
  };

  const sendMessage = async (customMessage) => {
    const messageText = customMessage || input.trim();
    if (!messageText || loading) return;

    if (!chats[activeChat]) {
      setPendingMessage(messageText);
      setInput("");
      addNewChat();
      return;
    }

    await sendMessageInternal(messageText);
  };

  const sendMessageInternal = async (messageText) => {
    if (!chats[activeChat] || !messageText || loading) return;

    const newChats = [...chats];
    const currentChat = newChats[activeChat];
    
    currentChat.messages.push({ sender: "user", text: messageText });
    setChats(newChats);

    setInput("");
    setLoading(true);

    try {
      // Формируем контекст
      const contextInfo = `
Контекст пользователя:
- Streak: ${userContext.streak} дней
- Упражнений выполнено: ${userContext.completedExercises}
- Задачи: ${userContext.tasks.map(t => t.text).join(", ") || "Нет"}
- Режим AI: ${AI_MODES[currentMode].name} (${AI_MODES[currentMode].description})

Вопрос пользователя: ${messageText}

Ответь как ${AI_MODES[currentMode].name}. Используй эмодзи, будь дружелюбным и персонализированным. Форматируй ответ с абзацами и списками для лучшей читаемости.`;

      const API_URL = window.location.hostname === "localhost"
        ? "http://localhost:5000/api/chat"
        : "/api/chat";

      console.log("📤 Sending to:", API_URL);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: contextInfo }),
      });

      console.log("📡 Response status:", response.status);

      const text = await response.text();
      console.log("📥 Raw response:", text.substring(0, 100));

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("❌ JSON parse error:", e);
        throw new Error("Неверный формат ответа от сервера: " + text);
      }

      const replyText = data.reply || "Ошибка: нет ответа от сервера.";
      console.log("✅ Bot reply:", replyText.substring(0, 50));

      currentChat.messages.push({ sender: "bot", text: replyText });
      setChats([...newChats]);
      
    } catch (err) {
      console.error("❌ Ошибка:", err);
      currentChat.messages.push({
        sender: "bot",
        text: `Ошибка: ${err.message}\n\nПроверь:\n1. Запущен ли сервер (node server.js)\n2. Доступен ли http://localhost:5000\n3. Есть ли OPENAI_API_KEY в .env`,
      });
      setChats([...newChats]);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      
      if ("webkitSpeechRecognition" in window) {
        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = "ru-RU";
        recognition.continuous = false;
        
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsRecording(false);
        };
        
        recognition.onerror = () => {
          setIsRecording(false);
        };
        
        recognition.start();
      } else {
        setTimeout(() => {
          setIsRecording(false);
          setInput("Как улучшить осанку?");
        }, 2000);
      }
    }
  };

  const exportChat = () => {
    if (!chats[activeChat]) return;
    
    const chatText = chats[activeChat].messages.map((m, i) => 
      `[Сообщение ${i + 1}] ${m.sender === "user" ? "Вы" : "AI"}: ${m.text}`
    ).join("\n\n");
    
    const blob = new Blob([chatText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${chats[activeChat].title}-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="chat-container">
      {/* Левая панель */}
      <div className="chat-left-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h3 style={{ margin: 0 }}>Чаты</h3>
          {pomodoroActive && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 8px",
              background: "rgba(0, 196, 159, 0.2)",
              borderRadius: "6px",
              fontSize: "0.85rem"
            }}>
              <Clock size={14} color="#00c49f" />
              <span style={{ fontWeight: 600, color: "#00c49f" }}>{formatTime(pomodoroTime)}</span>
            </div>
          )}
        </div>
        
        <div className="chat-list">
          {chats.map((chat, i) => (
            <div
              key={chat.id}
              className={`chat-item ${activeChat === i ? "active" : ""}`}
              onClick={() => setActiveChat(i)}
            >
              {editingChatIndex === i ? (
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => saveEditedTitle(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEditedTitle(i);
                    if (e.key === "Escape") cancelEditingTitle();
                    e.stopPropagation();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  style={{
                    background: "transparent",
                    border: "1px solid var(--accent-color)",
                    borderRadius: "4px",
                    padding: "2px 6px",
                    color: "var(--text-color)",
                    fontSize: "0.9rem",
                    width: "100%"
                  }}
                />
              ) : (
                <span onDoubleClick={(e) => startEditingChat(i, e)}>
                  {chat.title}
                </span>
              )}
              
              {chats.length > 1 && (
                <span
                  className="delete-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(i);
                  }}
                  title="Удалить чат"
                >
                  ✕
                </span>
              )}
            </div>
          ))}
        </div>
        
        <button className="btn-new-chat" onClick={addNewChat}>
          + Новый чат
        </button>
      </div>

      {/* Правая панель */}
      <div className="chat-right-panel">
        {chats[activeChat] ? (
          <div className="chat-main">
            {/* Заголовок с режимами */}
            <div className="chat-title">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2>{chats[activeChat].title}</h2>
                <div style={{ display: "flex", gap: "8px" }}>
                  {/* Режим AI */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => setShowModeSelector(!showModeSelector)}
                      style={{
                        padding: "6px 12px",
                        background: "var(--button-bg)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        color: "var(--text-color)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.85rem"
                      }}
                      title="Режим AI"
                    >
                      {AI_MODES[currentMode].icon}
                      <span>{AI_MODES[currentMode].name}</span>
                      <ChevronDown size={14} />
                    </button>

                    {showModeSelector && (
                      <div style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        right: 0,
                        background: "var(--card-color)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "12px",
                        padding: "8px",
                        minWidth: "220px",
                        zIndex: 1000,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
                      }}>
                        {Object.entries(AI_MODES).map(([key, mode]) => (
                          <button
                            key={key}
                            onClick={() => {
                              setCurrentMode(key);
                              setShowModeSelector(false);
                            }}
                            style={{
                              width: "100%",
                              padding: "10px",
                              background: currentMode === key ? "rgba(255,255,255,0.1)" : "transparent",
                              border: "none",
                              borderRadius: "8px",
                              color: "var(--text-color)",
                              cursor: "pointer",
                              textAlign: "left",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              marginBottom: "4px"
                            }}
                          >
                            <div style={{ color: mode.color }}>{mode.icon}</div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{mode.name}</div>
                              <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>{mode.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Быстрые действия */}
            <div style={{
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              padding: "8px 0",
              borderBottom: "1px solid var(--border-color)"
            }}>
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickAction(action)}
                  style={{
                    padding: "6px 12px",
                    background: "rgba(108, 99, 255, 0.1)",
                    border: "1px solid rgba(108, 99, 255, 0.3)",
                    borderRadius: "16px",
                    color: "var(--text-color)",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    whiteSpace: "nowrap"
                  }}
                >
                  {action.text}
                </button>
              ))}
            </div>

            {/* Сообщения */}
            <div className="chat-messages">
              <AnimatePresence initial={false}>
                {chats[activeChat].messages.map((msg, idx) => (
                  <motion.div
                    key={`${activeChat}-${idx}`}
                    className={`chat-message ${msg.sender}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="chat-avatar">
                      {msg.sender === "bot" ? "🤖" : "🧑"}
                    </div>
                    <div className={`chat-bubble ${msg.sender}`}>
                      {msg.sender === "bot" ? (
                        <FormattedMessage text={msg.text} />
                      ) : (
                        msg.text
                      )}
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <motion.div
                    className="chat-message bot"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="chat-avatar">🤖</div>
                    <div className="chat-bubble bot typing">
                      <span>...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Ввод */}
            <div className="chat-input">
              <button
                onClick={toggleRecording}
                style={{
                  padding: "10px",
                  background: isRecording ? "rgba(255, 101, 132, 0.2)" : "var(--button-bg)",
                  border: `1px solid ${isRecording ? "#ff6584" : "var(--border-color)"}`,
                  borderRadius: "10px",
                  color: isRecording ? "#ff6584" : "var(--text-color)",
                  cursor: "pointer",
                  transition: "all 0.3s"
                }}
                title="Голосовой ввод"
              >
                {isRecording ? <Mic size={18} /> : <MicOff size={18} />}
              </button>

              <input
                className="input"
                type="text"
                value={input}
                placeholder={isRecording ? "Слушаю..." : "Введите сообщение..."}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={loading || isRecording}
              />
              
              <button 
                className="btn-primary" 
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
              >
                <Send size={18} style={{ marginRight: "6px" }} />
                Отправить
              </button>
            </div>
          </div>
        ) : (
          <div className="chat-placeholder">
            Выберите чат слева или создайте новый
          </div>
        )}
      </div>

      {/* Уведомления */}
      <div style={{
        position: "fixed",
        top: "100px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }}>
        <AnimatePresence>
          {notifications.map(notif => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              style={{
                padding: "16px 20px",
                background: "var(--card-color)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(108, 99, 255, 0.3)",
                borderRadius: "12px",
                minWidth: "300px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                color: "var(--text-color)"
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: "4px" }}>{notif.title}</div>
              <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>{notif.body}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}