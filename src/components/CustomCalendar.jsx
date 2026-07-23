import React, { useState, useEffect, useRef } from "react";
import "./CustomCalendar.css";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import {
  gregorianToJalali,
  jalaliToGregorian,
  formatToShamsiStr,
  SHAMSI_MONTH_NAMES_EN,
  SHAMSI_MONTH_NAMES_PS,
  SHAMSI_MONTH_NAMES_FA,
  toPashtoNumerals
} from "../utils/date";

const GREGORIAN_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const GREGORIAN_WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const SHAMSI_WEEKDAYS_EN = ["Sa", "Su", "Mo", "Tu", "We", "Th", "Fr"];
const SHAMSI_WEEKDAYS_FA = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const SHAMSI_WEEKDAYS_PS = ["شنبه", "یکشنبه", "دوشنبه", "سې‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

// Helper to check if Jalali year is leap
function isJalaliLeap(jy) {
  return ((((((jy - ((jy > 0) ? 474 : 473)) % 2820) + 474) + 38) * 682) % 2816) < 682;
}

// Get number of days in Jalali month
function getJalaliDaysInMonth(jy, jm) {
  if (jm >= 1 && jm <= 6) return 31;
  if (jm >= 7 && jm <= 11) return 30;
  if (jm === 12) {
    return isJalaliLeap(jy) ? 30 : 29;
  }
  return 30;
}

// Find day of week for a Jalali date (returns 0 for Saturday, 6 for Friday)
function getJalaliWeekday(jy, jm, jd) {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  const gDay = new Date(gy, gm - 1, gd).getDay();
  // Gregorian: 0 (Sun), 1 (Mon), 2 (Tue), 3 (Wed), 4 (Thu), 5 (Fri), 6 (Sat)
  // Shamsi: Saturday is 0, Sunday is 1, ..., Friday is 6
  const shamsiDayMap = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 };
  return shamsiDayMap[gDay];
}

