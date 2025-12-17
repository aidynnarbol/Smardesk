import React, { useState } from "react";
import PageWrapper from "../components/PageWrapper.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, Crown, Zap, Users, Sparkles, TrendingUp, 
  Shield, Clock, Headphones, BarChart3, Brain,
  Camera, MessageSquare, Dumbbell, Award, Star,
  ArrowRight, Gift, Target, Phone, Mail, MessageCircle
} from "lucide-react";

const plans = [
  {
    id: "free",
    title: "Базовый",
    subtitle: "Для начинающих",
    price: "0",
    period: "навсегда",
    icon: <Sparkles size={32} />,
    color: "#6c63ff",
    gradient: "linear-gradient(135deg, #6c63ff, #9333ea)",
    popular: false,
    features: [
      { text: "Отслеживание осанки с камерой", icon: <Camera size={16} />, available: true },
      { text: "AI чат-бот (базовый режим)", icon: <MessageSquare size={16} />, available: true },
      { text: "До 10 задач и заметок", icon: <Check size={16} />, available: true },
      { text: "3 упражнения из библиотеки", icon: <Dumbbell size={16} />, available: true },
      { text: "Базовая статистика (7 дней)", icon: <BarChart3 size={16} />, available: true },
      { text: "1 сайт для трекинга", icon: <Target size={16} />, available: true },
      { text: "Светлая/тёмная тема", icon: <Sparkles size={16} />, available: true },
      { text: "Расширенная аналитика", icon: <TrendingUp size={16} />, available: false },
      { text: "AI режимы (Тренер, Аналитик)", icon: <Brain size={16} />, available: false },
      { text: "Экспорт данных", icon: <Shield size={16} />, available: false }
    ],
    cta: "Начать бесплатно",
    description: "Идеально для знакомства с приложением и базовых потребностей"
  },
  {
    id: "premium",
    title: "Premium",
    subtitle: "Максимум возможностей",
    price: "799",
    period: "в месяц",
    icon: <Crown size={32} />,
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b, #ef4444)",
    popular: true,
    badge: "🔥 Популярный",
    features: [
      { text: "Всё из Базового плана", icon: <Check size={16} />, available: true, highlight: true },
      { text: "Расширенная AI аналитика", icon: <Brain size={16} />, available: true },
      { text: "Все 4 режима AI", icon: <MessageSquare size={16} />, available: true },
      { text: "Неограниченные задачи", icon: <Zap size={16} />, available: true },
      { text: "Полная библиотека упражнений", icon: <Dumbbell size={16} />, available: true },
      { text: "Статистика за всё время", icon: <BarChart3 size={16} />, available: true },
      { text: "Неограниченный трекинг", icon: <Target size={16} />, available: true },
      { text: "Голосовой ввод в чате", icon: <Headphones size={16} />, available: true },
      { text: "Экспорт всех данных", icon: <Shield size={16} />, available: true },
      { text: "Интеграции", icon: <Sparkles size={16} />, available: true },
      { text: "Pomodoro таймер", icon: <Clock size={16} />, available: true },
      { text: "Поддержка 24/7", icon: <Headphones size={16} />, available: true },
      { text: "Без рекламы", icon: <Star size={16} />, available: true }
    ],
    cta: "Перейти на Premium",
    description: "Для тех, кто серьёзно относится к своему здоровью и продуктивности",
    savings: "Экономия 2 388 ₽ при годовой подписке!"
  },
  {
    id: "corporate",
    title: "Корпоративный",
    subtitle: "Для команд",
    price: "По запросу",
    period: "",
    icon: <Users size={32} />,
    color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981, #06b6d4)",
    popular: false,
    features: [
      { text: "Всё из Premium", icon: <Check size={16} />, available: true, highlight: true },
      { text: "От 5 до 500+ аккаунтов", icon: <Users size={16} />, available: true },
      { text: "Командная статистика", icon: <BarChart3 size={16} />, available: true },
      { text: "Корпоративная аналитика", icon: <TrendingUp size={16} />, available: true },
      { text: "Централизованное управление", icon: <Shield size={16} />, available: true },
      { text: "Кастомные интеграции", icon: <Zap size={16} />, available: true },
      { text: "API доступ", icon: <Sparkles size={16} />, available: true },
      { text: "Персональный менеджер", icon: <Headphones size={16} />, available: true },
      { text: "SLA 99.9% гарантия", icon: <Award size={16} />, available: true },
      { text: "Обучение команды", icon: <Brain size={16} />, available: true },
      { text: "Ежемесячные отчёты", icon: <BarChart3 size={16} />, available: true },
      { text: "Приоритетные фичи", icon: <Star size={16} />, available: true }
    ],
    cta: "Связаться с нами",
    description: "Забота о здоровье всей команды"
  }
];

