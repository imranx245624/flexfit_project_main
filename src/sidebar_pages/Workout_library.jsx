import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageWrapper from "../workout_pages/pageWrapper.jsx";
import "./workoutLibrary.css";
import "../workout_pages/workout.css";
import { HOME_GROUPS, GYM_GROUPS, getExerciseBySlug, toSlug } from "../data/exerciseCatalog";
import { getExerciseDetails } from "../data/exerciseDetails";
import { fetchPexelsVideoWithFallback } from "../utils/pexelsVideo";
import { getPexelsQueries } from "../utils/pexelsQueries";

export default function Workouts() {
  const navigate = useNavigate();
  const location = useLocation();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewVideo, setPreviewVideo] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewDebug, setPreviewDebug] = useState("");
  const [query, setQuery] = useState("");
  const previewAbortRef = useRef(null);

  const closePreview = () => {
    try { previewAbortRef.current?.abort(); } catch (e) {}
    previewAbortRef.current = null;
    setPreviewOpen(false);
    setPreviewLoading(false);
    setPreviewError("");
    setPreviewDebug("");
    setPreviewVideo(null);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closePreview();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      try { previewAbortRef.current?.abort(); } catch (e) {}
      previewAbortRef.current = null;
    };
  }, []);

  const openPreview = async (name) => {
    try { previewAbortRef.current?.abort(); } catch (e) {}
    const controller = new AbortController();
    previewAbortRef.current = controller;
    setPreviewTitle(name);
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError("");
    setPreviewDebug("");
    setPreviewVideo(null);

    try {
      const slug = toSlug(name);
      const meta = getExerciseBySlug(slug);
      const detail = getExerciseDetails(slug);
      if (detail?.video) {
        setPreviewVideo({ videoUrl: detail.video, image: detail.poster || "" });
        setPreviewLoading(false);
        return;
      }
      const queries = getPexelsQueries({
        name,
        slug,
        program: meta?.program,
      });
      const { result, error } = await fetchPexelsVideoWithFallback(queries, {
        orientation: "landscape",
        size: "medium",
        perPage: 8,
        minDuration: 0,
        maxDuration: 120,
        meta: { name, slug },
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (result) {
        setPreviewVideo(result);
      } else {
        if (error) {
          setPreviewError("Could not load video preview.");
          setPreviewDebug(String(error?.message || error));
        } else {
          setPreviewError("No video found for this exercise yet.");
          setPreviewDebug(`No results for: ${queries.join(" | ")}`);
        }
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setPreviewError("Could not load video preview.");
      const msg = String(err?.message || err || "");
      setPreviewDebug(
        msg.includes("Missing PEXELS_API_KEY")
          ? "Video preview not configured. Set PEXELS_API_KEY for /api/pexels."
          : msg
      );
    } finally {
      if (!controller.signal.aborted) {
        setPreviewLoading(false);
      }
    }
  };

  const ExerciseCard = ({ name }) => (
    <div className="workout-exercise-card library-exercise-card">
      <div className="workout-exercise-info">
        <span className="workout-exercise-name">{name}</span>
        <span className="workout-exercise-cta">Preview or view details</span>
      </div>
      <div className="workout-exercise-actions">
        <button
          type="button"
          className="exercise-action ghost"
          onClick={() => openPreview(name)}
        >
          Preview
        </button>
        <button
          type="button"
          className="exercise-action primary"
          onClick={() => navigate(`/exercise/${toSlug(name)}`)}
        >
          Details
        </button>
      </div>
    </div>
  );

  const ExerciseGrid = ({ items }) => (
    <div className="workout-exercise-grid">
      {items.map((item) => (
        <ExerciseCard key={item} name={item} />
      ))}
    </div>
  );

  const GroupSection = ({ title, items }) => (
    <div className="workout-group-section">
      <div className="workout-group-subtitle">{title}</div>
      <ExerciseGrid items={items} />
    </div>
  );

  const filterType = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get("type");
    if (t === "home" || t === "gym") return t;
    return "";
  }, [location.search]);

  const sections = useMemo(() => ([
    { key: "home", title: "Home Workout", groups: HOME_GROUPS },
    { key: "gym", title: "Gym Workout", groups: GYM_GROUPS },
  ]), []);

  const orderedSections = useMemo(() => {
    if (!filterType) return sections;
    const preferred = sections.find((s) => s.key === filterType);
    const rest = sections.filter((s) => s.key !== filterType);
    return preferred ? [preferred, ...rest] : sections;
  }, [filterType, sections]);

  const normalizedQuery = useMemo(() => query.trim().toLowerCase(), [query]);

  const filteredSections = useMemo(() => {
    if (!normalizedQuery) return orderedSections;
    const matchItem = (item) => item.toLowerCase().includes(normalizedQuery);

    const filterGroup = (group) => {
      const filteredSections = group.sections
        .map((section) => {
          if (section.subsections) {
            const subsections = section.subsections
              .map((sub) => ({
                ...sub,
                items: sub.items.filter(matchItem),
              }))
              .filter((sub) => sub.items.length > 0);
            if (!subsections.length) return null;
            return { ...section, subsections };
          }
          const items = section.items.filter(matchItem);
          if (!items.length) return null;
          return { ...section, items };
        })
        .filter(Boolean);

      if (!filteredSections.length) return null;
      return { ...group, sections: filteredSections };
    };

    return orderedSections
      .map((section) => {
        const groups = section.groups
          .map(filterGroup)
          .filter(Boolean);
        if (!groups.length) return null;
        return { ...section, groups };
      })
      .filter(Boolean);
  }, [orderedSections, normalizedQuery]);

  const totalMatches = useMemo(() => {
    const countItems = (group) => group.sections.reduce((sum, section) => {
      if (section.subsections) {
        return sum + section.subsections.reduce((s, sub) => s + sub.items.length, 0);
      }
      return sum + section.items.length;
    }, 0);

    return filteredSections.reduce((sum, section) => {
      return sum + section.groups.reduce((s, group) => s + countItems(group), 0);
    }, 0);
  }, [filteredSections]);

  return (
    <PageWrapper>
      <div className="library-page container">
        <div className="library-header">
          <div>
            <h1 className="library-title">Workout Library</h1>
            <p className="library-sub">
              Video previews provided by{" "}
              <a href="https://www.pexels.com" target="_blank" rel="noreferrer">Pexels</a>{" "}
              with creator attribution.
            </p>
          </div>
          <div className="library-controls">
            <div className="library-search">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search exercises..."
                aria-label="Search exercises"
              />
              {query && (
                <button
                  type="button"
                  className="library-clear"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="library-toggle">
              <button
                type="button"
                className={`chip ${filterType === "home" ? "active" : ""}`}
                onClick={() => navigate("/workouts?type=home")}
              >
                Home
              </button>
              <button
                type="button"
                className={`chip ${filterType === "gym" ? "active" : ""}`}
                onClick={() => navigate("/workouts?type=gym")}
              >
                Gym
              </button>
              <button
                type="button"
                className={`chip ${filterType === "" ? "active" : ""}`}
                onClick={() => navigate("/workouts")}
              >
                All
              </button>
            </div>
          </div>
        </div>

        <section className="library-section">
          <div className="section-title-row">
            <h2>All Workouts (Home + Gym)</h2>
            <span>
              {normalizedQuery
                ? `${totalMatches} result(s) for "${query}"`
                : (filterType ? "Focused view - selected first" : "Full exercise list with details")}
            </span>
          </div>

          <div className="workout-groups">
            {!filteredSections.length && (
              <div className="library-empty">
                No exercises match your search. Try a different keyword.
              </div>
            )}
            {filteredSections.map((section, idx) => (
              <section key={section.key} className="workout-group-card">
                <div className="workout-group-header">
                  <h2 className="split-title">
                    <span>{section.title}</span>
                    <span>{filterType && idx === 0 && !normalizedQuery ? "Selected" : ""}</span>
                  </h2>
                </div>
                <div className="workout-group-body">
                  {section.groups.map((group) => {
                    const isSingle =
                      group.sections.length === 1 &&
                      !group.sections[0].subsections &&
                      group.sections[0].title === group.title;
                    return (
                      <section key={group.title} className="workout-group-section">
                        <div className="workout-group-subtitle">{group.title}</div>
                        <div className="workout-group-body">
                          {isSingle ? (
                            <ExerciseGrid items={group.sections[0].items} />
                          ) : (
                            group.sections.map((sectionItem) => (
                              sectionItem.subsections ? (
                                <div key={sectionItem.title} className="workout-group-section">
                                  <div className="workout-group-subtitle">{sectionItem.title}</div>
                                  <div className="workout-group-subgrid">
                                    {sectionItem.subsections.map((sub) => (
                                      <GroupSection key={sub.title} title={sub.title} items={sub.items} />
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <GroupSection key={sectionItem.title} title={sectionItem.title} items={sectionItem.items} />
                              )
                            ))
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>

      {previewOpen && (
        <div className="preview-backdrop" role="dialog" aria-modal="true" onClick={closePreview}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <div>
                <div className="preview-title">{previewTitle}</div>
                <div className="preview-meta">
                  {previewLoading ? "Loading video..." : (previewError || "Preview")}
                </div>
                {previewDebug && (
                  <div className="preview-debug">Debug: {previewDebug}</div>
                )}
              </div>
              <button className="preview-close" type="button" onClick={closePreview} aria-label="Close preview">Close</button>
            </div>
            {previewVideo && (
              <video
                className="preview-video"
                src={previewVideo.videoUrl}
                poster={previewVideo.image || ""}
                autoPlay
                muted
                playsInline
              />
            )}
            {previewVideo?.pexelsUrl && (
              <div className="pexels-attrib">
                Video by{" "}
                <a href={previewVideo.photographerUrl} target="_blank" rel="noreferrer">
                  {previewVideo.photographer}
                </a>{" "}
                on{" "}
                <a href={previewVideo.pexelsUrl} target="_blank" rel="noreferrer">
                  Pexels
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
