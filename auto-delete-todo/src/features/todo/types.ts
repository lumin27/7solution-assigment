export type TodoCategory = "Fruit" | "Vegetable";

export type TodoItem = {
  id: string;
  type: TodoCategory;
  name: string;
};

export type TodoState = {
  mainList: TodoItem[];
  categories: Record<TodoCategory, TodoItem[]>;
};

export type TodoAction =
  | { type: "MOVE_TO_CATEGORY"; itemId: string }
  | { type: "RETURN_TO_MAIN_LIST"; itemId: string };
