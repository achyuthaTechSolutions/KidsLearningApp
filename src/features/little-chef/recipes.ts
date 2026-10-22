/**
 * Pretend recipes. Every step is something a child can do safely in play:
 * no knives, heat, hot drinks, or appliances. No health or allergy claims are made.
 * Step text is built from the data, so the numbers said and shown always match.
 */
export interface Ingredient {
  id: string;
  name: string;
  plural: string;
  emoji: string;
}

export type ChefAction = 'mix' | 'shake' | 'serve' | 'arrange';

export type RecipeStep =
  | { kind: 'add'; ingredient: string; count: number }
  | { kind: 'action'; action: ChefAction };

export interface Recipe {
  id: string;
  title: string;
  emoji: string;
  container: string;
  steps: RecipeStep[];
}

export const ingredients: Ingredient[] = [
  { id: 'apple', name: 'apple', plural: 'apples', emoji: '🍎' },
  { id: 'banana', name: 'banana', plural: 'bananas', emoji: '🍌' },
  { id: 'strawberry', name: 'strawberry', plural: 'strawberries', emoji: '🍓' },
  { id: 'blueberry', name: 'blueberry', plural: 'blueberries', emoji: '🫐' },
  { id: 'grapes', name: 'bunch of grapes', plural: 'bunches of grapes', emoji: '🍇' },
  { id: 'bread', name: 'slice of bread', plural: 'slices of bread', emoji: '🍞' },
  { id: 'carrot', name: 'carrot', plural: 'carrots', emoji: '🥕' },
  { id: 'broccoli', name: 'broccoli', plural: 'broccolis', emoji: '🥦' },
  { id: 'tomato', name: 'tomato', plural: 'tomatoes', emoji: '🍅' },
  { id: 'corn', name: 'corn', plural: 'corns', emoji: '🌽' },
  { id: 'milk', name: 'cup of milk', plural: 'cups of milk', emoji: '🥛' },
];

export const actions: Record<ChefAction, { text: string; button: string; emoji: string }> = {
  mix: { text: 'Mix it all together with a big spoon!', button: 'Mix!', emoji: '🥄' },
  shake: { text: 'Put the lid on and shake the cup!', button: 'Shake!', emoji: '🥤' },
  serve: { text: 'Put it on a plate to serve!', button: 'Serve!', emoji: '🍽️' },
  arrange: { text: 'Arrange it into a happy face!', button: 'Make a face!', emoji: '😊' },
};

export const recipes: Recipe[] = [
  {
    id: 'fruit-salad', title: 'Fruit Salad', emoji: '🥣', container: 'bowl',
    steps: [
      { kind: 'add', ingredient: 'apple', count: 1 },
      { kind: 'add', ingredient: 'banana', count: 2 },
      { kind: 'add', ingredient: 'strawberry', count: 3 },
      { kind: 'action', action: 'mix' },
    ],
  },
  {
    id: 'banana-sandwich', title: 'Banana Sandwich', emoji: '🥪', container: 'plate',
    steps: [
      { kind: 'add', ingredient: 'bread', count: 1 },
      { kind: 'add', ingredient: 'banana', count: 1 },
      { kind: 'add', ingredient: 'bread', count: 1 },
      { kind: 'action', action: 'serve' },
    ],
  },
  {
    id: 'veggie-plate', title: 'Colourful Vegetable Plate', emoji: '🥗', container: 'plate',
    steps: [
      { kind: 'add', ingredient: 'carrot', count: 2 },
      { kind: 'add', ingredient: 'broccoli', count: 1 },
      { kind: 'add', ingredient: 'tomato', count: 3 },
      { kind: 'add', ingredient: 'corn', count: 1 },
      { kind: 'action', action: 'arrange' },
    ],
  },
  {
    id: 'smoothie', title: 'Fruit Smoothie', emoji: '🥤', container: 'cup',
    steps: [
      { kind: 'add', ingredient: 'banana', count: 1 },
      { kind: 'add', ingredient: 'strawberry', count: 2 },
      { kind: 'add', ingredient: 'blueberry', count: 4 },
      { kind: 'add', ingredient: 'milk', count: 1 },
      { kind: 'action', action: 'shake' },
    ],
  },
];

