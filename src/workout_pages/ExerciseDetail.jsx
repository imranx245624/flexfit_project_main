import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageWrapper from "./pageWrapper.jsx";
import { getExerciseBySlug } from "../data/exerciseCatalog";
import { getExerciseDetails } from "../data/exerciseDetails";
import { fetchPexelsVideoWithFallback } from "../utils/pexelsVideo";
import { getPexelsQueries } from "../utils/pexelsQueries";
import "./exerciseDetail.css";

const toTitle = (slug = "") =>
  String(slug)
    .split("-")
    .map((word) => word ? word[0].toUpperCase() + word.slice(1) : "")
    .join(" ");

export default function ExerciseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const exerciseMeta = useMemo(() => getExerciseBySlug(slug), [slug]);
  const displayName = exerciseMeta?.name || toTitle(slug);

  const detail = useMemo(() => getExerciseDetails(slug), [slug]);
  const [pexelsVideo, setPexelsVideo] = useState(null);
  const [pexelsLoading, setPexelsLoading] = useState(false);
  const [pexelsError, setPexelsError] = useState("");
  const [pexelsDebug, setPexelsDebug] = useState("");

  const videoSrc = detail?.video || pexelsVideo?.videoUrl || null;
  const poster = detail?.poster || pexelsVideo?.image || null;
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewVideoRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (detail?.video) {
      setPexelsVideo(null);
      setPexelsLoading(false);
      setPexelsError("");
      setPexelsDebug("");
      return;
    }
    let mounted = true;
    const controller = new AbortController();

    (async () => {
      try {
        setPexelsLoading(true);
        setPexelsError("");
        const queries = getPexelsQueries({
          name: displayName,
          slug,
          program: exerciseMeta?.program,
        });
        const { result, error } = await fetchPexelsVideoWithFallback(queries, {
          orientation: "landscape",
          size: "medium",
          perPage: 8,
          minDuration: 0,
          maxDuration: 120,
          meta: { name: displayName, slug },
          signal: controller.signal,
        });
        if (mounted) {
          if (result) {
            setPexelsVideo(result);
          } else {
            if (error) {
              const msg = String(error?.message || error || "");
              if (msg.includes("Missing PEXELS_API_KEY")) {
                setPexelsError("Video preview not configured.");
                setPexelsDebug("Set PEXELS_API_KEY for /api/pexels.");
              } else {
                setPexelsError("Could not load video preview.");
                setPexelsDebug(msg);
              }
            } else {
              setPexelsError("No video found for this exercise yet.");
              setPexelsDebug(`No results for: ${queries.join(" | ")}`);
            }
            setPexelsVideo(null);
          }
        }
      } catch (err) {
        if (mounted && !controller.signal.aborted) {
          const msg = String(err?.message || err || "");
          if (msg.includes("Missing PEXELS_API_KEY")) {
            setPexelsError("Video preview not configured.");
            setPexelsDebug("Set PEXELS_API_KEY for /api/pexels.");
          } else {
            setPexelsError("Could not load video preview.");
            setPexelsDebug(msg);
          }
          setPexelsVideo(null);
        }
      } finally {
        if (mounted) setPexelsLoading(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [displayName, detail?.video, exerciseMeta?.program, slug]);

  const steps = detail?.steps || [];
  const primaryMuscles = detail?.primaryMuscles || [];
  const secondaryMuscles = detail?.secondaryMuscles || [];
  const stats = detail?.stats || {
    maxSession: "3-5 sets x 8-15 reps",
    duration: "30-60s per set",
    calories: "~40-70 kcal / 10 min",
  };

  const handleOpenPreview = () => {
    if (!videoSrc) return;
    setPreviewOpen(true);
    setTimeout(() => {
      const el = previewVideoRef.current;
      if (!el) return;
      try {
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      } catch (e) {}
      el.play().catch(() => {});
    }, 120);
  };

  const handleClosePreview = async () => {
    try {
      if (previewVideoRef.current) {
        previewVideoRef.current.pause();
        previewVideoRef.current.currentTime = 0;
      }
    } catch (e) {}
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch (e) {}
    setPreviewOpen(false);
  };

  return (
    <PageWrapper>
      <div className="exercise-detail container">
        <div className="exercise-header">
          <div>
            <div className="exercise-kicker">Exercise Detail</div>
            <h1 className="exercise-title">{displayName}</h1>
            <div className="exercise-meta">
              {exerciseMeta?.group && <span>{exerciseMeta.group}</span>}
              {exerciseMeta?.section && <span>{exerciseMeta.section}</span>}
              {exerciseMeta?.program && <span>{exerciseMeta.program === "home" ? "Home" : "Gym"}</span>}
            </div>
          </div>
          <button className="exercise-back" type="button" onClick={() => navigate(-1)}>Back</button>
        </div>

        <div className="exercise-chips">
          {exerciseMeta?.group && <span className="exercise-chip">{exerciseMeta.group}</span>}
          {exerciseMeta?.section && <span className="exercise-chip">{exerciseMeta.section}</span>}
          {exerciseMeta?.program && (
            <span className="exercise-chip">{exerciseMeta.program === "home" ? "Home Workout" : "Gym Workout"}</span>
          )}
        </div>

        <div className="exercise-stats">
          <div className="exercise-stat">
            <div className="stat-label">Max session</div>
            <div className="stat-value">{stats.maxSession}</div>
          </div>
          <div className="exercise-stat">
            <div className="stat-label">Duration</div>
            <div className="stat-value">{stats.duration}</div>
          </div>
          <div className="exercise-stat">
            <div className="stat-label">Calories burned</div>
            <div className="stat-value">{stats.calories}</div>
          </div>
        </div>

        <div className="exercise-content">
          <div className="exercise-video-card">
            {videoSrc ? (
              <button className="video-click" type="button" onClick={handleOpenPreview}>
                <video className="exercise-video" src={videoSrc} poster={poster || ""} muted loop playsInline />
                <span className="video-overlay">Play Video</span>
              </button>
            ) : (
              <div className="exercise-video-placeholder">
              {pexelsLoading ? "Loading video..." : (pexelsError || "Video coming soon.")}
              {pexelsDebug && <div className="pexels-debug">Debug: {pexelsDebug}</div>}
            </div>
          )}
            {pexelsVideo && (
              <div className="pexels-attrib">
                Video by{" "}
                <a href={pexelsVideo.photographerUrl} target="_blank" rel="noreferrer">
                  {pexelsVideo.photographer}
                </a>{" "}
                on{" "}
                <a href={pexelsVideo.pexelsUrl} target="_blank" rel="noreferrer">
                  Pexels
                </a>
              </div>
            )}
          </div>

          <div className="exercise-info">
            <div className="info-card">
              <h3>Target Muscles</h3>
              {primaryMuscles.length > 0 ? (
                <div className="pill-grid">
                  {primaryMuscles.map((m) => <span key={m} className="pill">{m}</span>)}
                </div>
              ) : (
                <p className="info-muted">No primary muscle data yet.</p>
              )}
              {secondaryMuscles.length > 0 && (
                <>
                  <div className="info-subtitle">Secondary</div>
                  <div className="pill-grid">
                    {secondaryMuscles.map((m) => <span key={m} className="pill ghost">{m}</span>)}
                  </div>
                </>
              )}
            </div>

            <div className="info-card">
              <h3>How To Perform</h3>
              {steps.length > 0 ? (
                <ol className="step-list">
                  {steps.map((step, idx) => (
                    <li key={`${step}-${idx}`}>{step}</li>
                  ))}
                </ol>
              ) : (
                <p className="info-muted">No step-by-step instructions available yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {previewOpen && videoSrc && (
        <div className="exercise-preview-backdrop" role="dialog" aria-modal="true" onClick={handleClosePreview}>
          <div className="exercise-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="exercise-preview-header">
              <div className="preview-title">{displayName}</div>
              <button className="preview-close" onClick={handleClosePreview} type="button" aria-label="Close preview">Close</button>
            </div>
            <video
              ref={previewVideoRef}
              className="exercise-preview-video"
              src={videoSrc}
              controls
              autoPlay
              muted
              playsInline
            />
            {pexelsVideo && (
              <div className="pexels-attrib modal">
                Video by{" "}
                <a href={pexelsVideo.photographerUrl} target="_blank" rel="noreferrer">
                  {pexelsVideo.photographer}
                </a>{" "}
                on{" "}
                <a href={pexelsVideo.pexelsUrl} target="_blank" rel="noreferrer">
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
