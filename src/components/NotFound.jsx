import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="not-found-page container">
      <div className="ff-card">
        <h1>Page not found</h1>
        <p className="small-muted">
          The page you are looking for does not exist. Check the URL or return to a safe page.
        </p>
        <div className="not-found-actions">
          <Link className="btn" to="/">Go home</Link>
          <Link className="btn-ghost" to="/workouts">Workout Library</Link>
        </div>
      </div>
    </div>
  );
}
