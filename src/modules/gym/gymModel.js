export const estimatedOneRepMax = (weight, reps) => Math.round((Number(weight) || 0) * (1 + (Number(reps) || 0) / 30) * 10) / 10;

export function exerciseSetRows(exercise) {
  if (exercise.setDetails?.length) return exercise.setDetails;
  return Array.from({ length: Number(exercise.sets) || 0 }, (_, index) => ({ id: `${exercise.id}-set-${index}`, weight: Number(exercise.weight) || 0, reps: Number(exercise.reps) || 0, rir: exercise.rir, rpe: exercise.rpe, warmup: Boolean(exercise.warmup) }));
}

export function workoutVolume(workout) {
  return (workout.exercises || []).reduce((total, exercise) => total + exerciseSetRows(exercise).filter((set) => !set.warmup).reduce((sum, set) => sum + Number(set.weight || 0) * Number(set.reps || 0), 0), 0);
}

export function personalRecords(workouts = [], exerciseName = "") {
  const sets = workouts.flatMap((workout) => (workout.exercises || []).filter((exercise) => !exerciseName || exercise.name === exerciseName).flatMap((exercise) => exerciseSetRows(exercise).map((set) => ({ ...set, exercise: exercise.name, date: workout.date })))).filter((set) => !set.warmup);
  if (!sets.length) return null;
  return {
    weight: sets.reduce((best, set) => Number(set.weight) > Number(best.weight) ? set : best, sets[0]),
    reps: sets.reduce((best, set) => Number(set.reps) > Number(best.reps) ? set : best, sets[0]),
    oneRepMax: sets.reduce((best, set) => estimatedOneRepMax(set.weight, set.reps) > estimatedOneRepMax(best.weight, best.reps) ? set : best, sets[0]),
  };
}

export function progressionSignal(workouts = [], exerciseName) {
  const performances = workouts.flatMap((workout) => (workout.exercises || []).filter((exercise) => exercise.name === exerciseName).map((exercise) => ({ date: workout.date, score: Math.max(...exerciseSetRows(exercise).filter((set) => !set.warmup).map((set) => estimatedOneRepMax(set.weight, set.reps)), 0) }))).slice(-4);
  if (performances.length < 2) return { id: "baseline", label: "Bygger baslinje", tone: "neutral" };
  const delta = performances.at(-1).score - performances.at(-2).score;
  if (delta > .25) return { id: "up", label: `Progression +${delta.toFixed(1)} kg e1RM`, tone: "positive" };
  if (delta < -.25) return { id: "down", label: `Tillfälligt −${Math.abs(delta).toFixed(1)} kg e1RM`, tone: "warning" };
  return { id: "steady", label: "Stabilt · öka reps eller vikt", tone: "neutral" };
}

export function plateLoading(totalWeight, barWeight = 20, available = [25, 20, 15, 10, 5, 2.5, 1.25]) {
  let remaining = Math.max(0, (Number(totalWeight) - Number(barWeight)) / 2);
  const plates = [];
  available.forEach((plate) => {
    const count = Math.floor((remaining + 1e-6) / plate);
    if (count) plates.push({ plate, count });
    remaining = Math.round((remaining - count * plate) * 100) / 100;
  });
  return { plates, remainder: remaining, loadable: remaining === 0 };
}
