import { initialTodoItems } from "./initialTodoItems";
import type { TodoAction, TodoItem, TodoState } from "./types";

export function createInitialTodoState(): TodoState {
  return {
    mainList: [...initialTodoItems],
    categories: { Fruit: [], Vegetable: [] },
  };
}

// An action for an item that is not where the action expects returns the same
// state, so a stale timer or a repeated click can never duplicate an item.
export function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case "MOVE_TO_CATEGORY":
      return moveToCategory(state, action.itemId);
    case "RETURN_TO_MAIN_LIST":
      return returnToMainList(state, action.itemId);
  }
}

function moveToCategory(state: TodoState, itemId: string): TodoState {
  const item = state.mainList.find((mainItem) => mainItem.id === itemId);
  if (!item) {
    return state;
  }

  return {
    mainList: state.mainList.filter((mainItem) => mainItem.id !== itemId),
    categories: {
      ...state.categories,
      [item.type]: [...state.categories[item.type], item],
    },
  };
}

function returnToMainList(state: TodoState, itemId: string): TodoState {
  const item = findItemInCategories(state, itemId);
  if (!item) {
    return state;
  }

  return {
    mainList: [...state.mainList, item],
    categories: {
      ...state.categories,
      [item.type]: state.categories[item.type].filter(
        (categoryItem) => categoryItem.id !== itemId,
      ),
    },
  };
}

function findItemInCategories(
  state: TodoState,
  itemId: string,
): TodoItem | undefined {
  const allCategoryItems = [
    ...state.categories.Fruit,
    ...state.categories.Vegetable,
  ];
  return allCategoryItems.find((categoryItem) => categoryItem.id === itemId);
}