export default function Premium() {
  const [billingPeriod, setBillingPeriod] = useState("monthly");

  const getPrice = (plan) => {
    if (plan.id === "free") return { price: "0", period: "навсегда" };
    if (plan.id === "corporate") return { price: "По запросу", period: "" };
    if (billingPeriod === "yearly") {
      return { price: "6 790", period: "в год", save: "2 388 ₽" };
    }
    return { price: plan.price, period: plan.period };
  };

  return (
    <PageWrapper>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "20px"
      }}>
        
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: "60px" }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            style={{
              display: "inline-block",
              marginBottom: "20px"
            }}
          >
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f59e0b, #ef4444)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              boxShadow: "0 20px 60px rgba(245, 158, 11, 0.4)"
            }}>
              <Crown size={40} color="#fff" />
            </div>
          </motion.div>

          <h1 style={{
            margin: "0 0 16px 0",
            fontSize: "3.5rem",
            fontWeight: 800,
            background: "linear-gradient(135deg, #f59e0b, #ef4444)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            Выбери свой план
          </h1>
          
          <p style={{
            fontSize: "1.3rem",
            opacity: 0.8,
            maxWidth: "700px",
            margin: "0 auto 32px auto",
            lineHeight: 1.6,
            color: "var(--text-color)"
          }}>
            Инвестируй в своё здоровье и продуктивность
          </p>

          {/* Переключатель */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              display: "inline-flex",
              gap: "8px",
              padding: "6px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.1)"
            }}
          >
            <button
              onClick={() => setBillingPeriod("monthly")}
              style={{
                padding: "12px 32px",
                borderRadius: "12px",
                border: "none",
                background: billingPeriod === "monthly" ? "linear-gradient(135deg, #f59e0b, #ef4444)" : "transparent",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s"
              }}
            >
              Месяц
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              style={{
                padding: "12px 32px",
                borderRadius: "12px",
                border: "none",
                background: billingPeriod === "yearly" ? "linear-gradient(135deg, #f59e0b, #ef4444)" : "transparent",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s",
                position: "relative"
              }}
            >
              Год
              {billingPeriod === "yearly" && (
                <span style={{
                  position: "absolute",
                  top: "-8px",
                  right: "-8px",
                  background: "#10b981",
                  padding: "2px 8px",
                  borderRadius: "8px",
                  fontSize: "0.7rem",
                  fontWeight: 700
                }}>
                  -25%
                </span>
              )}
            </button>
          </motion.div>
        </motion.div>

        {/* Карточки планов */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "32px",
          marginBottom: "80px"
        }}>
          {plans.map((plan, index) => {
            const priceInfo = getPrice(plan);
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                whileHover={{ y: -12, scale: 1.02 }}
                style={{
                  background: plan.popular 
                    ? "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.15))"
                    : "rgba(255,255,255,0.05)",
                  borderRadius: "24px",
                  padding: "32px",
                  border: plan.popular ? "2px solid #f59e0b" : "1px solid rgba(255,255,255,0.1)",
                  position: "relative",
                  overflow: "hidden",
                  backdropFilter: "blur(10px)",
                  boxShadow: plan.popular 
                    ? "0 20px 60px rgba(245, 158, 11, 0.3)" 
                    : "0 8px 32px rgba(0,0,0,0.3)"
                }}
              >
                {plan.popular && (
                  <motion.div
                    initial={{ x: 100 }}
                    animate={{ x: 0 }}
                    style={{
                      position: "absolute",
                      top: "20px",
                      right: "20px",
                      background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                      padding: "8px 16px",
                      borderRadius: "12px",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 4px 16px rgba(245, 158, 11, 0.4)"
                    }}
                  >
                    {plan.badge}
                  </motion.div>
                )}

                <div style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "16px",
                  background: plan.gradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "24px",
                  boxShadow: `0 12px 32px ${plan.color}40`
                }}>
                  {plan.icon}
                </div>

                <h3 style={{
                  margin: "0 0 8px 0",
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: "var(--text-color)"
                }}>
                  {plan.title}
                </h3>
                
                <p style={{
                  margin: "0 0 24px 0",
                  fontSize: "1rem",
                  opacity: 0.7,
                  color: "var(--text-color)"
                }}>
                  {plan.subtitle}
                </p>

                <div style={{ marginBottom: "24px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <span style={{
                      fontSize: plan.id === "corporate" ? "2rem" : "3.5rem",
                      fontWeight: 800,
                      background: plan.gradient,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent"
                    }}>
                      {priceInfo.price}
                    </span>
                    {plan.id !== "corporate" && (
                      <span style={{ fontSize: "1.2rem", opacity: 0.6, color: "var(--text-color)" }}>₽</span>
                    )}
                  </div>
                  <div style={{ fontSize: "1rem", opacity: 0.6, marginTop: "4px", color: "var(--text-color)" }}>
                    {priceInfo.period}
                  </div>
                  {priceInfo.save && (
                    <div style={{
                      marginTop: "8px",
                      padding: "6px 12px",
                      background: "rgba(16, 185, 129, 0.2)",
                      border: "1px solid #10b981",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      color: "#10b981",
                      fontWeight: 600,
                      display: "inline-block"
                    }}>
                      <Gift size={14} style={{ display: "inline", marginRight: "6px" }} />
                      Экономия {priceInfo.save}
                    </div>
                  )}
                </div>

                <p style={{
                  fontSize: "0.95rem",
                  opacity: 0.8,
                  lineHeight: 1.6,
                  marginBottom: "24px",
                  minHeight: "60px",
                  color: "var(--text-color)"
                }}>
                  {plan.description}
                </p>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "16px",
                    border: "none",
                    background: plan.popular ? plan.gradient : "rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    marginBottom: "32px",
                    boxShadow: plan.popular ? `0 8px 24px ${plan.color}40` : "none",
                    transition: "all 0.3s"
                  }}
                >
                  {plan.cta}
                  <ArrowRight size={20} />
                </motion.button>

                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}>
                  {plan.features.map((feature, fIndex) => (
                    <motion.div
                      key={fIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.15 + fIndex * 0.03 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "0.95rem",
                        opacity: feature.available ? 1 : 0.4,
                        background: feature.highlight ? "rgba(245, 158, 11, 0.1)" : "transparent",
                        padding: feature.highlight ? "8px 12px" : "4px 0",
                        borderRadius: "8px",
                        border: feature.highlight ? "1px solid rgba(245, 158, 11, 0.3)" : "none",
                        color: "var(--text-color)"
                      }}
                    >
                      <div style={{
                        minWidth: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: feature.available 
                          ? `${plan.color}30`
                          : "rgba(255,255,255,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: feature.available ? plan.color : "#666"
                      }}>
                        {feature.available ? feature.icon : "—"}
                      </div>
                      <span style={{ flex: 1 }}>{feature.text}</span>
                    </motion.div>
                  ))}
                </div>

                {plan.savings && (
                  <div style={{
                    marginTop: "24px",
                    padding: "12px",
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: "12px",
                    fontSize: "0.85rem",
                    textAlign: "center",
                    color: "#10b981"
                  }}>
                    💰 {plan.savings}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Контакты */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{
            textAlign: "center",
            padding: "32px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.05)"
          }}
        >
          <p style={{
            fontSize: "1rem",
            opacity: 0.7,
            marginBottom: "16px",
            color: "var(--text-color)"
          }}>
            Остались вопросы? Мы всегда на связи!
          </p>
          <div style={{
            display: "flex",
            gap: "24px",
            justifyContent: "center",
            flexWrap: "wrap",
            fontSize: "0.95rem"
          }}>
            <a href="tel:+77471459042" style={{
              color: "#6c63ff",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <Phone size={16} />
              +7 747 145 9042
            </a>
            <a href="https://discordapp.com/users/ijustwantnewlife" target="_blank" rel="noreferrer" style={{
              color: "#6c63ff",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <MessageCircle size={16} />
              Discord
            </a>
          </div>
        </motion.div>

      </div>
    </PageWrapper>
  );
}