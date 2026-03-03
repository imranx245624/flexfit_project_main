import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import "./leaderboard.css";

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

function Leaderboard() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [rangeInfo, setRangeInfo] = useState({ label: "This week", start: null, end: null });

  const formatRange = (start, end) => {
    if (!start || !end) return "";
    const options = { month: "short", day: "numeric", year: "numeric" };
    const startText = start.toLocaleDateString("en-US", options);
    const endText = end.toLocaleDateString("en-US", options);
    return `${startText} to ${endText}`;
  };

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const queryRange = async (range) => {
        const { data, error } = await supabase
          .from("daily_aggregates")
          .select("user_id, day, avg_eca")
          .gte("day", toIsoDate(range.start))
          .lte("day", toIsoDate(range.end));
        if (error) throw error;
        return data || [];
      };

      const currentRange = getWeekRange();
      let rangeUsed = { ...currentRange, label: "This week" };
      let rows = await queryRange(currentRange);

      if (!rows.length) {
        const prevBase = new Date(currentRange.start);
        prevBase.setDate(prevBase.getDate() - 7);
        const prevRange = getWeekRange(prevBase);
        const prevRows = await queryRange(prevRange);
        if (prevRows.length) {
          rows = prevRows;
          rangeUsed = { ...prevRange, label: "Last week" };
        }
      }

      setRangeInfo(rangeUsed);

      if (!rows.length) {
        setEntries([]);
        return;
      }

      const byUser = new Map();
      rows.forEach((row) => {
        if (!row?.user_id) return;
        const entry = byUser.get(row.user_id) || { total: 0, days: new Set() };
        entry.total += Number(row.avg_eca) || 0;
        if (row.day) entry.days.add(toDateKey(row.day));
        byUser.set(row.user_id, entry);
      });

      const userIds = Array.from(byUser.keys());
      const profileMap = {};
      if (userIds.length > 0) {
        const { data: profiles, error: profileErr } = await supabase
          .from("profiles")
          .select("id, full_name, username, email")
          .in("id", userIds);

        if (profileErr) {
          console.warn("Leaderboard profile fetch error:", profileErr);
        } else {
          (profiles || []).forEach((p) => {
            profileMap[p.id] = p;
          });
        }
      }
      const usernameMap = {};
      if (userIds.length > 0) {
        const { data: usernames, error: usernameErr } = await supabase
          .from("usernames")
          .select("user_id, username")
          .in("user_id", userIds);

        if (usernameErr) {
          console.warn("Leaderboard username fetch error:", usernameErr);
        } else {
          (usernames || []).forEach((u) => {
            usernameMap[u.user_id] = u;
          });
        }
      }

      const ranked = userIds
        .map((userId) => {
          const info = byUser.get(userId);
          const activeDays = info?.days?.size || 0;
          const total = Number(info?.total || 0);
          const profile = profileMap[userId];
            const usernameFallback = usernameMap[userId]?.username;
            const name =
              profile?.full_name ||
              profile?.username ||
              usernameFallback ||
              "User";
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
    } catch (err) {
      console.error("Leaderboard fetch threw:", err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // initial load only; further updates are manual via Refresh button
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleRefresh = async () => {
    await fetchLeaderboard();
  };

  const rangeText = formatRange(rangeInfo.start, rangeInfo.end);

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
        <button className="btn-ghost" onClick={handleRefresh} aria-label="Refresh leaderboard">
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="leaderboard-list">
        {loading && (
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

      <div className="leaderboard-note">
        Leaderboard: weekly score = sum of daily Avg ECA (Sunday-Saturday). {rangeText ? `Showing: ${rangeInfo.label} (${rangeText}). ` : ""}Use Refresh to fetch latest data.
      </div>
    </div>
  );
}

export default Leaderboard;
