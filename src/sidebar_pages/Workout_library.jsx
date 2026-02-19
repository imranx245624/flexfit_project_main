import React from "react";
import { useNavigate } from "react-router-dom";
import PageWrapper from "../workout_pages/pageWrapper.jsx";
import "./workoutLibrary.css";
import "../workout_pages/workout.css";
import { HOME_GROUPS, GYM_GROUPS, toSlug } from "../data/exerciseCatalog";

export default function Workouts() {
  const navigate = useNavigate();

  const ExerciseGrid = ({ items }) => (
    <div className="workout-exercise-grid">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          className="workout-exercise-card"
          onClick={() => navigate(`/exercise/${toSlug(item)}`)}
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
      <div className="library-page container">
        <div className="library-header">
          <div>
            <h1 className="library-title">Workout Library</h1>
          </div>
        </div>

        <section className="library-section">
          <div className="section-title-row">
            <h2>All Workouts (Home + Gym)</h2>
            <span>Full exercise list with details</span>
          </div>

          <div className="workout-groups">
            <section className="workout-group-card">
              <div className="workout-group-header">
                <h2>Home Workout</h2>
              </div>
              <div className="workout-group-body">
                {HOME_GROUPS.map((group) => (
                  <section key={group.title} className="workout-group-section">
                    <div className="workout-group-subtitle">{group.title}</div>
                    <div className="workout-group-body">
                      {group.sections.map((section) => (
                        section.subsections ? (
                          <div key={section.title} className="workout-group-section">
                            <div className="workout-group-subtitle">{section.title}</div>
                            <div className="workout-group-subgrid">
                              {section.subsections.map((sub) => (
                                <GroupSection key={sub.title} title={sub.title} items={sub.items} />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <GroupSection key={section.title} title={section.title} items={section.items} />
                        )
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>

            <section className="workout-group-card">
              <div className="workout-group-header">
                <h2>Gym Workout</h2>
              </div>
              <div className="workout-group-body">
                {GYM_GROUPS.map((group) => (
                  <section key={group.title} className="workout-group-section">
                    <div className="workout-group-subtitle">{group.title}</div>
                    <div className="workout-group-body">
                      {group.sections.map((section) => (
                        <GroupSection key={section.title} title={section.title} items={section.items} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}