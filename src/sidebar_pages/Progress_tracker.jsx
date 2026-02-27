import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useAuth } from "../utils/auth";
import "./progressTracker.css";

/* helpers and constants left unchanged (pad, isoDate, MET_MAP, mapDbRowToSession, aggregate, downloadCSV) */
const YEAR_MIN = 2024;
const YEAR_MAX = 2028;
const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function pad(n){ return n<10?`0${n}`:`${n}`; }
function isoDate(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }
function daysInMonth(y,m){ return new Date(y,m+1,0).getDate(); }
function dayOfWeek(y,m,d){ return new Date(y,m,d).getDay(); }
function toHHMM(dt){ const d=new Date(dt); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function dateOnlyISO(dt){ const d=new Date(dt); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

const PROGRESS_STATE_KEY = "ff-progress-state";

function readProgressState(){
  try {
    const raw = sessionStorage.getItem(PROGRESS_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === "object") ? parsed : null;
  } catch (e) {
    return null;
  }
}

function clampYear(val){
  const n = Number(val);
  if (!Number.isFinite(n)) return null;
  return Math.min(YEAR_MAX, Math.max(YEAR_MIN, n));
}

function clampMonth(val){
  const n = Number(val);
  if (!Number.isFinite(n)) return null;
  return Math.min(11, Math.max(0, n));
}

function formatMinutes(mins){
  const v = Number(mins);
  return `${Number.isFinite(v) ? v : 0} min`;
}

function formatCalories(kcal){
  const v = Number(kcal);
  return `${Number.isFinite(v) ? v : 0} kcal`;
}

function formatFlex(pts){
  const v = Number(pts);
  return `${Number.isFinite(v) ? v : 0} pts`;
}

const MET_MAP = {
  "PUSH-UPS": 8.0, "PUSHUP": 8.0, "PUSH": 8.0, "SQUAT": 8.0, "SQUATS": 8.0,
  "LUNGE": 8.0, "LUNGES": 8.0, "PLANK": 3.5, "BURPEE": 10.0, "BURPEES": 10.0,
  "PULLUP": 8.0, "PULL-UP": 8.0, "PULL-UPS": 8.0, "JUMPING JACK": 8.0,
  "HIGH KNEE": 9.0, "HIGH-KNEE": 9.0, "MOUNTAIN CLIMBER": 8.5, "SKIPPING": 12.0,
  "SKIP": 12.0, "SHADOW BOX": 7.0, "SIT-UP": 6.0, "SITUPS": 6.0, "CRUNCH": 6.0,
  "STRETCH": 2.5, "YOGA": 3.0, "BALANCE": 3.5, "DEFAULT": 6.0,
};

function getMET(workoutName = "") {
  if(!workoutName) return MET_MAP.DEFAULT;
  const n = String(workoutName).toUpperCase();
  const keys = Object.keys(MET_MAP).sort((a,b)=>b.length - a.length);
  for (const key of keys) {
    if (key === "DEFAULT") continue;
    if (n.includes(key)) return MET_MAP[key];
  }
  return MET_MAP.DEFAULT;
}

function mapDbRowToSession(row){
  const created = row.created_at ? new Date(row.created_at) : new Date();
  const dateIso = dateOnlyISO(created);
  const timeStr = toHHMM(created);

  const time_seconds = row.time_seconds ? Number(row.time_seconds) : 0;
  const minutes = time_seconds ? Math.ceil(time_seconds / 60) : 0;

  const weight = (row.weight_kg !== null && row.weight_kg !== undefined) ? Number(row.weight_kg) : 0;
  const met = getMET(row.workout_name);

  const calories = (met && weight && time_seconds)
    ? Math.round((met * weight * (time_seconds / 3600)) * 100) / 100
    : 0;

  return {
    id: row.id,
    date: dateIso,
    time: timeStr,
    workoutName: row.workout_name || "Workout",
    reps: row.reps ?? 0,
    minutes,
    calories,
    eca: row.eca_points ?? 0,
    raw: row,
  };
}

function aggregate(sessions){
  if(!sessions || sessions.length===0) return { totalSessions:0, totalEca:0, totalCalories:0, totalMinutes:0 };
  const totalSessions = sessions.length;
  const totalEca = sessions.reduce((s,x)=>s + (Number(x.eca)||0), 0);
  const totalCalories = Math.round(sessions.reduce((s,x)=>s + (Number(x.calories)||0), 0) * 100) / 100;
  const totalMinutes = sessions.reduce((s,x)=>s + (Number(x.minutes)||0), 0);
  return { totalSessions, totalEca, totalCalories, totalMinutes };
}

function downloadCSV(rows, filename="export.csv"){
  if(!rows || rows.length===0) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(",")].concat(rows.map(r=>keys.map(k=>`"${String(r[k] ?? "")}"`).join(","))).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

function getInitials(name){
  if(!name) return "FF";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if(parts.length === 0) return "FF";
  if(parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ---------------- React component ---------------- */
export default function Progress(){
  const today = new Date();
  const storedStateRef = useRef(readProgressState());
  const storedState = storedStateRef.current;
  const initialYear = clampYear(storedState?.viewYear) ?? today.getFullYear();
  const initialMonth = clampMonth(storedState?.viewMonth) ?? today.getMonth();
  const initialSelectedDate = typeof storedState?.selectedDate === "string"
    ? storedState.selectedDate
    : isoDate(today.getFullYear(), today.getMonth(), today.getDate());
  const initialRangeMode = (storedState?.rangeMode === "week" || storedState?.rangeMode === "year")
    ? storedState.rangeMode
    : "month";
  const initialView = storedState?.view === "chart" ? "chart" : "calendar";

  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);

  const { user, loading: authLoading } = useAuth();
  const [monthSessionsRaw, setMonthSessionsRaw] = useState([]);
  const [sessionsForDate, setSessionsForDate] = useState([]);
  const [yearSessionsRaw, setYearSessionsRaw] = useState([]);

  const PAGE_SIZE = 4;
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const sentinelRef = useRef(null);
  const didInitRef = useRef(false);

  const [loadingDate, setLoadingDate] = useState(false);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [loadingYear, setLoadingYear] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const [initLoaded, setInitLoaded] = useState(false);
  const MIN_LOADING_MS = 800;

  const monthCells = useMemo(()=> {
    const blanks = dayOfWeek(viewYear, viewMonth, 1);
    const days = daysInMonth(viewYear, viewMonth);
    const arr = Array.from({length: blanks}).map(()=>null).concat(Array.from({length: days}, (_,i)=>i+1));
    return arr;
  }, [viewMonth, viewYear]);

  const daysWithSessions = useMemo(() => {
    const set = new Set();
    monthSessionsRaw.forEach(r => {
      if(r.created_at) set.add(dateOnlyISO(r.created_at));
    });
    return set;
  }, [monthSessionsRaw]);

  const summary = useMemo(()=> aggregate(sessionsForDate), [sessionsForDate]);

  const [rangeMode, setRangeMode] = useState(initialRangeMode); // week|month|year
  const [view, setView] = useState(initialView); // calendar | chart
  const chartData = useMemo(()=> {
    const anchor = new Date(selectedDate);
    const points = [];

    if(rangeMode === "week"){
      const weekLabels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      const dayOfWeek = anchor.getDay(); // 0=Sun
      const weekStart = new Date(anchor); weekStart.setDate(anchor.getDate() - dayOfWeek);
      for(let i=0;i<7;i++){
        const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
        const iso = dateOnlyISO(d);
        const mapped = sessionsFromRawForDate(monthSessionsRaw, iso).map(mapDbRowToSession);
        const a = aggregate(mapped);
        points.push({ label: weekLabels[i], ...a });
      }
    } else if(rangeMode === "month"){
      const year = viewYear;
      const month = viewMonth;
      const days = daysInMonth(year, month);
      for (let d = 1; d <= days; d++) {
        const iso = isoDate(year, month, d);
        const mapped = sessionsFromRawForDate(monthSessionsRaw, iso).map(mapDbRowToSession);
        const a = aggregate(mapped);
        points.push({ label: String(d), ...a });
      }
    } else {
      const year = viewYear;
      for(let mi=0; mi<12; mi++){
        const days = daysInMonth(year, mi);
        let agg = { totalMinutes:0, totalCalories:0, totalSessions:0, totalEca:0 };
        for(let d=1; d<=days; d++){
          const iso = isoDate(year, mi, d);
          const mapped = sessionsFromRawForDate(yearSessionsRaw, iso).map(mapDbRowToSession);
          const a = aggregate(mapped);
          agg.totalMinutes += a.totalMinutes; agg.totalCalories += a.totalCalories; agg.totalSessions += a.totalSessions; agg.totalEca += a.totalEca;
        }
        points.push({ label: monthNames[mi].slice(0,3), ...agg });
      }
    }
    return points;
  }, [rangeMode, selectedDate, monthSessionsRaw, yearSessionsRaw, viewYear, viewMonth]);

  const chartTotals = useMemo(() => {
    const totalMinutes = chartData.reduce((s, x) => s + (x.totalMinutes || 0), 0);
    const totalCalories = Math.round(chartData.reduce((s, x) => s + (x.totalCalories || 0), 0) * 100) / 100;
    const totalSessions = chartData.reduce((s, x) => s + (x.totalSessions || 0), 0);
    const totalEca = chartData.reduce((s, x) => s + (x.totalEca || 0), 0);
    return { totalMinutes, totalCalories, totalSessions, totalEca };
  }, [chartData]);

  function sessionsFromRawForDate(rawRows, isoDateStr){
    if(!rawRows || rawRows.length===0) return [];
    return rawRows.filter(r => dateOnlyISO(r.created_at) === isoDateStr);
  }

  const isAuthError = (err) => {
    const msg = String(err?.message || err || "").toLowerCase();
    return msg.includes("jwt") || msg.includes("token") || msg.includes("expired");
  };

  const minDelay = async (startMs) => {
    const elapsed = Date.now() - startMs;
    const remain = Math.max(0, MIN_LOADING_MS - elapsed);
    if (remain > 0) await new Promise((r) => setTimeout(r, remain));
  };

  const forceRefresh = () => setRefreshTick((t) => t + 1);

  useEffect(() => {
    try {
      sessionStorage.setItem(PROGRESS_STATE_KEY, JSON.stringify({
        viewYear,
        viewMonth,
        selectedDate,
        rangeMode,
        view,
      }));
    } catch (e) {}
  }, [viewYear, viewMonth, selectedDate, rangeMode, view]);

  useEffect(() => {
    const onFocus = () => forceRefresh();
    const onVisible = () => { if (document.visibilityState === "visible") forceRefresh(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  /* ---------------- init to latest session date ---------------- */
  useEffect(() => {
    if (authLoading || !user || didInitRef.current) return;
    if (storedStateRef.current) {
      didInitRef.current = true;
      return;
    }
    let mounted = true;

    const fetchLatest = async () => {
      return await supabase
        .from("workout_sessions")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
    };

    (async () => {
      try {
        let { data, error } = await fetchLatest();
        if (error && isAuthError(error)) {
          await supabase.auth.refreshSession();
          ({ data, error } = await fetchLatest());
        }

        if (!error && data && data.length) {
          const dt = new Date(data[0].created_at);
          if (mounted) {
            setViewYear(dt.getFullYear());
            setViewMonth(dt.getMonth());
            setSelectedDate(isoDate(dt.getFullYear(), dt.getMonth(), dt.getDate()));
          }
        }
      } catch (err) {
        console.warn("latest session fetch failed:", err);
      } finally {
        didInitRef.current = true;
      }
    })();

    return () => { mounted = false; };
  }, [user, authLoading, refreshTick]);

  /* ---------------- fetch month sessions ---------------- */
  useEffect(() => {
    if (authLoading) return;
    if(!user){
      setMonthSessionsRaw([]);
      setLoadingMonth(false);
      return;
    }
    let mounted = true;
    (async () => {
      const startMs = Date.now();
      try {
        setLoadingMonth(true);
        setLoadError("");
        const start = new Date(viewYear, viewMonth, 1, 0, 0, 0, 0);
        const end = new Date(viewYear, viewMonth, daysInMonth(viewYear, viewMonth), 23, 59, 59, 999);
        const runQuery = async () => await supabase
          .from("workout_sessions")
          .select("id, user_id, workout_name, reps, time_seconds, weight_kg, accuracy, eca_points, created_at")
          .eq("user_id", user.id)
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString())
          .order("created_at", { ascending: true });

        let { data, error } = await runQuery();
        if (error && isAuthError(error)) {
          await supabase.auth.refreshSession();
          ({ data, error } = await runQuery());
        }

        if(error){
          console.error("month fetch error:", error);
          setLoadError("Could not load month sessions. Please refresh.");
          if(mounted) setMonthSessionsRaw([]);
        } else {
          if(mounted) setMonthSessionsRaw(data || []);
        }
      } catch (err) {
        console.error("month fetch threw:", err);
        setLoadError("Could not load month sessions. Please refresh.");
        if(mounted) setMonthSessionsRaw([]);
      } finally {
        await minDelay(startMs);
        if (mounted) {
          setLoadingMonth(false);
          setInitLoaded(true);
        }
      }
    })();
    return () => { mounted = false; };
  }, [user, authLoading, viewMonth, viewYear, refreshTick]);

  /* ---------------- fetch year sessions (for year chart) ---------------- */
  useEffect(() => {
    if (authLoading) return;
    if(!user){
      setYearSessionsRaw([]);
      setLoadingYear(false);
      return;
    }
    if (rangeMode !== "year") {
      setLoadingYear(false);
      return;
    }
    let mounted = true;
    (async () => {
      const startMs = Date.now();
      try {
        setLoadingYear(true);
        const start = new Date(viewYear, 0, 1, 0, 0, 0, 0);
        const end = new Date(viewYear, 11, 31, 23, 59, 59, 999);
        const runQuery = async () => await supabase
          .from("workout_sessions")
          .select("id, user_id, workout_name, reps, time_seconds, weight_kg, accuracy, eca_points, created_at")
          .eq("user_id", user.id)
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString())
          .order("created_at", { ascending: true });

        let { data, error } = await runQuery();
        if (error && isAuthError(error)) {
          await supabase.auth.refreshSession();
          ({ data, error } = await runQuery());
        }

        if(error){
          console.error("year fetch error:", error);
          setLoadError("Could not load year sessions. Please refresh.");
          if(mounted) setYearSessionsRaw([]);
        } else {
          if(mounted) setYearSessionsRaw(data || []);
        }
      } catch (err) {
        console.error("year fetch threw:", err);
        setLoadError("Could not load year sessions. Please refresh.");
        if(mounted) setYearSessionsRaw([]);
      } finally {
        await minDelay(startMs);
        if (mounted) setLoadingYear(false);
      }
    })();
    return () => { mounted = false; };
  }, [user, authLoading, rangeMode, viewYear, refreshTick]);

  /* ---------------- fetch selected date sessions ---------------- */
  useEffect(() => {
    if (authLoading) {
      setSessionsForDate([]);
      setItems([]);
      setLoadingDate(false);
      return;
    }
    if(!user){
      setSessionsForDate([]);
      setItems([]);
      setLoadingDate(false);
      return;
    }
    let mounted = true;
    (async () => {
      const startMs = Date.now();
      try {
        setLoadingDate(true);
        setLoadError("");
        const foundInMonth = monthSessionsRaw && monthSessionsRaw.some(r => dateOnlyISO(r.created_at) === selectedDate);
        if(foundInMonth){
          const rows = monthSessionsRaw.filter(r => dateOnlyISO(r.created_at) === selectedDate);
          const mapped = rows.map(mapDbRowToSession).sort((a,b)=>a.time.localeCompare(b.time));
          if(mounted){
            setSessionsForDate(mapped);
            setPage(1);
            setItems(mapped.slice(0, PAGE_SIZE));
          }
          return;
        }

        const start = new Date(selectedDate + "T00:00:00");
        const end = new Date(selectedDate + "T23:59:59.999");
        const runQuery = async () => await supabase
          .from("workout_sessions")
          .select("id, user_id, workout_name, reps, time_seconds, weight_kg, accuracy, eca_points, created_at")
          .eq("user_id", user.id)
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString())
          .order("created_at", { ascending: true });

        let { data, error } = await runQuery();
        if (error && isAuthError(error)) {
          await supabase.auth.refreshSession();
          ({ data, error } = await runQuery());
        }

        if(error){
          console.error("date fetch error:", error);
          setLoadError("Could not load sessions for this date. Please refresh.");
          if(mounted) {
            setSessionsForDate([]);
            setItems([]);
          }
        } else {
          const mapped = (data || []).map(mapDbRowToSession).sort((a,b)=>a.time.localeCompare(b.time));
          if(mounted){
            setSessionsForDate(mapped);
            setPage(1);
            setItems(mapped.slice(0, PAGE_SIZE));
          }
        }
      } catch (err) {
        console.error("date fetch threw:", err);
        setLoadError("Could not load sessions for this date. Please refresh.");
        if(mounted){
          setSessionsForDate([]);
          setItems([]);
        }
      } finally {
        await minDelay(startMs);
        if(mounted) {
          setLoadingDate(false);
          setInitLoaded(true);
        }
      }
    })();
    return () => { mounted = false; };
  }, [user, authLoading, selectedDate, monthSessionsRaw, refreshTick]);

  /* ---------------- pagination observer ---------------- */
  useEffect(()=>{
    const obs = new IntersectionObserver(entries=>{
      entries.forEach(e => { if(e.isIntersecting) setPage(p=>p+1); });
    }, { threshold: 0.1 });
    if(sentinelRef.current) obs.observe(sentinelRef.current);
    return ()=>obs.disconnect();
  }, []);

  useEffect(()=>{
    if(page<=1) return;
    setItems(sessionsForDate.slice(0, Math.min(sessionsForDate.length, page*PAGE_SIZE)));
  }, [page, sessionsForDate]);

  /* ---------------- handlers ---------------- */
  function prevMonth(){ let m=viewMonth-1, y=viewYear; if(m<0){ m=11; y--; } if(y < YEAR_MIN) return; setViewYear(y); setViewMonth(m); }
  function nextMonth(){ let m=viewMonth+1, y=viewYear; if(m>11){ m=0; y++; } if(y > YEAR_MAX) return; setViewYear(y); setViewMonth(m); }
  function pickDate(day){ if(!day) return; setSelectedDate(isoDate(viewYear, viewMonth, day)); }

  function exportSelectedReport(){
    downloadCSV(sessionsForDate.map(s=>({
      date: s.date, time: s.time, workoutName: s.workoutName, reps: s.reps, minutes: s.minutes, calories: s.calories, flexPoints: s.eca
    })), `progress_${selectedDate}.csv`);
  }

  const sessionsCountText = `${sessionsForDate.length} session(s) on this date`;
  const isBusy = authLoading || loadingMonth || loadingDate || (rangeMode === "year" && loadingYear);
  const userName = authLoading
    ? "Loading..."
    : (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.display_name || (user?.email ? user.email.split("@")[0] : "Guest"));
  const userEmail = authLoading ? "Fetching profile..." : (user?.email || "Sign in to personalize");
  const userUsername = authLoading ? "" : (user?.user_metadata?.username || "Username not set");
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const userInitials = getInitials(userName);

  return (
    <div className="progress-wrap container small-calendar">
      <div className="page-header">
        <div>
          <h1 className="title">MY Progress</h1>
          <p className="subtitle">Compact calendar, quick stats and chart. Click a date to see sessions.</p>
        </div>
        <div className="top-actions">
          <div className="view-toggle">
            <button className={view==="calendar"?"chip active":"chip"} onClick={()=>setView("calendar")}>Calendar</button>
            <button className={view==="chart"?"chip active":"chip"} onClick={()=>setView("chart")}>Activity Chart</button>
          </div>
        </div>
      </div>

      <div className="progress-user card">
        <div className="progress-user-avatar" aria-hidden="true">
          {userAvatar ? (
            <img src={userAvatar} alt="" />
          ) : (
            <span>{userInitials}</span>
          )}
        </div>
        <div className="progress-user-meta">
          <div className="progress-user-name">{userName}</div>
          <div className="progress-user-email">{userEmail}</div>
          {userUsername && <div className="progress-user-username">{userUsername}</div>}
        </div>
        <div className="progress-user-tag">Your Progress</div>
      </div>

      {view === "calendar" && (
      <div className="content-grid">
        {/* LEFT: calendar + stats grid + report stacked */}
        <aside className="left-col">
          <div className="mini-calendar card">
            <div className="cal-head">
              <button className="icon-btn" onClick={prevMonth} aria-label="prev">&lt;</button>
              <div className="month-select">
                <select value={viewMonth} onChange={e=>setViewMonth(Number(e.target.value))}>
                  {monthNames.map((m, i)=> <option key={i} value={i}>{m}</option>)}
                </select>
                <select value={viewYear} onChange={e=>setViewYear(Number(e.target.value))}>
                  {Array.from({length: YEAR_MAX - YEAR_MIN + 1}).map((_,i)=> {
                    const y = YEAR_MIN + i; return <option key={y} value={y}>{y}</option>;
                  })}
                </select>
              </div>
              <button className="icon-btn" onClick={nextMonth} aria-label="next">&gt;</button>
            </div>

            <div className="weekdays">
              <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
            </div>

            <div className="days-grid">
              {monthCells.map((d, idx)=> {
                if(d === null) return <div key={idx} className="day blank" />;
                const iso = isoDate(viewYear, viewMonth, d);
                const has = daysWithSessions.has(iso);
                const isSel = iso === selectedDate;
                return (
                  <button key={iso}
                    className={`day ${has? "has": "no"} ${isSel? "sel": ""}`}
                    onClick={()=>{ pickDate(d); }}
                    title={`${iso}${has ? " - sessions available" : ""}`}>
                    <div className="num">{d}</div>
                    {has && <div className="dot" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===== stats rows under calendar ===== */}
          <div className="summary-row">
            <div className="stat-card">
              <div className="label">Total Sessions</div>
              <div className="val">{summary.totalSessions}</div>
            </div>
            <div className="stat-card">
              <div className="label">Flex Points</div>
              <div className="val">{formatFlex(summary.totalEca)}</div>
            </div>
          </div>

          <div className="summary-row-2">
            <div className="stat-card">
              <div className="label">Calories</div>
              <div className="val">{formatCalories(summary.totalCalories)}</div>
            </div>
            <div className="stat-card">
              <div className="label">Time Spent</div>
              <div className="val">{formatMinutes(summary.totalMinutes)}</div>
            </div>
          </div>

          {/* report stays under stats */}
          <div className="report card">
            <div className="report-head">
              <div>
                <h3>Sessions - {selectedDate}</h3>
                <div className="muted">{isBusy ? "Loading..." : sessionsCountText}</div>
              </div>
              <div className="report-actions">
                <button className="btn" onClick={exportSelectedReport}>Export Report</button>
                <button className="btn ghost" onClick={()=>{ setSelectedDate(isoDate(today.getFullYear(), today.getMonth(), today.getDate())); setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); }}>Today</button>
              </div>
            </div>

            <div className="report-list" id="report-list">
              {loadError && !isBusy && (
                <div className="empty">
                  {loadError}
                  <button className="btn ghost" onClick={forceRefresh} style={{ marginTop: 10 }}>Retry</button>
                </div>
              )}
              {!loadError && items.length === 0 ? (
                <div className="empty">{(isBusy || !initLoaded) ? "Loading sessions..." : "No sessions on this date - start your first AI workout!"}</div>
              ) : items.map(s => (
                <div className="session" key={s.id}>
                  <div className="s-left">
                    <div className="s-title">{s.workoutName}</div>
                    <div className="s-meta">
                      <span>{s.time}</span>
                      <span>{formatMinutes(s.minutes)}</span>
                      <span>{formatCalories(s.calories)}</span>
                    </div>
                  </div>
                  <div className="s-right">
                    <div className="s-row"><span className="k">Reps</span><span className="v">{s.reps}</span></div>
                    <div className="s-row"><span className="k">Flex Points</span><span className="v">{formatFlex(s.eca)}</span></div>
                  </div>
                </div>
              ))}
              <div ref={sentinelRef} className="sentinel" />
            </div>
          </div>
        </aside>
      </div>
      )}

      {view === "chart" && (
      <div className="content-grid chart-only">
        <main className="right-col">
          <div className="chart-card card">
            <div className="chart-head">
              <div>
                <div className="chart-title">Activity Overview</div>
                <div className="muted">Mode: {rangeMode}</div>
              </div>
              <div className="chart-controls">
                <div className="legend time"><span className="dot small" /> time</div>
                <div className="legend calories"><span className="dot small" /> calories</div>
                <div className="legend flex"><span className="dot small" /> flex points</div>
              </div>
            </div>

            <div className="chart-area">
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="bar-svg">
                {(() => {
                  const plot = { x: 12, y: 3, w: 86, h: 30 };
                  const maxVal = Math.max(
                    ...chartData.map((p) =>
                      Math.max(p.totalMinutes || 0, p.totalCalories || 0, p.totalEca || 0)
                    ),
                    1
                  );
                  const tickCount = 4;
                  const ticks = Array.from({ length: tickCount + 1 }, (_, i) =>
                    Math.round((maxVal * i) / tickCount)
                  );
                  const groupW = plot.w / Math.max(1, chartData.length);
                  const innerGap = Math.min(0.4, groupW * 0.12);
                  const barW = Math.max(0.35, (groupW - innerGap * 2) / 3);

                  return (
                    <>
                      <line
                        className="axis-line"
                        x1={plot.x}
                        y1={plot.y}
                        x2={plot.x}
                        y2={plot.y + plot.h}
                      />
                      <line
                        className="axis-line"
                        x1={plot.x}
                        y1={plot.y + plot.h}
                        x2={plot.x + plot.w}
                        y2={plot.y + plot.h}
                      />
                      {ticks.map((val, idx) => {
                        const ratio = maxVal ? val / maxVal : 0;
                        const y = plot.y + plot.h - plot.h * ratio;
                        return (
                          <g key={`tick-${idx}`}>
                            <line
                              className="axis-grid"
                              x1={plot.x}
                              y1={y}
                              x2={plot.x + plot.w}
                              y2={y}
                            />
                            <text className="axis-text" x={plot.x - 1.2} y={y + 1}>
                              {val}
                            </text>
                          </g>
                        );
                      })}

                      {chartData.map((p, i) => {
                        const baseX = plot.x + i * groupW;
                        const values = [
                          { key: "time", val: p.totalMinutes || 0 },
                          { key: "calories", val: p.totalCalories || 0 },
                          { key: "flex", val: p.totalEca || 0 },
                        ];
                        return (
                          <g key={`group-${i}`}>
                            {values.map((v, j) => {
                              const h = maxVal ? (v.val / maxVal) * plot.h : 0;
                              const x = baseX + j * (barW + innerGap);
                              const y = plot.y + plot.h - h;
                              return (
                                <rect
                                  key={`${i}-${v.key}`}
                                  x={x}
                                  y={y}
                                  width={barW}
                                  height={h}
                                  rx="0.6"
                                  className={`bar bar-${v.key}`}
                                />
                              );
                            })}
                            <text
                              x={baseX + groupW / 2}
                              y={plot.y + plot.h + 4}
                              className="bar-label"
                            >
                              {p.label}
                            </text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>

            <div className="chart-range">
              <div className="range-toggle">
                <button className={rangeMode==="week"?"chip active":"chip"} onClick={()=>setRangeMode("week")}>WEEK</button>
                <button className={rangeMode==="month"?"chip active":"chip"} onClick={()=>setRangeMode("month")}>MONTH</button>
                <button className={rangeMode==="year"?"chip active":"chip"} onClick={()=>setRangeMode("year")}>YEAR</button>
              </div>
            </div>

            <div className="table-nums">
              <div className="num-row"><div className="nlabel">Total Time</div><div className="nval">{formatMinutes(chartTotals.totalMinutes)}</div></div>
              <div className="num-row"><div className="nlabel">Calories</div><div className="nval">{formatCalories(chartTotals.totalCalories)}</div></div>
              <div className="num-row"><div className="nlabel">Sessions</div><div className="nval">{chartTotals.totalSessions}</div></div>
              <div className="num-row"><div className="nlabel">Flex Points</div><div className="nval">{formatFlex(chartTotals.totalEca)}</div></div>
            </div>
          </div>
        </main>
      </div>
      )}

      <div className="note muted">Live mode - data pulled from Supabase `workout_sessions` table. Calories computed using MET mapping on client.</div>
    </div>
  );
}
