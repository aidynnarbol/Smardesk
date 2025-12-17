import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "./Navbar.css";

export default function Navbar() {
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [showNav, setShowNav] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);

  const toggleProfileMenu = () => setProfileOpen((prev) => !prev);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll > lastScroll && currentScroll > 100) {
        setShowNav(false); // прокрутка вниз — скрываем
      } else {
        setShowNav(true); // прокрутка вверх — показываем
      }
      setLastScroll(currentScroll);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  const navLinks = [
    { path: "/", label: "Главная" },
    { path: "/statistics", label: "Статистика" },
    { path: "/workout", label: "Тренировки" },
    { path: "/chatbot", label: "Чат" },
  ];

  return (
    <motion.nav
      className="navbar"
      animate={{ y: showNav ? 0 : -120 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* LEFT: Logo + Brand */}
      <div className="navbar-left">
        <img src="/logo.svg" alt="Logo" className="logo" />
        <span className="brand-name">Smardesk</span>
      </div>

      {/* CENTER: Links */}
      <div className="navbar-links">
        {navLinks.map(({ path, label }, idx) => (
          <motion.div key={idx} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
            <Link
              to={path}
              className={`nav-link ${location.pathname === path ? "active" : ""}`}
            >
              {label}
              <motion.div
                className="link-underline"
                layoutId="underline"
                animate={{ width: location.pathname === path ? "100%" : "0%" }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* RIGHT: Profile */}
      <div className="navbar-profile">
        <motion.div
          className="profile-icon"
          onClick={toggleProfileMenu}
          whileHover={{ scale: 1.15, rotate: 5, textShadow: "0 0 12px var(--accent-color)" }}
          whileTap={{ scale: 0.95 }}
        >
          <FaUserCircle />
        </motion.div>

        <AnimatePresence>
          {profileOpen && (
            <motion.div
              className="profile-menu"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <Link to="/profile" onClick={() => setProfileOpen(false)}>Профиль</Link>
              <Link to="/settings" onClick={() => setProfileOpen(false)}>Настройки</Link>
              <Link to="/premium" onClick={() => setProfileOpen(false)}>Премиум</Link>
              <Link to="/help" onClick={() => setProfileOpen(false)}>Помощь</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
