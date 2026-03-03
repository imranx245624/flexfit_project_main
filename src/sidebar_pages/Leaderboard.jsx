import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import "./leaderboard.css";

const CACHE_KEY = "ff-leaderboard-cache";
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

const getWeekRange = (baseDate = new Date()) => {
  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay()); // Sunday
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Saturday
  return { start, end };
};

const toDateKey = (dt) => {
  const d = new Date(dt);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const toIsoDate = (dt) => {
  const d = new Date(dt);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || !parsed?.entries) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed;
  } catch (e) {
    return null;
  }
};

const writeCache = (payload) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...payload, ts: Date.now() }));
  } catch (e) {}
};

const fetchProfilesFromServer = async (ids) => {
  if (!ids?.length) return {};
  try {
    const res = await fetch("/api/public-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn("public-profiles fetch failed:", res.status, text.slice(0, 160));
      return {};
    }
    const payload = await res.json();
    const list = payload?.data || payload?.profiles || [];
    const map = {};
    (list || []).forEach((p) => {
      if (p?.id) map[p.id] = p;
    });
    return map;
  } catch (err) {
    console.warn("public-profiles fetch error:", err);
    return {};
  }
};

function Leaderboard() {
  const cached = readCache();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [entries, setEntries] = useState([]);
  const [rangeInfo, setRangeInfo] = useState({ label: "This week", start: null, end: null });

  const formatRange = (start, end) => {
    if (!start || !end) return "";
    const options = { month: "short", day: "numeric", year: "numeric" };
    const startText = start.toLocaleDateString("en-US", options);
    const endText = end.toLocaleDateString("en-US", options);
    return `${startText} to ${endText}`;
  };

  const fetchLeaderboard = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const queryRange = async (range) => {
        const { data: fastData, error: fastErr } = await supabase
          .from("daily_aggregates")
          .select("user_id, avg_eca.sum(), day.count()")
          .gte("day", toIsoDate(range.start))
          .lte("day", toIsoDate(range.end));

        if (!fastErr && Array.isArray(fastData)) {
          const rows = (fastData || []).map((row) => ({
            user_id: row.user_id,
            total: Number(row.avg_eca_sum || 0),
            daysCount: Number(row.day_count || 0),
            _aggregated: true,
          }));
          return { rows, aggregated: true };
        }

        if (fastErr) {
          console.warn("Leaderboard aggregate query failed, falling back:", fastErr);
        }

        const { data, error } = await supabase
          .from("daily_aggregates")
          .select("user_id, day, avg_eca")
          .gte("day", toIsoDate(range.start))
          .lte("day", toIsoDate(range.end));
        if (error) throw error;
        return { rows: data || [], aggregated: false };
      };

      const currentRange = getWeekRange();
      let rangeUsed = { ...currentRange, label: "This week" };
      let { rows, aggregated } = await queryRange(currentRange);

      if (!rows.length) {
        const prevBase = new Date(currentRange.start);
        prevBase.setDate(prevBase.getDate() - 7);
        const prevRange = getWeekRange(prevBase);
        const prevResult = await queryRange(prevRange);
        if (prevResult.rows.length) {
          rows = prevResult.rows;
          aggregated = prevResult.aggregated;
          rangeUsed = { ...prevRange, label: "Last week" };
        }
      }

      setRangeInfo(rangeUsed);

      if (!rows.length) {
        setEntries([]);
        return;
      }

      const byUser = new Map();
      if (aggregated) {
        rows.forEach((row) => {
          if (!row?.user_id) return;
          byUser.set(row.user_id, {
            total: Number(row.total) || 0,
            daysCount: Number(row.daysCount) || 0,
          });
        });
      } else {
        rows.forEach((row) => {
          if (!row?.user_id) return;
          const entry = byUser.get(row.user_id) || { total: 0, days: new Set() };
          entry.total += Number(row.avg_eca) || 0;
          if (row.day) entry.days.add(toDateKey(row.day));
          byUser.set(row.user_id, entry);
        });
      }

      const userIds = Array.from(byUser.keys());
      const profileMap = {};
      const usernameMap = {};
      if (userIds.length > 0) {
        const [profilesRes, usernamesRes] = await Promise.all([
          supabase.from("profiles").select("id, full_name, username, email").in("id", userIds),
          supabase.from("usernames").select("user_id, username").in("user_id", userIds),
        ]);

        if (profilesRes.error) {
          console.warn("Leaderboard profile fetch error:", profilesRes.error);
        } else {
          (profilesRes.data || []).forEach((p) => {
            profileMap[p.id] = p;
          });
        }

        if (usernamesRes.error) {
          console.warn("Leaderboard username fetch error:", usernamesRes.error);
        } else {
          (usernamesRes.data || []).forEach((u) => {
            usernameMap[u.user_id] = u;
          });
        }
      }

      const missingProfileIds = userIds.filter((id) => !profileMap[id]);
      if (missingProfileIds.length > 0) {
        const serverProfiles = await fetchProfilesFromServer(missingProfileIds);
        Object.assign(profileMap, serverProfiles);
        if (Object.keys(serverProfiles).length === 0) {
          console.warn(
            "Leaderboard: profiles missing. Check profiles RLS or configure /api/public-profiles."
          );
        }
      }

      const ranked = userIds
        .map((userId) => {
          const info = byUser.get(userId);
          const activeDays = aggregated ? (info?.daysCount || 0) : (info?.days?.size || 0);
          const total = Number(info?.total || 0);
          const profile = profileMap[userId];
          const usernameFallback = usernameMap[userId]?.username;
          const fullName = normalizeText(profile?.full_name);
          const userName = normalizeText(profile?.username);
          const fallbackName = normalizeText(usernameFallback);
          const name = fullName || userName || fallbackName || "User";
          return { userId, name, score: Math.round(total * 100) / 100, activeDays };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((row, idx) => ({
          rank: idx + 1,
          name: row.name || `User ${idx + 1}`,
          score: row.score,
          meta: { user_id: row.userId, active_days: row.activeDays },
        }));

      setEntries(ranked);
      writeCache({ entries: ranked, rangeInfo: rangeUsed });
    } catch (err) {
      console.error("Leaderboard fetch threw:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // initial load only; further updates are manual via Refresh button
    if (cached?.entries?.length) {
      setEntries(cached.entries);
      if (cached.rangeInfo) setRangeInfo(cached.rangeInfo);
      setLoading(false);
      fetchLeaderboard({ silent: true });
      return;
    }
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleRefresh = async () => {
    await fetchLeaderboard({ silent: true });
  };

  const rangeText = formatRange(rangeInfo.start, rangeInfo.end);
  const isBusy = loading || refreshing;
  const buttonLabel = loading ? "Loading..." : (refreshing ? "Refreshing..." : "Refresh");

  return (
    <div className="leaderboard-page container">
      <div className="leaderboard-header">
        <div>
          <h1 className="leaderboard-title">Flex Rankings</h1>
          <p className="leaderboard-sub">Top 10 performers by summed Avg ECA (Sun-Sat).</p>
          {rangeText && (
            <p className="leaderboard-range">Showing: {rangeInfo.label} ({rangeText}).</p>
          )}
        </div>
        <button
          className="btn-ghost"
          onClick={handleRefresh}
          aria-label="Refresh leaderboard"
          disabled={isBusy}
        >
          {buttonLabel}
        </button>
      </div>

      <div className="leaderboard-list">
        {loading && !entries?.length && (
          <div className="ff-card cached-card">
            <div className="cached-title">Loading leaderboard...</div>
            <div className="cached-sub">Fetching latest rankings.</div>
          </div>
        )}

        {!loading && (!entries || entries.length === 0) && (
          <div className="ff-card cached-card">
            <div className="cached-title">No weekly data yet</div>
            <div className="cached-sub">No Avg ECA entries found for the current or last week.</div>
          </div>
        )}

        {!loading && entries?.length > 0 && entries.map((e) => (
          <div key={e.rank} className="leaderboard-row ff-card">
            <div className="leaderboard-rank">#{e.rank}</div>
            <div className="leaderboard-user">
              <div className="avatar small" aria-hidden="true">{e.name?.[0] ?? "?"}</div>
              <div>
                <div className="leaderboard-name">{e.name}</div>
                <div className="leaderboard-sparkline" aria-hidden="true" />
              </div>
            </div>
            <div className="leaderboard-score">{e.score} Avg ECA</div>
          </div>
        ))}
      </div>

      {/* <div className="leaderboard-note">
        Leaderboard: weekly score = sum of daily Avg ECA (Sunday-Saturday). {rangeText ? `Showing: ${rangeInfo.label} (${rangeText}). ` : ""}Use Refresh to fetch latest data.
      </div> */}
    </div>
  );
}

export default Leaderboard;
