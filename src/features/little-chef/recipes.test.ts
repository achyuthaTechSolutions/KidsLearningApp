import { describe, expect, it } from 'vitest';
import { illustrationFor } from '../../data/illustrations';
import {
  actions, addIngredient, addedThisStep, doAction, ingredientById, ingredients, isCooked, pantryFor, recipes, shoppingList, startCooking, stepText, undoIngredient,
} from './recipes';

const salad = recipes.find((recipe) => recipe.id === 'fruit-salad')!;

describe('Little Chef recipes', () => {
  it('uses known ingredients with bundled pictures and ends with an action', () => {
    expect(new Set(recipes.map((recipe) => recipe.id)).size).toBe(recipes.length);
    for (const item of ingredients) expect(illustrationFor(item.emoji), item.id).toBeTruthy();
    for (const action of Object.values(actions)) expect(illustrationFor(action.emoji)).toBeTruthy();
    for (const recipe of recipes) {
      expect(illustrationFor(recipe.emoji), recipe.id).toBeTruthy();
      expect(recipe.steps[recipe.steps.length - 1].kind).toBe('action');
      for (const step of recipe.steps) if (step.kind === 'add') {
        expect(() => ingredientById(step.ingredient)).not.toThrow();
        expect(step.count).toBeGreaterThan(0);
        expect(step.count).toBeLessThanOrEqual(5);
      }
    }
  });

  it('says the same numbers the recipe uses', () => {
    expect(salad.steps.map(stepText)).toEqual(['Add one apple.', 'Add two bananas.', 'Add three strawberries.', 'Mix it all together with a big spoon!']);
    expect(shoppingList(recipes.find((recipe) => recipe.id === 'banana-sandwich')!)).toEqual([
      { ingredient: ingredientById('bread'), count: 2 },
      { ingredient: ingredientById('banana'), count: 1 },
    ]);
  });

  it('never asks for real cutting, heat, or appliances', () => {
    const text = recipes.flatMap((recipe) => recipe.steps.map(stepText)).join(' ').toLowerCase();
    for (const word of ['knife', 'cut', 'oven', 'stove', 'hot', 'boil', 'fry', 'blender']) expect(text).not.toContain(word);
  });
});

describe('Cooking', () => {
  it('follows the steps in order and finishes the recipe', () => {
    let kitchen = startCooking(salad);
    expect(addIngredient(kitchen, 'banana').result).toBe('wrong-ingredient');
    let outcome = addIngredient(kitchen, 'apple');
    expect(outcome.result).toBe('step-done');
    kitchen = outcome.kitchen;
    outcome = addIngredient(kitchen, 'banana');
    expect(outcome.result).toBe('added');
    expect(addedThisStep(outcome.kitchen)).toBe(1);
    kitchen = addIngredient(outcome.kitchen, 'banana').kitchen;
    for (let i = 0; i < 3; i += 1) kitchen = addIngredient(kitchen, 'strawberry').kitchen;
    expect(addIngredient(kitchen, 'strawberry').result).toBe('not-now');
    expect(isCooked(kitchen)).toBe(false);
    const mixed = doAction(kitchen);
    expect(mixed.ok).toBe(true);
    expect(isCooked(mixed.kitchen)).toBe(true);
    expect(mixed.kitchen.bowl).toHaveLength(6);
    expect(addIngredient(mixed.kitchen, 'apple').result).toBe('finished');
  });

  it('will not do an action before the ingredients are in', () => {
    expect(doAction(startCooking(salad)).ok).toBe(false);
  });

  it('undo removes only from the current step', () => {
    let kitchen = addIngredient(startCooking(salad), 'apple').kitchen;
    expect(undoIngredient(kitchen)).toEqual(kitchen);
    kitchen = addIngredient(kitchen, 'banana').kitchen;
    kitchen = undoIngredient(kitchen);
    expect(addedThisStep(kitchen)).toBe(0);
    expect(kitchen.bowl).toHaveLength(1);
  });

  it('gives beginners a small pantry with everything needed', () => {
    for (const recipe of recipes) {
      const pantry = pantryFor(recipe, true);
      for (const { ingredient } of shoppingList(recipe)) expect(pantry).toContain(ingredient);
      expect(pantry.length).toBe(shoppingList(recipe).length + 1);
    }
  });
});
