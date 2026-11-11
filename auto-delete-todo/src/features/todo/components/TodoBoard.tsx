"use client";

import { initialTodoItems } from "../initialTodoItems";
import type { TodoItem } from "../types";
import { useAutoReturnTodos } from "../useAutoReturnTodos";
import { TodoColumn } from "./TodoColumn";

const totalItemCount = initialTodoItems.length;

function getMoveLabel(item: TodoItem): string {
  return `Move ${item.name} to ${item.type}`;
}

function getReturnLabel(item: TodoItem): string {
  return `Return ${item.name} to Main List`;
}

export function TodoBoard() {
  const { mainList, categories, moveToCategory, returnToMainList } =
    useAutoReturnTodos();

  return (
    <div className='grid grid-cols-3 gap-2 sm:gap-4'>
      <TodoColumn
        title='Main List'
        items={mainList}
        getItemLabel={getMoveLabel}
        onItemClick={moveToCategory}
        reservedItemCount={totalItemCount}
      />
      <TodoColumn
        title='Fruit'
        items={categories.Fruit}
        getItemLabel={getReturnLabel}
        onItemClick={returnToMainList}
        reservedItemCount={totalItemCount}
      />
      <TodoColumn
        title='Vegetable'
        items={categories.Vegetable}
        getItemLabel={getReturnLabel}
        onItemClick={returnToMainList}
        reservedItemCount={totalItemCount}
      />
    </div>
  );
}
