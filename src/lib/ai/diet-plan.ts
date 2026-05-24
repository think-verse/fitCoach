import type { UserProfile } from "@/lib/db/schema";
import { generateStructured } from "./client";
import { DietPlanSchema, type DietPlanAI } from "./schemas";

const SYSTEM = `You are FitCoach AI generating a personalized diet plan.

Rules:
- Hit the calorie and macro targets within ±5%.
- Match food_pref strictly: vegan = no animal products, vegetarian = no meat/fish
  (eggs only if eggetarian), non_vegetarian = anything okay.
- diet_style="indian" means use Indian staples: rice, roti, dal, paneer, curd,
  chicken, eggs, oats, soya chunks, sprouts, fruits, vegetables. Real portions,
  real meal names ("Chicken curry + 2 roti + salad"), not abstract macros.
- budget="low" means cheap protein sources (eggs, dal, soya, chicken thighs over
  breast, curd). budget="high" allows whey, paneer, salmon, lean cuts.
- Always include a pre_workout and post_workout option.
- Grocery list should be a realistic weekly shop, grouped naturally
  (e.g. "1kg chicken breast", "12 eggs", "2L milk"), not a vague category list.
- Every meal MUST have ≥2 alternatives with similar macros (for the swap feature).`;

interface DietPlanInput {
  profile: UserProfile;
  calorieTargets: {
    targetCalories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    waterMl: number;
  };
}

export async function generateDietPlan(input: DietPlanInput): Promise<DietPlanAI> {
  const { profile, calorieTargets } = input;

  const prompt = `Generate a realistic 1-day meal plan with swap options.

Targets (must match within ±5%):
- Calories: ${calorieTargets.targetCalories} kcal
- Protein: ${calorieTargets.proteinG} g
- Carbs:   ${calorieTargets.carbsG} g
- Fat:     ${calorieTargets.fatG} g
- Water:   ${calorieTargets.waterMl} ml

User context:
- Goal:         ${profile.goal}
- Food pref:    ${profile.foodPref}
- Diet style:   ${profile.dietStyle}
- Budget:       ${profile.budget}
- Weight:       ${profile.weightKg} kg
- Training:     ${profile.trainingDaysPerWeek} days/week

Produce: breakfast, lunch, dinner, 1 snack, pre_workout, post_workout (6 meals).
Include a grocery_list for the week and notes with cheat meal guidance.`;

  return generateStructured({
    system: SYSTEM,
    user: prompt,
    schema: DietPlanSchema,
    toolName: "submit_diet_plan",
    toolDescription: "Submit the personalized diet plan.",
    maxTokens: 4000,
  });
}
