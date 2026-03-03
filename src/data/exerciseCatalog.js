export const toSlug = (name = "") =>
  String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const HOME_GROUPS = [
  {
    title: "Upper Body",
    sections: [
      { title: "Chest", items: ["Push-ups", "Incline push-ups", "Diamond push-ups"] },
      { title: "Back", items: ["Superman hold", "Reverse snow angels", "Towel rows"] },
      { title: "Shoulders", items: ["Pike push-ups", "Arm circles", "Wall handstand hold"] },
      {
        title: "Arms",
        subsections: [
          { title: "Biceps", items: ["Towel curls", "Isometric hold"] },
          { title: "Triceps", items: ["Bench dips", "Diamond push-ups"] },
        ],
      },
    ],
  },
  {
    title: "Core",
    sections: [
      { title: "Abs", items: ["Crunches", "Leg raises", "Bicycle crunch"] },
      { title: "Obliques", items: ["Russian twists", "Side plank"] },
      { title: "Lower Core", items: ["Flutter kicks", "Reverse crunch"] },
    ],
  },
  {
    title: "Lower Body",
    sections: [
      { title: "Quads", items: ["Squats", "Wall sit"] },
      { title: "Hamstrings", items: ["Glute bridge", "Single leg bridge"] },
      { title: "Glutes", items: ["Lunges", "Glute kickbacks"] },
      { title: "Calves", items: ["Calf raises"] },
    ],
  },
  // {
  //   title: "Full Body",
  //   sections: [
  //     { title: "Full Body", items: ["Burpees",  "Plank to push-up"] },
  //   ],
  // },
  {
    title: "Cardio",
    sections: [
      { title: "Cardio", items: ["Jumping jacks", "High knees", "Skipping "] },
    ],
  },
];

export const GYM_GROUPS = [
  {
    title: "Chest",
    sections: [
      { title: "Chest", items: ["Bench Press", "Incline Bench Press",  "Chest Fly (Machine / Dumbbell)",  "Pec Deck Machine"] },
    ],
  },
  {
    title: "Back",
    sections: [
      { title: "Back", items: ["Lat Pulldown", "Pull-ups", "Seated Cable Row", "T-Bar Row", "Deadlift"] },
    ],
  },
  {
    title: "Shoulders",
    sections: [
      { title: "Shoulders", items: ["Overhead Shoulder Press", "Arnold Press", "Lateral Raises", "Front Raises", "Rear Delt Fly", "Face Pull"] },
    ],
  },
  {
    title: "Arms",
    sections: [
      { title: "Biceps", items: ["Barbell Curl", "Dumbbell Curl", "Cable Curl"] },
      { title: "Triceps", items: ["Tricep Pushdown", "Skull Crushers", "Overhead Tricep Extension", "Dips"] },
    ],
  },
  {
    title: "Legs",
    sections: [
      { title: "Quads", items: ["Barbell Squats", "Leg Press", "Leg Extension"] },
      { title: "Hamstrings", items: ["Leg Curl", "Romanian Deadlift"] },
      { title: "Glutes", items: ["Hip Thrust", "Bulgarian Split Squat"] },
      { title: "Calves", items: ["Standing Calf Raise", "Seated Calf Raise"] },
    ],
  },
  // {
  //   title: "Core",
  //   sections: [
  //     { title: "Core", items: ["Cable Crunch", "Hanging Leg Raise", "Russian Twists"] },
  //   ],
  // },
  {
    title: "Compound",
    sections: [
      { title: "Compound", items: ["Deadlift", "Squat", "Bench Press"] },
    ],
  },
];

export const buildExerciseIndex = () => {
  const map = new Map();
  const addItem = (name, groupTitle, sectionTitle, program) => {
    const slug = toSlug(name);
    if (!map.has(slug)) {
      map.set(slug, {
        name,
        slug,
        group: groupTitle,
        section: sectionTitle,
        program,
      });
    }
  };

  const consumeGroup = (group, program) => {
    group.sections.forEach((section) => {
      if (section.subsections) {
        section.subsections.forEach((sub) => {
          sub.items.forEach((item) => addItem(item, group.title, sub.title, program));
        });
      } else {
        section.items.forEach((item) => addItem(item, group.title, section.title, program));
      }
    });
  };

  HOME_GROUPS.forEach((group) => consumeGroup(group, "home"));
  GYM_GROUPS.forEach((group) => consumeGroup(group, "gym"));

  return map;
};

export const EXERCISE_INDEX = buildExerciseIndex();

export const ALL_EXERCISES = Array.from(EXERCISE_INDEX.values());

export const getExerciseBySlug = (slug) => EXERCISE_INDEX.get(slug) || null;
