/**
 * Fitness math — BMI, BMR (Mifflin–St Jeor), TDEE, calorie & macro targets.
 * All inputs in metric. Outputs are deterministic — no AI involved here.
 */

export type Gender = "male" | "female" | "other";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type Goal =
  | "fat_loss"
  | "muscle_gain"
  | "recomposition"
  | "strength"
  | "general_fitness";

const ACTIVITY_MULT: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function bmi(heightCm: number, weightKg: number): number {
  if (!heightCm || !weightKg) return 0;
  const m = heightCm / 100;
  return +(weightKg / (m * m)).toFixed(2);
}

export function bmiCategory(bmiValue: number): {
  label: string;
  tone: "muted" | "success" | "warning" | "destructive";
} {
  if (bmiValue < 18.5) return { label: "Underweight", tone: "warning" };
  if (bmiValue < 25) return { label: "Normal", tone: "success" };
  if (bmiValue < 30) return { label: "Overweight", tone: "warning" };
  return { label: "Obese", tone: "destructive" };
}

/** Mifflin–St Jeor. For "other" gender we average the two formulas. */
export function bmr(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
): number {
  if (!weightKg || !heightCm || !age) return 0;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === "male") return Math.round(base + 5);
  if (gender === "female") return Math.round(base - 161);
  return Math.round(base - 78); // average of +5 and -161
}

export function tdee(bmrValue: number, level: ActivityLevel): number {
  return Math.round(bmrValue * ACTIVITY_MULT[level]);
}

/**
 * Calorie target by goal. Gentle, evidence-based defaults:
 *   fat_loss     -15% deficit  (sustainable, preserves muscle)
 *   muscle_gain  +5% surplus   (lean gains, minimal fat addition)
 *   recomposition near maintenance, high protein
 *   strength     +3% (recover well without bloating up)
 *   general_fit  maintenance
 *
 * The previous defaults (-20% / +10%) were too aggressive once stacked on top
 * of the common "very_active" activity overestimate — produced unrealistic
 * 3000+ kcal bulks for sub-70 kg trainees.
 */
export function targetCalories(tdeeValue: number, goal: Goal): number {
  switch (goal) {
    case "fat_loss":
      return Math.round(tdeeValue * 0.85);
    case "muscle_gain":
      return Math.round(tdeeValue * 1.05);
    case "recomposition":
      return Math.round(tdeeValue * 0.97);
    case "strength":
      return Math.round(tdeeValue * 1.03);
    case "general_fitness":
    default:
      return tdeeValue;
  }
}

/**
 * Macro split by goal. Protein scales with bodyweight (g/kg), fat is a % of
 * calories, carbs fill the remainder.
 */
export function macros(weightKg: number, calories: number, goal: Goal) {
  const proteinPerKg =
    goal === "muscle_gain" || goal === "recomposition" || goal === "strength"
      ? 2.2
      : goal === "fat_loss"
        ? 2.4 // higher protein when in a deficit to preserve muscle
        : 1.8;

  const fatPct = goal === "fat_loss" ? 0.25 : 0.28;

  const proteinG = Math.round(weightKg * proteinPerKg);
  const fatG = Math.round((calories * fatPct) / 9);
  const remaining = calories - proteinG * 4 - fatG * 9;
  const carbsG = Math.max(0, Math.round(remaining / 4));

  return { proteinG, fatG, carbsG };
}

export function waterTargetMl(weightKg: number, level: ActivityLevel): number {
  // 33ml/kg baseline, +500ml for active/very_active.
  const base = Math.round(weightKg * 33);
  return level === "active" || level === "very_active" ? base + 500 : base;
}

/** Convenience: full nutrition snapshot from a profile-like input. */
export interface NutritionInput {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: Goal;
}

export function computeNutrition(input: NutritionInput) {
  const bmiValue = bmi(input.heightCm, input.weightKg);
  const cat = bmiCategory(bmiValue);
  const bmrValue = bmr(input.weightKg, input.heightCm, input.age, input.gender);
  const tdeeValue = tdee(bmrValue, input.activityLevel);
  const calories = targetCalories(tdeeValue, input.goal);
  const m = macros(input.weightKg, calories, input.goal);
  return {
    bmi: bmiValue,
    bmiCategory: cat.label,
    bmiTone: cat.tone,
    bmr: bmrValue,
    tdee: tdeeValue,
    targetCalories: calories,
    proteinG: m.proteinG,
    carbsG: m.carbsG,
    fatG: m.fatG,
    waterMl: waterTargetMl(input.weightKg, input.activityLevel),
  };
}
