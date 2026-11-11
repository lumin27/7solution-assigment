import { describe, expect, it } from "vitest";
import { createInitialTodoState, todoReducer } from "../todoReducer";
import type { TodoState } from "../types";

function getNames(items: TodoState["mainList"]): string[] {
  return items.map((item) => item.name);
}

describe("createInitialTodoState", () => {
  it("puts the 11 assignment items in the Main List, in the original order", () => {
    const state = createInitialTodoState();

    expect(state.mainList.map(({ type, name }) => ({ type, name }))).toEqual([
      { type: "Fruit", name: "Apple" },
      { type: "Vegetable", name: "Broccoli" },
      { type: "Vegetable", name: "Mushroom" },
      { type: "Fruit", name: "Banana" },
      { type: "Vegetable", name: "Tomato" },
      { type: "Fruit", name: "Orange" },
      { type: "Fruit", name: "Mango" },
      { type: "Fruit", name: "Pineapple" },
      { type: "Vegetable", name: "Cucumber" },
      { type: "Fruit", name: "Watermelon" },
      { type: "Vegetable", name: "Carrot" },
    ]);
    expect(state.categories).toEqual({ Fruit: [], Vegetable: [] });
  });

  it("gives every item a unique id", () => {
    const ids = createInitialTodoState().mainList.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("todoReducer", () => {
  describe("MOVE_TO_CATEGORY", () => {
    it("moves a fruit from the Main List to the Fruit column", () => {
      const state = todoReducer(createInitialTodoState(), {
        type: "MOVE_TO_CATEGORY",
        itemId: "apple",
      });

      expect(getNames(state.mainList)).not.toContain("Apple");
      expect(getNames(state.categories.Fruit)).toEqual(["Apple"]);
      expect(state.categories.Vegetable).toEqual([]);
    });

    it("moves a vegetable from the Main List to the Vegetable column", () => {
      const state = todoReducer(createInitialTodoState(), {
        type: "MOVE_TO_CATEGORY",
        itemId: "broccoli",
      });

      expect(getNames(state.mainList)).not.toContain("Broccoli");
      expect(getNames(state.categories.Vegetable)).toEqual(["Broccoli"]);
      expect(state.categories.Fruit).toEqual([]);
    });

    it("adds moved items to the bottom of their category, in click order", () => {
      let state = createInitialTodoState();
      state = todoReducer(state, { type: "MOVE_TO_CATEGORY", itemId: "mango" });
      state = todoReducer(state, { type: "MOVE_TO_CATEGORY", itemId: "apple" });

      expect(getNames(state.categories.Fruit)).toEqual(["Mango", "Apple"]);
    });

    it("does not mutate the previous state", () => {
      const previousState = createInitialTodoState();
      const snapshot = structuredClone(previousState);

      todoReducer(previousState, { type: "MOVE_TO_CATEGORY", itemId: "apple" });

      expect(previousState).toEqual(snapshot);
    });
  });

  describe("RETURN_TO_MAIN_LIST", () => {
    it("removes the item from its category and appends it to the bottom of the Main List", () => {
      let state = createInitialTodoState();
      state = todoReducer(state, { type: "MOVE_TO_CATEGORY", itemId: "apple" });
      state = todoReducer(state, { type: "RETURN_TO_MAIN_LIST", itemId: "apple" });

      expect(state.categories.Fruit).toEqual([]);
      expect(state.mainList).toHaveLength(11);
      expect(getNames(state.mainList).at(-1)).toBe("Apple");
    });

    it("appends returned items in the order they are returned", () => {
      let state = createInitialTodoState();
      state = todoReducer(state, { type: "MOVE_TO_CATEGORY", itemId: "apple" });
      state = todoReducer(state, { type: "MOVE_TO_CATEGORY", itemId: "broccoli" });
      state = todoReducer(state, { type: "RETURN_TO_MAIN_LIST", itemId: "broccoli" });
      state = todoReducer(state, { type: "RETURN_TO_MAIN_LIST", itemId: "apple" });

      expect(getNames(state.mainList).slice(-2)).toEqual(["Broccoli", "Apple"]);
    });
  });

  describe("invalid actions", () => {
    it("returns the same state for an unknown item id", () => {
      const state = createInitialTodoState();

      expect(
        todoReducer(state, { type: "MOVE_TO_CATEGORY", itemId: "unknown" }),
      ).toBe(state);
      expect(
        todoReducer(state, { type: "RETURN_TO_MAIN_LIST", itemId: "unknown" }),
      ).toBe(state);
    });

    it("ignores moving an item that is already in a category", () => {
      const movedState = todoReducer(createInitialTodoState(), {
        type: "MOVE_TO_CATEGORY",
        itemId: "apple",
      });

      const nextState = todoReducer(movedState, {
        type: "MOVE_TO_CATEGORY",
        itemId: "apple",
      });

      expect(nextState).toBe(movedState);
      expect(getNames(nextState.categories.Fruit)).toEqual(["Apple"]);
    });

    it("ignores returning an item that is already in the Main List", () => {
      const state = createInitialTodoState();

      const nextState = todoReducer(state, {
        type: "RETURN_TO_MAIN_LIST",
        itemId: "apple",
      });

      expect(nextState).toBe(state);
      expect(getNames(nextState.mainList).filter((name) => name === "Apple")).toHaveLength(1);
    });
  });
});
