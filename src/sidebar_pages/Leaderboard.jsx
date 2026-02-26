import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import "./leaderboard.css";

const getWeekRange = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay()); // Sunday
  const end = new Date(start);
  end.setDate(start.getDate() + 7); // next Sunday
  return { start, end };
};

const toDateKey = (dt) => {
  const d = new Date(dt);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

function Leaderboard() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const { start, end } = getWeekRange();
      const { data, error } = await supabase
        .from("workout_sessions")
        .select("user_id, eca_points, created_at")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());

      if (error) {
        console.error("Leaderboard fetch error:", error);
        setEntries([]);
      } else if (data) {
        const byUser = new Map();
        (data || []).forEach((row) => {
          if (!row?.user_id) return;
          const entry = byUser.get(row.user_id) || { total: 0, days: new Set() };
          entry.total += Number(row.eca_points) || 0;
          if (row.created_at) entry.days.add(toDateKey(row.created_at));
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

        const ranked = userIds
          .map((userId) => {
            const info = byUser.get(userId);
            const activeDays = info?.days?.size || 0;
            const avg = activeDays ? info.total / activeDays : 0;
            const profile = profileMap[userId];
            const name =
              profile?.full_name ||
              profile?.username ||
              profile?.email ||
              "User";
            return { userId, name, score: Math.round(avg * 100) / 100, activeDays };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 20)
          .map((row, idx) => ({
            rank: idx + 1,
            name: row.name || `User ${idx + 1}`,
            score: row.score,
            meta: { user_id: row.userId, active_days: row.activeDays },
          }));

        setEntries(ranked);
      }
    } catch (err) {
      console.error("Leaderboard fetch threw:", err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // initial load
    fetchLeaderboard();
    // you may want to poll or refresh on an interval; for now just initial load
  }, [fetchLeaderboard]);

  const handleRefresh = async () => {
    await fetchLeaderboard();
  };

  return (
    <div className="leaderboard-page container">
      <div className="leaderboard-header">
        <div>
          <h1 className="leaderboard-title">Flex Rankings</h1>
          <p className="leaderboard-sub">Top performers by average Flex Points per active day (Sun–Sat).</p>
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
            <div className="cached-title">No user performed any work</div>
            <div className="cached-sub">Once users finish workouts, rankings will appear here.</div>
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
            <div className="leaderboard-score">{e.score} Flex Points</div>
          </div>
        ))}
      </div>

      <div className="leaderboard-note">
        Leaderboard: computed from workout sessions for the current week (Sunday–Saturday), ranked by average flex points per active day.
      </div>
    </div>
  );
}

export default Leaderboard;
