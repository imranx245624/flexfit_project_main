import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import "./leaderboard.css";

const DEFAULT_LEADERBOARD = [
  { rank: 1, name: "Athena", score: 1840 },
  { rank: 2, name: "Nova", score: 1715 },
  { rank: 3, name: "Orion", score: 1640 },
  { rank: 4, name: "Rhea", score: 1500 },
  { rank: 5, name: "Atlas", score: 1400 },
  { rank: 6, name: "Lyra", score: 1320 },
  { rank: 7, name: "Vega", score: 1265 },
  { rank: 8, name: "Sol", score: 1190 },
];

function Leaderboard() {
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const cachedSnapshot = DEFAULT_LEADERBOARD;

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      // read from the view we created
      const { data, error } = await supabase
        .from("leaderboard_avg_30")
        .select("user_id, name, avg_eca_per_day, active_days")
        .order("avg_eca_per_day", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Leaderboard fetch error:", error);
        setEntries([]);
      } else if (data) {
        // map to UI shape: rank & score
        const mapped = (data || []).map((row, idx) => ({
          rank: idx + 1,
          name: row.name || `User ${idx + 1}`,
          score: Math.round(Number(row.avg_eca_per_day) * 100) / 100, // show 2dp
          meta: { user_id: row.user_id, active_days: row.active_days }
        }));
        setEntries(mapped);
      }
    } catch (err) {
      console.error("Leaderboard fetch threw:", err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load
    fetchLeaderboard();
    // you may want to poll or refresh on an interval; for now just initial load
  }, []);

  const handleRefresh = async () => {
    await fetchLeaderboard();
  };

  return (
    <div className="leaderboard-page container">
      <div className="leaderboard-header">
        <div>
          <h1 className="leaderboard-title">Flex Rankings</h1>
          <p className="leaderboard-sub">Top performers by average ECA points per day.</p>
        </div>
        <button className="btn-ghost" onClick={handleRefresh} aria-label="Refresh leaderboard">
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading && (
        <div className="leaderboard-loading" role="status">Loading leaderboard…</div>
      )}

      {!entries?.length && !loading && (
        <div className="ff-card cached-card">
          <div className="cached-title">Cached snapshot</div>
          <div className="cached-sub">Leaderboard will update when live data is available.</div>
        </div>
      )}

      <div className="leaderboard-list">
        {(entries?.length ? entries : cachedSnapshot).map((e) => (
          <div key={e.rank} className="leaderboard-row ff-card">
            <div className="leaderboard-rank">#{e.rank}</div>
            <div className="leaderboard-user">
              <div className="avatar small" aria-hidden="true">{e.name?.[0] ?? "?"}</div>
              <div>
                <div className="leaderboard-name">{e.name}</div>
                <div className="leaderboard-sparkline" aria-hidden="true" />
              </div>
            </div>
            <div className="leaderboard-score">{e.score} ECA</div>
          </div>
        ))}
      </div>

      <div className="leaderboard-note">
        Leaderboard: snapshot from DB view (avg ECA per active day over last 30 days). Consider adding a Redis cache if you need sub-second responses at scale.
      </div>
    </div>
  );
}

export default Leaderboard;
