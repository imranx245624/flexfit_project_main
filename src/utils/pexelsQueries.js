import { toSlug } from "../data/exerciseCatalog";

const OVERRIDE_QUERIES = {
  "push-ups": ["push up exercise", "pushup exercise"],
  "incline-push-ups": ["incline push up exercise", "incline pushup"],
  "diamond-push-ups": ["diamond push up exercise", "diamond pushup"],
  "pull-ups": ["pull up exercise", "pullup exercise", "pull up bar workout"],
  "dips": ["tricep dip exercise", "parallel bar dip"],
  "bench-dips": ["bench dip exercise", "tricep bench dips"],
  "jumping-jacks": ["jumping jack exercise", "jumping jacks cardio"],
  "high-knees": ["high knees exercise", "high knees cardio"],
  "mountain-climbers": ["mountain climber exercise", "mountain climbers workout"],
  "jump-squats": ["jump squat exercise", "squat jump workout"],
  "plank-to-push-up": ["plank to push up exercise", "up down plank exercise"],
  "russian-twists": ["russian twist exercise", "russian twists workout", "oblique twist exercise"],
  "skipping-without-rope": ["jump rope without rope", "imaginary jump rope", "jump rope cardio"],
  "wall-sit": ["wall sit exercise", "wall sit hold"],
  "superman-hold": ["superman exercise", "superman hold"],
  "reverse-snow-angels": ["reverse snow angel exercise", "prone snow angel exercise"],
  "towel-rows": ["inverted row exercise", "bodyweight row", "towel row exercise"],
  "towel-curls": ["towel bicep curl exercise", "bicep curl with towel"],
  "isometric-hold": ["isometric bicep hold exercise", "isometric biceps hold"],
  "pec-deck-machine": ["pec deck machine", "chest fly machine"],
  "chest-fly-machine-dumbbell": ["dumbbell chest fly", "dumbbell fly exercise", "chest fly machine"],
  "cable-crossover": ["cable crossover exercise", "cable chest fly"],
  "overhead-shoulder-press": ["overhead shoulder press", "dumbbell shoulder press"],
  "arnold-press": ["arnold press exercise", "dumbbell arnold press"],
  "lateral-raises": ["lateral raise exercise", "dumbbell lateral raise"],
  "front-raises": ["front raise exercise", "dumbbell front raise"],
  "rear-delt-fly": ["rear delt fly exercise", "reverse fly dumbbell"],
  "face-pull": ["face pull cable", "face pull exercise"],
  "barbell-curl": ["barbell curl exercise", "barbell bicep curl"],
  "dumbbell-curl": ["dumbbell curl exercise", "bicep curl dumbbell"],
  "hammer-curl": ["hammer curl exercise"],
  "preacher-curl": ["preacher curl exercise", "preacher curl machine"],
  "cable-curl": ["cable curl exercise", "biceps cable curl"],
  "tricep-pushdown": ["tricep pushdown cable", "triceps pressdown cable"],
  "skull-crushers": ["skull crusher exercise", "lying triceps extension"],
  "overhead-tricep-extension": ["overhead tricep extension", "overhead triceps dumbbell"],
  "close-grip-bench-press": ["close grip bench press", "close grip bench press exercise"],
  "lat-pulldown": ["lat pulldown exercise", "lat pull down machine"],
  "seated-cable-row": ["seated cable row", "cable row exercise"],
  "barbell-row": ["barbell row exercise", "bent over row barbell"],
  "t-bar-row": ["t bar row exercise", "t-bar row"],
  "romanian-deadlift": ["romanian deadlift", "rdl barbell"],
  "hip-thrust": ["hip thrust exercise", "barbell hip thrust"],
  "bulgarian-split-squat": ["bulgarian split squat", "rear foot elevated split squat"],
  "leg-press": ["leg press machine", "leg press exercise"],
  "leg-extension": ["leg extension machine", "leg extension exercise"],
  "leg-curl": ["leg curl machine", "hamstring curl"],
  "standing-calf-raise": ["standing calf raise", "standing calf raise machine"],
  "seated-calf-raise": ["seated calf raise", "seated calf raise machine"],
  "ab-roller": ["ab wheel rollout", "ab roller exercise"],
  "cable-crunch": ["cable crunch exercise", "kneeling cable crunch"],
  "hanging-leg-raise": ["hanging leg raise", "hanging knee raise exercise"],
  "decline-sit-ups": ["decline sit up exercise", "decline sit-up bench"],
  "clean-press": ["clean and press exercise", "barbell clean and press"],
  "thrusters": ["thruster exercise", "barbell thruster", "dumbbell thruster"],
};

const EQUIPMENT_HINTS = [
  "barbell",
  "dumbbell",
  "cable",
  "machine",
  "bench",
  "kettlebell",
  "bodyweight",
  "band",
  "rope",
];

const unique = (items = []) => {
  const seen = new Set();
  const out = [];
  items.forEach((item) => {
    const key = String(item || "").trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(item);
  });
  return out;
};

const normalizeName = (name = "") =>
  String(name || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildVariants = (base = "") => {
  const variants = new Set();
  if (!base) return variants;
  variants.add(base);
  if (base.endsWith("s")) variants.add(base.slice(0, -1));
  if (base.includes("push ups")) variants.add(base.replace("push ups", "pushups"));
  if (base.includes("push up")) variants.add(base.replace("push up", "pushups"));
  if (base.includes("pull ups")) variants.add(base.replace("pull ups", "pullups"));
  if (base.includes("pull up")) variants.add(base.replace("pull up", "pullups"));
  if (base.includes("sit ups")) variants.add(base.replace("sit ups", "situps"));
  if (base.includes("sit up")) variants.add(base.replace("sit up", "situps"));
  if (base.includes("jumping jacks")) variants.add(base.replace("jumping jacks", "jumping jack"));
  return variants;
};

export const getPexelsQueries = ({ name, slug, program } = {}) => {
  const normalized = normalizeName(name || slug || "");
  const resolvedSlug = slug || toSlug(name || "");
  const variants = buildVariants(normalized);
  const queries = [];

  const overrides = OVERRIDE_QUERIES[resolvedSlug];
  if (overrides?.length) queries.push(...overrides);

  variants.forEach((variant) => {
    if (!variant) return;
    queries.push(`${variant} exercise`);
    queries.push(`${variant} workout`);
    if (program === "home") queries.push(`bodyweight ${variant}`);
    if (program === "gym") queries.push(`${variant} gym`);
    EQUIPMENT_HINTS.forEach((hint) => {
      if (variant.includes(hint)) queries.push(`${variant} ${hint} exercise`);
    });
  });

  queries.push("fitness exercise");
  return unique(queries);
};
