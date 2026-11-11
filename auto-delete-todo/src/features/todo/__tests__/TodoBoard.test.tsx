import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TodoBoard } from "../components/TodoBoard";

function getItemNamesInColumn(columnName: string): string[] {
  const column = screen.getByRole("region", { name: columnName });
  return within(column)
    .queryAllByRole("button")
    .map((button) => button.textContent ?? "");
}

describe("TodoBoard", () => {
  it("shows three columns with all items in the Main List", () => {
    render(<TodoBoard />);

    expect(screen.getByRole("heading", { name: "Main List" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fruit" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Vegetable" })).toBeInTheDocument();
    expect(getItemNamesInColumn("Main List")).toHaveLength(11);
    expect(getItemNamesInColumn("Fruit")).toEqual([]);
    expect(getItemNamesInColumn("Vegetable")).toEqual([]);
  });

  it("moves clicked items to their matching category column", async () => {
    const user = userEvent.setup();
    render(<TodoBoard />);

    await user.click(screen.getByRole("button", { name: "Move Apple to Fruit" }));
    await user.click(
      screen.getByRole("button", { name: "Move Broccoli to Vegetable" }),
    );

    expect(getItemNamesInColumn("Fruit")).toEqual(["Apple"]);
    expect(getItemNamesInColumn("Vegetable")).toEqual(["Broccoli"]);
    expect(getItemNamesInColumn("Main List")).not.toContain("Apple");
    expect(getItemNamesInColumn("Main List")).not.toContain("Broccoli");
  });

  // user-event waits on a real setTimeout after each action, which never fires
  // under Vitest fake timers, so these tests click with the synchronous fireEvent.
  describe("auto-return timers", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function clickButton(name: string) {
      fireEvent.click(screen.getByRole("button", { name }));
    }

    function advanceTime(milliseconds: number) {
      act(() => {
        vi.advanceTimersByTime(milliseconds);
      });
    }

    // jsdom queues a 0 ms "selectionchange" timer whenever focus moves.
    // Run those first so the count only includes the auto-return timers.
    function countPendingAutoReturnTimers(): number {
      advanceTime(0);
      return vi.getTimerCount();
    }

    it("keeps an item in its category for 4,999 ms and returns it to the bottom at 5,000 ms", () => {
      render(<TodoBoard />);

      clickButton("Move Apple to Fruit");

      advanceTime(4999);
      expect(getItemNamesInColumn("Fruit")).toEqual(["Apple"]);

      advanceTime(1);
      expect(getItemNamesInColumn("Fruit")).toEqual([]);
      expect(getItemNamesInColumn("Main List").at(-1)).toBe("Apple");
    });

    it("gives each item its own independent timer", () => {
      render(<TodoBoard />);

      clickButton("Move Apple to Fruit");
      advanceTime(2000);
      clickButton("Move Broccoli to Vegetable");

      advanceTime(3000);
      expect(getItemNamesInColumn("Fruit")).toEqual([]);
      expect(getItemNamesInColumn("Vegetable")).toEqual(["Broccoli"]);

      advanceTime(2000);
      expect(getItemNamesInColumn("Vegetable")).toEqual([]);
      expect(getItemNamesInColumn("Main List").slice(-2)).toEqual([
        "Apple",
        "Broccoli",
      ]);
    });

    it("returns an item immediately when clicked in its category and cancels its timer", () => {
      render(<TodoBoard />);

      clickButton("Move Apple to Fruit");
      advanceTime(1000);
      clickButton("Return Apple to Main List");

      expect(getItemNamesInColumn("Fruit")).toEqual([]);
      expect(getItemNamesInColumn("Main List").at(-1)).toBe("Apple");
      expect(countPendingAutoReturnTimers()).toBe(0);

      advanceTime(10_000);
      const mainList = getItemNamesInColumn("Main List");
      expect(mainList.filter((name) => name === "Apple")).toHaveLength(1);
      expect(mainList).toHaveLength(11);
    });

    it("starts a fresh 5,000 ms timer when an item is moved again", () => {
      render(<TodoBoard />);

      clickButton("Move Apple to Fruit");
      advanceTime(3000);
      clickButton("Return Apple to Main List");
      clickButton("Move Apple to Fruit");

      // The first timer would have fired here if it had not been cancelled.
      advanceTime(2000);
      expect(getItemNamesInColumn("Fruit")).toEqual(["Apple"]);

      advanceTime(2999);
      expect(getItemNamesInColumn("Fruit")).toEqual(["Apple"]);

      advanceTime(1);
      expect(getItemNamesInColumn("Fruit")).toEqual([]);
      expect(getItemNamesInColumn("Main List").at(-1)).toBe("Apple");
    });

    it("clears all active timers when the board unmounts", () => {
      const { unmount } = render(<TodoBoard />);

      clickButton("Move Apple to Fruit");
      clickButton("Move Broccoli to Vegetable");
      expect(countPendingAutoReturnTimers()).toBe(2);

      unmount();

      expect(countPendingAutoReturnTimers()).toBe(0);
    });
  });

  describe("keyboard support", () => {
    it("moves an item with the Enter key and keeps focus in the Main List", async () => {
      const user = userEvent.setup();
      render(<TodoBoard />);

      await user.tab();
      expect(
        screen.getByRole("button", { name: "Move Apple to Fruit" }),
      ).toHaveFocus();

      await user.keyboard("{Enter}");

      expect(getItemNamesInColumn("Fruit")).toEqual(["Apple"]);
      expect(
        screen.getByRole("button", { name: "Move Broccoli to Vegetable" }),
      ).toHaveFocus();
    });

    it("moves focus to the column heading when its last item is returned", async () => {
      const user = userEvent.setup();
      render(<TodoBoard />);

      await user.click(screen.getByRole("button", { name: "Move Apple to Fruit" }));
      screen.getByRole("button", { name: "Return Apple to Main List" }).focus();
      await user.keyboard(" ");

      expect(getItemNamesInColumn("Fruit")).toEqual([]);
      expect(screen.getByRole("heading", { name: "Fruit" })).toHaveFocus();
    });
  });
});