export default function CustomCalendar({ value, onChange, label }) {
  const { t, language, calendarType } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Calendar navigation state (year & month index 0-11)
  const [navYear, setNavYear] = useState(new Date().getFullYear());
  const [navMonth, setNavMonth] = useState(new Date().getMonth());

  const isShamsi = calendarType === "shamsi";

  // Sync navigation view with input value
  useEffect(() => {
    if (value) {
      const parts = value.split("-");
      if (parts.length === 3) {
        const gy = parseInt(parts[0], 10);
        const gm = parseInt(parts[1], 10);
        const gd = parseInt(parts[2], 10);
        if (!isNaN(gy) && !isNaN(gm) && !isNaN(gd)) {
          if (isShamsi) {
            const [jy, jm] = gregorianToJalali(gy, gm, gd);
            setNavYear(jy);
            setNavMonth(jm - 1); // 0-indexed
          } else {
            setNavYear(gy);
            setNavMonth(gm - 1); // 0-indexed
          }
        }
      }
    } else {
      // Default to today
      const today = new Date();
      if (isShamsi) {
        const [jy, jm] = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
        setNavYear(jy);
        setNavMonth(jm - 1);
      } else {
        setNavYear(today.getFullYear());
        setNavMonth(today.getMonth());
      }
    }
  }, [value, isShamsi]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calendar math calculations based on system type
  const daysInMonth = isShamsi
    ? getJalaliDaysInMonth(navYear, navMonth + 1)
    : new Date(navYear, navMonth + 1, 0).getDate();

  const startOffset = isShamsi
    ? getJalaliWeekday(navYear, navMonth + 1, 1)
    : (() => {
        const day = new Date(navYear, navMonth, 1).getDay();
        return day === 0 ? 6 : day - 1; // Mon is 0
      })();

  // Season calculations for background visuals
  const getSeason = () => {
    const m = navMonth;
    if (isShamsi) {
      // Shamsi: Hamal (0), Sawr (1), Jawza (2) is spring
      if (m >= 0 && m <= 2) return "spring";
      if (m >= 3 && m <= 5) return "summer";
      if (m >= 6 && m <= 8) return "fall";
      return "winter";
    } else {
      if (m === 11 || m === 0 || m === 1) return "winter";
      if (m >= 2 && m <= 4) return "spring";
      if (m >= 5 && m <= 7) return "summer";
      return "fall";
    }
  };

  const season = getSeason();

  // Navigation handlers
  const handlePrevMonth = () => {
    if (navMonth === 0) {
      setNavMonth(11);
      setNavYear(navYear - 1);
    } else {
      setNavMonth(navMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (navMonth === 11) {
      setNavMonth(0);
      setNavYear(navYear + 1);
    } else {
      setNavMonth(navMonth + 1);
    }
  };

  // Day selection handler
  const handleSelectDay = (dayNum) => {
    let formattedDate = "";
    if (isShamsi) {
      const [gy, gm, gd] = jalaliToGregorian(navYear, navMonth + 1, dayNum);
      formattedDate = `${gy}-${gm.toString().padStart(2, "0")}-${gd.toString().padStart(2, "0")}`;
    } else {
      const selected = new Date(navYear, navMonth, dayNum);
      const offset = selected.getTimezoneOffset();
      formattedDate = new Date(selected.getTime() - offset * 60 * 1000)
        .toISOString()
        .split("T")[0];
    }
    onChange(formattedDate);
    setIsOpen(false);
  };

  // Displays date text in trigger button
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return label || "Choose Date";
    if (isShamsi) {
      return formatToShamsiStr(dateStr);
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // Check if a day cell is the selected value
  const isSelectedDay = (dayNum) => {
    if (!value) return false;
    const parts = value.split("-");
    if (parts.length !== 3) return false;
    const gy = parseInt(parts[0], 10);
    const gm = parseInt(parts[1], 10);
    const gd = parseInt(parts[2], 10);

    if (isShamsi) {
      const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);
      return jy === navYear && jm === (navMonth + 1) && jd === dayNum;
    } else {
      return gy === navYear && gm === (navMonth + 1) && gd === dayNum;
    }
  };

  // Get active month labels
  const monthName = isShamsi
    ? (() => {
        if (language === "ps") return SHAMSI_MONTH_NAMES_PS[navMonth];
        if (language === "da") return SHAMSI_MONTH_NAMES_FA[navMonth];
        return SHAMSI_MONTH_NAMES_EN[navMonth];
      })()
    : GREGORIAN_MONTH_NAMES[navMonth];

  const weekdayLabels = isShamsi
    ? language === "ps" ? SHAMSI_WEEKDAYS_PS : language === "da" ? SHAMSI_WEEKDAYS_FA : SHAMSI_WEEKDAYS_EN
    : GREGORIAN_WEEKDAYS;

  return (
    <div className="custom-calendar-container" ref={containerRef}>
      <button
        type="button"
        className="calendar-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon size={16} />
        <span>{formatDateDisplay(value)}</span>
      </button>

      {isOpen && (
        <div className={`calendar-dropdown-modal ${season}`}>
          <div className="calendar-header-svg">
            <svg width="100%" height="82" viewBox="0 0 350 82" className="seasons-illustrator">
              {season === "winter" && (
                <g id="winter">
                  <circle fill="#FFFFFF" cx="50" cy="30" r="4" className="snow-flake" />
                  <circle fill="#FFFFFF" cx="150" cy="20" r="3.5" className="snow-flake delay-1" />
                  <circle fill="#FFFFFF" cx="220" cy="45" r="5" className="snow-flake delay-2" />
                  <circle fill="#FFFFFF" cx="280" cy="15" r="3" className="snow-flake delay-3" />
                  <circle fill="#FFFFFF" cx="310" cy="55" r="4.5" className="snow-flake delay-4" />
                  <path d="M10,70 Q90,50 180,68 T350,60" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
                </g>
              )}

              {season === "spring" && (
                <g id="spring">
                  <path d="M40,82 Q45,50 35,25" stroke="#10b981" fill="none" strokeWidth="2" />
                  <path d="M300,82 Q295,45 310,20" stroke="#10b981" fill="none" strokeWidth="2" />
                  <g transform="translate(35, 25)">
                    <circle fill="#fbbf24" cx="0" cy="0" r="5" />
                    <circle fill="#f43f5e" cx="0" cy="-8" r="4" />
                    <circle fill="#f43f5e" cx="8" cy="0" r="4" />
                    <circle fill="#f43f5e" cx="0" cy="8" r="4" />
                    <circle fill="#f43f5e" cx="-8" cy="0" r="4" />
                  </g>
                  <g transform="translate(310, 20)">
                    <circle fill="#f43f5e" cx="0" cy="0" r="5" />
                    <circle fill="#fbbf24" cx="0" cy="-8" r="4" />
                    <circle fill="#fbbf24" cx="8" cy="0" r="4" />
                    <circle fill="#fbbf24" cx="0" cy="8" r="4" />
                    <circle fill="#fbbf24" cx="-8" cy="0" r="4" />
                  </g>
                </g>
              )}

              {season === "summer" && (
                <g id="summer">
                  <g transform="translate(175, 40)" className="sun-group">
                    <circle fill="#eab308" cx="0" cy="0" r="18" />
                    <line x1="0" y1="-24" x2="0" y2="-32" stroke="#eab308" strokeWidth="3" strokeLinecap="round" className="ray" />
                    <line x1="0" y1="24" x2="0" y2="32" stroke="#eab308" strokeWidth="3" strokeLinecap="round" className="ray" />
                    <line x1="-24" y1="0" x2="-32" y2="0" stroke="#eab308" strokeWidth="3" strokeLinecap="round" className="ray" />
                    <line x1="24" y1="0" x2="32" y2="0" stroke="#eab308" strokeWidth="3" strokeLinecap="round" className="ray" />
                    <line x1="-17" y1="-17" x2="-23" y2="-23" stroke="#eab308" strokeWidth="3" strokeLinecap="round" className="ray" />
                    <line x1="17" y1="17" x2="23" y2="23" stroke="#eab308" strokeWidth="3" strokeLinecap="round" className="ray" />
                    <line x1="17" y1="-17" x2="23" y2="-23" stroke="#eab308" strokeWidth="3" strokeLinecap="round" className="ray" />
                    <line x1="-17" y1="17" x2="-23" y2="23" stroke="#eab308" strokeWidth="3" strokeLinecap="round" className="ray" />
                  </g>
                </g>
              )}

              {season === "fall" && (
                <g id="fall">
                  <g className="leaf fall-anim-1" transform="translate(60, 20)">
                    <path d="M0,0 Q10,-10 20,0 T0,0" fill="#f97316" />
                  </g>
                  <g className="leaf fall-anim-2" transform="translate(160, 10)">
                    <path d="M0,0 Q10,-10 20,0 T0,0" fill="#ea580c" />
                  </g>
                  <g className="leaf fall-anim-3" transform="translate(280, 25)">
                    <path d="M0,0 Q10,-10 20,0 T0,0" fill="#b45309" />
                  </g>
                </g>
              )}
            </svg>
          </div>

          <div className="calendar-controls">
            <button type="button" className="nav-btn prev" onClick={handlePrevMonth}>
              <ChevronLeft size={18} />
            </button>
            <div className="calendar-month-year">
              <span className="month">{monthName}</span>
              <span className="year">{isShamsi ? toPashtoNumerals(navYear) : navYear}</span>
            </div>
            <button type="button" className="nav-btn next" onClick={handleNextMonth}>
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="calendar-weekdays">
            {weekdayLabels.map((d, index) => (
              <div key={index} className="weekday-label">{d}</div>
            ))}
          </div>

          <div className="calendar-grid">
            {/* Render offsets */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`offset-${i}`} className="day-cell empty" />
            ))}

            {/* Render active days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected = isSelectedDay(dayNum);
              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  className={`day-cell day-num ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectDay(dayNum)}
                >
                  <span className="day-text">{isShamsi ? toPashtoNumerals(dayNum) : dayNum}</span>
                  {isSelected && (
                    <svg className="circle-draw-svg" viewBox="0 0 40 40">
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        className="draw-circle-path"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
