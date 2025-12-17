// src/pages/Statistics.js - УЛУЧШЕННАЯ ВЕРСИЯ
import React, { useState, useEffect } from "react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Area, AreaChart, Legend } from "recharts";
import { TrendingUp, Award, Clock, Target, Edit2, Plus, X, Eye, Activity, Zap } from "lucide-react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import PageWrapper from "../components/PageWrapper";
import { generatePostureInsight, generateActivityInsight, generateStreakInsight, getAPIUsageStats } from "../utils/aiInsights";
import "./Statistics.css";

const COLORS = { study: "#6c63ff", fun: "#ff6584", good: "#00c49f", slouching: "#ffbb28" };

export default function Statistics() {
  const [timeRange, setTimeRange] = useState("today");
  const [pieData, setPieData] = useState([]);
  const [postureData, setPostureData] = useState([]);
  const [sitesList, setSitesList] = useState({ study: [], fun: [] });
  const [editMode, setEditMode] = useState(false);
  const [stats, setStats] = useState({ streak: 0, totalTime: 0, goodPostureTime: 0, focusScore: 0 });
  const [aiInsights, setAiInsights] = useState({ posture: "Загрузка...", activity: "Загрузка...", streak: "Загрузка..." });
  const [loading, setLoading] = useState(true);
  const [apiUsage, setApiUsage] = useState({ requests: 0, remaining: 20 });
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => { loadAllData(); }, [timeRange]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        // Проверяем использование API
        const usage = await getAPIUsageStats(user.uid);
        setApiUsage(usage);
      }
      
      await Promise.all([loadPostureData(), loadSiteData(), loadStats()]);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPostureData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setPostureData([]);
        setAiInsights(prev => ({...prev, posture: "🔐 Войдите в аккаунт чтобы видеть статистику осанки"}));
        return;
      }

      const now = new Date();
      let startDate = new Date();
      if (timeRange === "today") startDate.setHours(0, 0, 0, 0);
      else if (timeRange === "week") { startDate.setDate(now.getDate() - 7); startDate.setHours(0, 0, 0, 0); }
      else { startDate.setDate(now.getDate() - 30); startDate.setHours(0, 0, 0, 0); }

      const q = query(collection(db, "postureData"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setPostureData([]);
        setAiInsights(prev => ({...prev, posture: "📸 Включите камеру на главной странице чтобы начать отслеживание! Это займёт всего пару минут."}));
        return;
      }

      // 🔥 УЛУЧШЕННАЯ ГРУППИРОВКА: по 15-минутным интервалам
      const intervalStats = {};
      let totalRecordsInRange = 0;
      
      snapshot.forEach(doc => {
        const d = doc.data();
        if (!d.timestamp || !d.status) return;
        
        const docDate = d.timestamp.toDate();
        if (docDate < startDate) return;
        
        totalRecordsInRange++;
        
        // Группируем по 15-минутным интервалам
        const hour = docDate.getHours();
        const minute = docDate.getMinutes();
        const interval = Math.floor(minute / 15) * 15;
        const timeKey = `${String(hour).padStart(2, '0')}:${String(interval).padStart(2, '0')}`;
        
        if (!intervalStats[timeKey]) intervalStats[timeKey] = { good: 0, slouching: 0, total: 0 };
        if (d.status === 'good') intervalStats[timeKey].good++;
        else if (d.status.includes('slouch')) intervalStats[timeKey].slouching++;
        intervalStats[timeKey].total++;
      });

      if (totalRecordsInRange === 0) {
        setPostureData([]);
        setAiInsights(prev => ({...prev, posture: "📸 Включите камеру на главной странице чтобы начать отслеживание!"}));
        return;
      }

      // 🔥 Интерполяция пустых промежутков
      const data = Object.keys(intervalStats).sort().map(time => {
        const h = intervalStats[time];
        return { 
          time, 
          good: Math.round((h.good / h.total) * 100), 
          slouching: Math.round((h.slouching / h.total) * 100),
          total: h.total
        };
      });

      setPostureData(data);
      
      // 🤖 Запрашиваем AI инсайт
      setLoadingInsights(true);
      const insight = await generatePostureInsight(user.uid, data, totalRecordsInRange);
      setAiInsights(prev => ({...prev, posture: insight}));
      setLoadingInsights(false);
      
    } catch (error) {
      console.error("Posture error:", error);
      setPostureData([]);
      setAiInsights(prev => ({...prev, posture: "❌ Ошибка загрузки данных"}));
    }
  };

  const loadSiteData = async () => {
    try {
      const savedSites = localStorage.getItem("smardeskSites");
      if (!savedSites) {
        setPieData([{ name: "Нет сайтов", value: 1, percentage: 100, switches: 0 }]);
        setAiInsights(prev => ({...prev, activity: "📝 Добавьте сайты через кнопку 'Редактировать' ниже!"}));
        return;
      }

      const { study = [], fun = [] } = JSON.parse(savedSites);
      setSitesList({ study, fun });

      const user = auth.currentUser;
      let studySwitches = 0, funSwitches = 0;
      let recentSwitches = [];

      if (user) {
        try {
          const now = new Date();
          let startDate = new Date();
          if (timeRange === "today") startDate.setHours(0, 0, 0, 0);
          else if (timeRange === "week") { startDate.setDate(now.getDate() - 7); startDate.setHours(0, 0, 0, 0); }
          else { startDate.setDate(now.getDate() - 30); startDate.setHours(0, 0, 0, 0); }

          const q = query(collection(db, "siteActivity"), where("userId", "==", user.uid));
          const snapshot = await getDocs(q);
          
          snapshot.forEach(doc => {
            const d = doc.data();
            if (!d.timestamp) return;
            
            const docDate = d.timestamp.toDate();
            if (docDate < startDate) return;
            
            if (d.category === 'study') {
              studySwitches++;
              recentSwitches.push({ site: d.site, category: 'study', time: docDate });
            } else if (d.category === 'fun') {
              funSwitches++;
              recentSwitches.push({ site: d.site, category: 'fun', time: docDate });
            }
          });
        } catch (err) { 
          console.log('Site data error:', err); 
        }
      }

      const total = study.length + fun.length;
      if (total > 0) {
        setPieData([
          { name: "Учёба / Работа", value: study.length, percentage: Math.round((study.length / total) * 100), switches: studySwitches },
          { name: "Отдых", value: fun.length, percentage: Math.round((fun.length / total) * 100), switches: funSwitches }
        ]);
      }

      // 🤖 Запрашиваем AI инсайт для активности
      if (user) {
        const insight = await generateActivityInsight(user.uid, studySwitches, funSwitches, total, recentSwitches);
        setAiInsights(prev => ({...prev, activity: insight}));
      }
      
    } catch (error) { 
      console.error("Site error:", error); 
    }
  };

  const loadStats = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setStats({ streak: 0, totalTime: 0, goodPostureTime: 0, focusScore: 0 });
        setAiInsights(prev => ({...prev, streak: "🔐 Войдите в аккаунт"}));
        return;
      }

      const allQ = query(collection(db, "postureData"), where("userId", "==", user.uid));
      const allSnapshot = await getDocs(allQ);
      const totalRecords = allSnapshot.size;
      const totalTime = Math.round((totalRecords * 2) / 60);
      
      let goodCount = 0;
      allSnapshot.forEach(doc => { if (doc.data().status === 'good') goodCount++; });
      const goodPostureTime = Math.round((goodCount * 2) / 60);

      const dates = new Set();
      allSnapshot.forEach(doc => { const d = doc.data(); if (d.sessionDate) dates.add(d.sessionDate); });
      const sortedDates = Array.from(dates).sort().reverse();

      let streak = 0;
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (sortedDates[0] === today || sortedDates[0] === yesterdayStr) {
        let currentDate = sortedDates[0] === today ? today : yesterdayStr;
        for (const date of sortedDates) {
          if (date === currentDate) {
            streak++;
            const d = new Date(currentDate);
            d.setDate(d.getDate() - 1);
            currentDate = d.toISOString().split('T')[0];
          } else {
            break;
          }
        }
      }

      const focusScore = totalRecords > 0 ? Math.round((goodCount / totalRecords) * 100) : 0;

      setStats({ streak, totalTime, goodPostureTime, focusScore });
      
      // 🤖 Запрашиваем AI инсайт для streak
      const insight = await generateStreakInsight(user.uid, streak, sortedDates.length);
      setAiInsights(prev => ({...prev, streak: insight}));
      
    } catch (error) {
      console.error("Stats error:", error);
    }
  };

  const removeSite = (site, type) => {
    const newList = { ...sitesList, [type]: sitesList[type].filter(s => s !== site) };
    setSitesList(newList);
    localStorage.setItem("smardeskSites", JSON.stringify(newList));
    loadSiteData();
  };

  const addSite = (type) => {
    const newSite = prompt(`Введите название сайта для категории "${type === 'study' ? 'Учёба/Работа' : 'Отдых'}":`);
    if (newSite && newSite.trim()) {
      const newList = { ...sitesList, [type]: [...sitesList[type], newSite.trim()] };
      setSitesList(newList);
      localStorage.setItem("smardeskSites", JSON.stringify(newList));
      loadSiteData();
    }
  };

  const CustomLineTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-title">{payload[0].payload.time}</p>
          <p className="tooltip-item">Измерений: <span className="tooltip-value">{payload[0].payload.total}</span></p>
          {payload.map((entry, index) => (
            <p key={index} className="tooltip-item">{entry.name}: <span className="tooltip-value" style={{color: entry.color}}>{entry.value}%</span></p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-title">{payload[0].name}</p>
          <p className="tooltip-item">Сайтов: <span className="tooltip-value">{payload[0].value}</span></p>
          <p className="tooltip-item">Переключений: <span className="tooltip-value green">{payload[0].payload.switches}</span></p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="loading-container">
          <div className="spinner" />
          <p className="loading-text">Загрузка статистики...</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="page-container">
        {/* API Usage Indicator */}
        {apiUsage.remaining < 5 && (
          <div style={{
            padding: '12px',
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '12px',
            marginBottom: '16px',
            textAlign: 'center',
            color: '#ff6b6b'
          }}>
            ⚠️ Осталось {apiUsage.remaining} AI запросов на сегодня. Сброс завтра.
          </div>
        )}

        <div className="metrics-grid">
          <MetricCard icon={<Award size={24} />} label="Streak" value={`${stats.streak} ${stats.streak === 1 ? 'день' : 'дней'}`} color="#00c49f" />
          <MetricCard icon={<Target size={24} />} label="Focus Score" value={`${stats.focusScore}%`} color="#6c63ff" />
          <MetricCard icon={<Clock size={24} />} label="Общее время" value={`${stats.totalTime} мин`} color="#ffbb28" />
          <MetricCard icon={<Eye size={24} />} label="Хорошая осанка" value={`${stats.goodPostureTime} мин`} color="#ff6584" />
        </div>

        <div className="filters">
          {["today", "week", "month"].map(range => (
            <button key={range} onClick={() => setTimeRange(range)} className={`filter-btn ${timeRange === range ? 'active' : ''}`}>
              {range === "today" ? "Сегодня" : range === "week" ? "Неделя" : "Месяц"}
            </button>
          ))}
        </div>

        <div className="chart-card">
          <h2>📊 Динамика осанки</h2>
          <ResponsiveContainer width="100%" height={350}>
            {postureData.length === 0 ? (
              <div style={{ 
                height: '100%',
                width: '100%',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '16px',
                color: 'var(--text-muted)'
              }}>
                <div style={{ fontSize: '4rem' }}>📸</div>
                <div style={{ 
                  fontSize: '1.2rem', 
                  textAlign: 'center', 
                  maxWidth: '400px',
                  lineHeight: '1.6'
                }}>
                  Включите камеру на главной странице<br/>
                  чтобы начать отслеживание осанки
                </div>
              </div>
            ) : (
              <AreaChart data={postureData}>
                <defs>
                  <linearGradient id="colorGood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.good} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.good} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSlou" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.slouching} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.slouching} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
                <YAxis stroke="rgba(255,255,255,0.5)" domain={[0, 100]} />
                <Tooltip content={<CustomLineTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="good" name="Правильно" stroke={COLORS.good} fillOpacity={1} fill="url(#colorGood)" />
                <Area type="monotone" dataKey="slouching" name="Сутулость" stroke={COLORS.slouching} fillOpacity={1} fill="url(#colorSlou)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
          <div className="ai-insight" style={{borderColor: COLORS.study}}>
            <p>
              {loadingInsights ? (
                <>⏳ <strong>AI анализирует...</strong></>
              ) : (
                <>💡 <strong>AI Инсайт:</strong> {aiInsights.posture}</>
              )}
            </p>
          </div>
        </div>

        <div className="chart-card">
          <h2>🎯 Распределение активности</h2>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} innerRadius={70} paddingAngle={5} label={({ percentage }) => `${percentage}%`} labelLine={false}>
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.study : COLORS.fun} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />)}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="sites-header">
            <h3>Ваши сайты</h3>
            <button onClick={() => setEditMode(!editMode)} className="edit-btn">
              <Edit2 size={16} />
              {editMode ? "Готово" : "Редактировать"}
            </button>
          </div>

          <div className="sites-grid">
            <CategoryBox title="📚 Учёба / Работа" sites={sitesList.study} color={COLORS.study} switches={pieData[0]?.switches || 0} editMode={editMode} onRemove={(site) => removeSite(site, 'study')} onAdd={() => addSite('study')} />
            <CategoryBox title="🎮 Отдых" sites={sitesList.fun} color={COLORS.fun} switches={pieData[1]?.switches || 0} editMode={editMode} onRemove={(site) => removeSite(site, 'fun')} onAdd={() => addSite('fun')} />
          </div>

          <div className="ai-insight" style={{borderColor: COLORS.fun}}>
            <p>💡 <strong>AI Инсайт:</strong> {aiInsights.activity}</p>
          </div>
        </div>

        <div className="chart-card">
          <h2>📅 Ваш прогресс</h2>
          <div className="progress-card">
            <div className="progress-emoji">🔥</div>
            <h3 className="progress-title">{stats.streak} {stats.streak === 1 ? 'день' : 'дней'} подряд!</h3>
            <p className="progress-text">{aiInsights.streak}</p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

function MetricCard({ icon, label, value, color }) {
  return (
    <div className="metric-card" style={{'--card-color': color}}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}

function CategoryBox({ title, sites, color, switches, editMode, onRemove, onAdd }) {
  return (
    <div className="category-box" style={{background: `${color}15`, borderColor: `${color}40`}}>
      <div className="category-header">
        <h4 style={{color}}>{title}</h4>
        <span className="category-badge" style={{background: `${color}30`}}>{switches} переключений</span>
      </div>
      <div className="category-sites">
        {sites.length > 0 ? (
          <div className="sites-list">
            {sites.map((site, i) => (
              <span key={i} className="site-chip">
                {site}
                {editMode && <X size={14} className="site-remove" onClick={() => onRemove(site)} />}
              </span>
            ))}
            {editMode && (
              <button onClick={onAdd} className="site-add" style={{borderColor: `${color}60`, background: `${color}30`}}>
                <Plus size={14} />
                Добавить
              </button>
            )}
          </div>
        ) : (
          <div>
            <span className="no-sites">Не выбрано</span>
            {editMode && (
              <button onClick={onAdd} className="site-add first" style={{borderColor: `${color}60`, background: `${color}30`}}>
                <Plus size={14} />
                Добавить
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}