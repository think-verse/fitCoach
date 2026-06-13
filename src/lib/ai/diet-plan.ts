import type { UserProfile } from "@/lib/firestore/types";
import { generateStructured, TEXT_MODEL } from "./client";
import { DietPlanSchema, type DietPlanAI } from "./schemas";

const SYSTEM = `You are FitCoach AI generating a personalized diet plan.

Rules:
- Hit the calorie and macro targets within ±5%.
- Match food_pref strictly: vegan = no animal products, vegetarian = no meat/fish
  (eggs only if eggetarian), non_vegetarian = anything okay.
- diet_style="western" = whole-foods Western diet (chicken, beef, fish, eggs,
  oats, rice, potatoes, pasta, leafy greens, dairy). diet_style="mixed" =
  international whole foods, you choose the cuisine that best fits the user's
  goal. Use real meal names ("Grilled chicken + sweet potato + salad"), not
  abstract macros.
- budget="low" = cheap protein sources (eggs, chicken thighs, canned tuna,
  Greek yogurt, beans, lentils, whey concentrate). budget="high" = lean cuts,
  salmon, premium dairy, whey isolate.
- Always include a pre_workout and post_workout option.
- Grocery list should be a realistic weekly shop, grouped naturally
  (e.g. "1kg chicken breast", "12 eggs", "2L milk"), not a vague category list.
- Every meal MUST have exactly 2 alternatives with similar macros (swap feature).

KEEP OUTPUT COMPACT (overly long output gets truncated):
- description: one short sentence per meal.
- alternatives: exactly 2, short ("3 boiled eggs + toast").
- grocery_list: 8–12 concise items.
- notes: 2 short sentences max.`;

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
    model: TEXT_MODEL,
  });
}
