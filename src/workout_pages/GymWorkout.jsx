import PageWrapper from "./pageWrapper.jsx";
import React from "react";
import { useNavigate } from "react-router-dom";
import "./workout.css";
import { GYM_GROUPS, toSlug } from "../data/exerciseCatalog";

export default function GWorkout() {
  const navigate = useNavigate();
  const goDetail = (name) => navigate(`/exercise/${toSlug(name)}`);

  const ExerciseGrid = ({ items }) => (
    <div className="workout-exercise-grid">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          className="workout-exercise-card"
          onClick={() => goDetail(item)}
        >
          <span className="workout-exercise-name">{item}</span>
          <span className="workout-exercise-cta">View Details</span>
        </button>
      ))}
    </div>
  );

  const GroupSection = ({ title, items }) => (
    <div className="workout-group-section">
      <div className="workout-group-subtitle">{title}</div>
      <ExerciseGrid items={items} />
    </div>
  );

  return (
    <PageWrapper>
      <div className="main-workout-title">Gym Workout</div>

      <div className="workout-groups">
        {GYM_GROUPS.map((group) => (
          <section key={group.title} className="workout-group-card">
            <div className="workout-group-header">
              <h2>{group.title}</h2>
            </div>
            <div className="workout-group-body">
              {group.sections.map((section) => (
                <GroupSection key={section.title} title={section.title} items={section.items} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageWrapper>
  );
}
