import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { motion, AnimatePresence } from "framer-motion";

export default function SelectPage() {
  const navigate = useNavigate();

  const defaultStudy = ["Bluebook.plus", "Notion", "Coursera", "Google Docs", "Khan Academy"];
  const defaultFun = ["YouTube", "Telegram", "Netflix", "Reddit", "Instagram"];

  const [studySelected, setStudySelected] = useState(() => {
    const s = localStorage.getItem("studySelected");
    return s ? JSON.parse(s) : [];
  });
  const [funSelected, setFunSelected] = useState(() => {
    const f = localStorage.getItem("funSelected");
    return f ? JSON.parse(f) : [];
  });

  const [customStudy, setCustomStudy] = useState([]);
  const [customFun, setCustomFun] = useState([]);
  const [newSite, setNewSite] = useState("");
  const [category, setCategory] = useState("study");

  // 🔹 Сохраняем данные при каждом изменении
  useEffect(() => {
    localStorage.setItem("studySelected", JSON.stringify(studySelected));
    localStorage.setItem("funSelected", JSON.stringify(funSelected));
  }, [studySelected, funSelected]);

  const toggle = (site, type) => {
    if (type === "study") {
      setStudySelected((prev) =>
        prev.includes(site) ? prev.filter((s) => s !== site) : [...prev, site]
      );
    } else {
      setFunSelected((prev) =>
        prev.includes(site) ? prev.filter((s) => s !== site) : [...prev, site]
      );
    }
  };

  const handleAddCustom = () => {
    if (!newSite.trim()) return;
    if (category === "study") {
      setCustomStudy((prev) => [...prev, newSite.trim()]);
      setStudySelected((prev) => [...prev, newSite.trim()]);
    } else {
      setCustomFun((prev) => [...prev, newSite.trim()]);
      setFunSelected((prev) => [...prev, newSite.trim()]);
    }
    setNewSite("");
  };

  const handleFinish = () => {
    const data = {
      study: [...studySelected, ...customStudy],
      fun: [...funSelected, ...customFun],
    };
    localStorage.setItem("smardeskSites", JSON.stringify(data));
    navigate("/");
  };

  // 🔹 Расчет фокус-прогресса
  const total = studySelected.length + funSelected.length || 1;
  const focusPercent = Math.round((studySelected.length / total) * 100);

  return (
    <div className="welcome-container">
      <motion.div
        className="welcome-card"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2>Какие сайты вы используете?</h2>
        <p className="muted">Это поможет Smardesk понять, как вы распределяете внимание.</p>

        {/* 🔹 Фокус-прогресс */}
        <div className="focus-bar-container">
          <div className="focus-bar">
            <motion.div
              className="focus-fill"
              initial={{ width: 0 }}
              animate={{ width: `${focusPercent}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          <p className="focus-text">
            Ваша концентрация: <strong>{focusPercent}%</strong>
          </p>
        </div>

        {/* 🔹 Учёба */}
        <h4 style={{ marginTop: 12 }}>Учёба / Работа</h4>
        <div className="option-grid">
          {[...defaultStudy, ...customStudy].map((s, i) => (
            <motion.div
              key={i}
              whileTap={{ scale: 0.95 }}
              className={`option-card ${studySelected.includes(s) ? "selected" : ""}`}
              onClick={() => toggle(s, "study")}
            >
              {s}
            </motion.div>
          ))}
        </div>

        {/* 🔹 Отдых */}
        <h4 style={{ marginTop: 16 }}>Отдых</h4>
        <div className="option-grid">
          {[...defaultFun, ...customFun].map((s, i) => (
            <motion.div
              key={i}
              whileTap={{ scale: 0.95 }}
              className={`option-card ${funSelected.includes(s) ? "selected" : ""}`}
              onClick={() => toggle(s, "fun")}
            >
              {s}
            </motion.div>
          ))}
        </div>

        {/* 🔹 Добавить свой сайт */}
        <div className="custom-add">
          <input
            type="text"
            placeholder="Добавить свой сайт..."
            value={newSite}
            onChange={(e) => setNewSite(e.target.value)}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="study">Учёба</option>
            <option value="fun">Отдых</option>
          </select>
          <button onClick={handleAddCustom}>+</button>
        </div>

        <button className="btn-primary" style={{ marginTop: 20 }} onClick={handleFinish}>
          Готово — перейти в Smardesk
        </button>
      </motion.div>
    </div>
  );
}
