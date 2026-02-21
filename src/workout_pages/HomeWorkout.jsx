import React from "react";
import { useNavigate } from "react-router-dom";
import PageWrapper from "./pageWrapper.jsx";
import "./workout.css";
import { HOME_GROUPS, toSlug } from "../data/exerciseCatalog";

function HomeWorkout() {
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
      <div className="homeworkout-title split-title">
        <span>Home</span>
        <span>Workout</span>
      </div>

      <div className="workout-groups">
        {HOME_GROUPS.map((group) => {
          const isSingle =
            group.sections.length === 1 &&
            !group.sections[0].subsections &&
            group.sections[0].title === group.title;
          return (
            <section key={group.title} className="workout-group-card">
              <div className="workout-group-header">
                <h2>{group.title}</h2>
              </div>
              <div className="workout-group-body">
                {isSingle ? (
                  <ExerciseGrid items={group.sections[0].items} />
                ) : (
                  group.sections.map((section) => (
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
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </PageWrapper>
  );
}

export default HomeWorkout; 