const numberWords = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

export function ingredientById(id: string): Ingredient {
  const found = ingredients.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown ingredient ${id}`);
  return found;
}

export function amount(ingredient: Ingredient, count: number): string {
  return `${numberWords[count] ?? count} ${count === 1 ? ingredient.name : ingredient.plural}`;
}

export function stepText(step: RecipeStep): string {
  if (step.kind === 'action') return actions[step.action].text;
  return `Add ${amount(ingredientById(step.ingredient), step.count)}.`;
}

/** Everything the recipe needs, for the "you will need" list. */
export function shoppingList(recipe: Recipe): { ingredient: Ingredient; count: number }[] {
  const totals = new Map<string, number>();
  for (const step of recipe.steps) if (step.kind === 'add') totals.set(step.ingredient, (totals.get(step.ingredient) ?? 0) + step.count);
  return [...totals].map(([id, count]) => ({ ingredient: ingredientById(id), count }));
}

export interface Kitchen {
  recipe: Recipe;
  step: number;
  /** What is in the bowl, in order, with the step that added it. */
  bowl: { ingredient: string; step: number }[];
}

export function startCooking(recipe: Recipe): Kitchen {
  return { recipe, step: 0, bowl: [] };
}

export function currentStep(kitchen: Kitchen): RecipeStep | undefined {
  return kitchen.recipe.steps[kitchen.step];
}

export function addedThisStep(kitchen: Kitchen): number {
  return kitchen.bowl.filter((item) => item.step === kitchen.step).length;
}

export type AddResult = 'added' | 'step-done' | 'wrong-ingredient' | 'not-now' | 'finished';

/** Adds one ingredient. Only the one the current step needs goes in, never more than it asks for. */
export function addIngredient(kitchen: Kitchen, id: string): { kitchen: Kitchen; result: AddResult } {
  const step = currentStep(kitchen);
  if (!step) return { kitchen, result: 'finished' };
  if (step.kind !== 'add') return { kitchen, result: 'not-now' };
  if (step.ingredient !== id) return { kitchen, result: 'wrong-ingredient' };
  const bowl = [...kitchen.bowl, { ingredient: id, step: kitchen.step }];
  const count = bowl.filter((item) => item.step === kitchen.step).length;
  if (count >= step.count) return { kitchen: { ...kitchen, bowl, step: kitchen.step + 1 }, result: 'step-done' };
  return { kitchen: { ...kitchen, bowl }, result: 'added' };
}

/** Takes the last ingredient of the current step back out. Finished steps stay finished. */
export function undoIngredient(kitchen: Kitchen): Kitchen {
  const index = kitchen.bowl.map((item) => item.step).lastIndexOf(kitchen.step);
  if (index < 0) return kitchen;
  return { ...kitchen, bowl: kitchen.bowl.filter((_, i) => i !== index) };
}

export function doAction(kitchen: Kitchen): { kitchen: Kitchen; ok: boolean } {
  const step = currentStep(kitchen);
  if (!step || step.kind !== 'action') return { kitchen, ok: false };
  return { kitchen: { ...kitchen, step: kitchen.step + 1 }, ok: true };
}

export function isCooked(kitchen: Kitchen): boolean {
  return kitchen.step >= kitchen.recipe.steps.length;
}

/** Ingredients on the counter. Beginners see what the recipe needs plus one extra. */
export function pantryFor(recipe: Recipe, guided: boolean): Ingredient[] {
  if (!guided) return ingredients;
  const needed = shoppingList(recipe).map((item) => item.ingredient);
  const extra = ingredients.find((item) => !needed.includes(item));
  return extra ? [...needed, extra] : needed;
}
