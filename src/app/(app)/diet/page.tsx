import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Beef,
  Coffee,
  Droplets,
  Moon,
  Salad,
  ShoppingCart,
  Sunrise,
  UtensilsCrossed,
  Wheat,
  Zap,
} from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/server";
import { getActiveDietPlan } from "@/lib/data/user-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";

export const metadata = { title: "Diet plan" };

const MEAL_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  breakfast: { label: "Breakfast", icon: Sunrise },
  lunch: { label: "Lunch", icon: UtensilsCrossed },
  dinner: { label: "Dinner", icon: Moon },
  snack: { label: "Snack", icon: Coffee },
  pre_workout: { label: "Pre-workout", icon: Zap },
  post_workout: { label: "Post-workout", icon: Zap },
};

export default async function DietPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getActiveDietPlan(user.id);
  if (!data) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Salad className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-bold">No diet plan yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Generate your plan from the analysis page.
          </p>
          <Button asChild className="mt-6">
            <Link href="/analysis">Run analysis</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { plan, meals } = data;
  const totalCals = meals.reduce((s, m) => s + (m.calories ?? 0), 0);
  const totalProtein = meals.reduce((s, m) => s + (m.proteinG ?? 0), 0);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Your daily targets</p>
        <h1 className="text-3xl font-bold tracking-tight">Diet plan</h1>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Calories"
          value={plan.targetCalories}
          unit="kcal"
          tone="primary"
        />
        <StatCard label="Protein" value={plan.proteinG} unit="g" icon={<Beef className="h-5 w-5" />} />
        <StatCard label="Carbs" value={plan.carbsG} unit="g" icon={<Wheat className="h-5 w-5" />} />
        <StatCard label="Fat" value={plan.fatG} unit="g" icon={<Salad className="h-5 w-5" />} />
      </div>

      {plan.waterMl && (
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Droplets className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <div className="text-sm font-medium">Water target</div>
              <div className="text-xs text-muted-foreground">
                Aim for ~{Math.round(plan.waterMl / 250)} glasses (~{plan.waterMl} ml)
                spread through the day.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Today's meals</h2>
        <div className="text-xs text-muted-foreground">
          Sums to {totalCals} kcal · {totalProtein}g protein
        </div>

        {meals.map((meal) => {
          const meta = MEAL_META[meal.mealType] ?? {
            label: meal.mealType,
            icon: UtensilsCrossed,
          };
          const Icon = meta.icon;
          return (
            <Card key={meal.id}>
              <CardContent className="p-5">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <Badge variant="muted">{meta.label}</Badge>
                  <div className="ml-auto text-xs text-muted-foreground">
                    {meal.calories} kcal · {meal.proteinG}P / {meal.carbsG}C /{" "}
                    {meal.fatG}F
                  </div>
                </div>
                <h3 className="text-base font-semibold">{meal.name}</h3>
                {meal.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {meal.description}
                  </p>
                )}
                {meal.alternatives && meal.alternatives.length > 0 && (
                  <details className="group mt-3">
                    <summary className="cursor-pointer text-xs font-semibold text-primary">
                      Swap options ({meal.alternatives.length})
                    </summary>
                    <ul className="mt-2 space-y-1 pl-3 text-xs text-muted-foreground">
                      {meal.alternatives.map((alt, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                          {alt}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {plan.groceryList && plan.groceryList.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Weekly grocery list</h3>
            </div>
            <ul className="grid grid-cols-2 gap-y-1 text-sm text-muted-foreground">
              {plan.groceryList.map((g, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  {g}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {plan.notes && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5 text-sm leading-relaxed">
            {plan.notes}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
