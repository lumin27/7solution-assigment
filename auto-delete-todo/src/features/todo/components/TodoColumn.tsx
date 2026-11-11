import { useEffect, useId, useRef } from "react";
import type { TodoItem } from "../types";

type TodoColumnProps = {
  title: string;
  items: TodoItem[];
  getItemLabel: (item: TodoItem) => string;
  onItemClick: (itemId: string) => void;
  /** Number of item slots to reserve, so the column height stays fixed as items move. */
  reservedItemCount: number;
};

// Must match the `min-h-11` button and `gap-2` list classes below.
const ITEM_MIN_HEIGHT_REM = 2.75;
const ITEM_GAP_REM = 0.5;

function getListMinHeight(itemCount: number): string {
  const gapCount = Math.max(itemCount - 1, 0);
  return `${itemCount * ITEM_MIN_HEIGHT_REM + gapCount * ITEM_GAP_REM}rem`;
}

export function TodoColumn({
  title,
  items,
  getItemLabel,
  onItemClick,
  reservedItemCount,
}: TodoColumnProps) {
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const clickedItemIndex = useRef<number | null>(null);

  // A clicked item leaves this column, which would drop keyboard focus onto <body>.
  // Focus the item that took its place, or the heading if the column is now empty.
  // Items removed by a timer are ignored, so focus is never moved unexpectedly.
  useEffect(() => {
    const index = clickedItemIndex.current;
    if (index === null) {
      return;
    }
    clickedItemIndex.current = null;

    const buttons = listRef.current?.querySelectorAll("button") ?? [];
    const nextButton = buttons[Math.min(index, buttons.length - 1)];
    if (nextButton) {
      nextButton.focus();
    } else {
      headingRef.current?.focus();
    }
  }, [items]);

  function handleItemClick(itemId: string, index: number) {
    clickedItemIndex.current = index;
    onItemClick(itemId);
  }

  return (
    <section
      aria-labelledby={headingId}
      className='flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm sm:p-3'>
      <h2
        id={headingId}
        ref={headingRef}
        tabIndex={-1}
        className='mb-2 text-base font-semibold focus:outline-none sm:mb-3 sm:text-lg text-center bg-gray-300 p-1.5 rounded-md'>
        {title}
      </h2>

      <div style={{ minHeight: getListMinHeight(reservedItemCount) }}>
        {items.length === 0 ? (
          <p className='text-sm text-slate-500'>No items</p>
        ) : (
          <ul ref={listRef} className='flex flex-col gap-2'>
            {items.map((item, index) => (
              <li key={item.id}>
                <button
                  type='button'
                  aria-label={getItemLabel(item)}
                  onClick={() => handleItemClick(item.id, index)}
                  className='min-h-11 w-full rounded-md border border-slate-300 px-1.5 py-2 text-left text-sm wrap-break-word hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:px-3 sm:text-base'>
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
