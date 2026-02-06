import React from "react";
import "./leaderboard.css";

const DEFAULT_LEADERBOARD = [
  { rank: 1, name: "Athena", score: 1840 },
  { rank: 2, name: "Nova", score: 1715 },
  { rank: 3, name: "Rex", score: 1620 },
  { rank: 4, name: "Juno", score: 1495 },
  { rank: 5, name: "Kai", score: 1380 },
];

function Leaderboard() {
  // TODO: Leaderboard: cached via Redis endpoint. Replace placeholders with API data without changing endpoints.
  const entries = DEFAULT_LEADERBOARD;

  const handleRefresh = () => {
    // TODO: Wire to existing leaderboard fetch without changing API calls.
  };

  return (
    <div className="leaderboard-page container">
      <div className="leaderboard-header">
        <div>
          <h1 className="leaderboard-title">Flex Rankings</h1>
          <p className="leaderboard-sub">Top performers by average ECA points per day.</p>
        </div>
        <button className="btn ghost small" onClick={handleRefresh}>Refresh</button>
      </div>

      <div className="leaderboard-list">
        {entries.map((e) => (
          <div key={e.rank} className="leaderboard-row">
            <div className="leaderboard-rank">#{e.rank}</div>
            <div className="leaderboard-name">{e.name}</div>
            <div className="leaderboard-score">{e.score} ECA</div>
          </div>
        ))}
      </div>

      <div className="leaderboard-note">
        Leaderboard: cached via Redis. When backend returns data, it replaces placeholders.
      </div>
    </div>
  );
}

export default Leaderboard;
