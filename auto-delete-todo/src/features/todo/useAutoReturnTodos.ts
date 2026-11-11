import { useEffect, useReducer, useRef } from "react";
import { createInitialTodoState, todoReducer } from "./todoReducer";

export const AUTO_RETURN_DELAY_MS = 5000;

type TimerId = ReturnType<typeof setTimeout>;

export function useAutoReturnTodos() {
  const [state, dispatch] = useReducer(
    todoReducer,
    undefined,
    createInitialTodoState,
  );

  // Timer ids are never rendered, so they live in a ref to avoid re-renders.
  const timersByItemId = useRef(new Map<string, TimerId>());

  function cancelTimer(itemId: string) {
    const timerId = timersByItemId.current.get(itemId);
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timersByItemId.current.delete(itemId);
    }
  }

  function moveToCategory(itemId: string) {
    const isInMainList = state.mainList.some((item) => item.id === itemId);
    if (!isInMainList) {
      return;
    }

    // An item has at most one timer, so an older timer can never return it early.
    cancelTimer(itemId);
    dispatch({ type: "MOVE_TO_CATEGORY", itemId });

    const timerId = setTimeout(() => {
      timersByItemId.current.delete(itemId);
      dispatch({ type: "RETURN_TO_MAIN_LIST", itemId });
    }, AUTO_RETURN_DELAY_MS);
    timersByItemId.current.set(itemId, timerId);
  }

  function returnToMainList(itemId: string) {
    cancelTimer(itemId);
    dispatch({ type: "RETURN_TO_MAIN_LIST", itemId });
  }

  useEffect(() => {
    const timers = timersByItemId.current;

    return () => {
      for (const timerId of timers.values()) {
        clearTimeout(timerId);
      }
      timers.clear();
    };
  }, []);

  return {
    mainList: state.mainList,
    categories: state.categories,
    moveToCategory,
    returnToMainList,
  };
}
