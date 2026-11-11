import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders the page heading", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Auto Delete Todo List" }),
    ).toBeInTheDocument();
  });
});
