// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchableCreatableSelect } from "@/components/shared/SearchableCreatableSelect";

function renderSelect(
  overrides: Partial<
    React.ComponentProps<typeof SearchableCreatableSelect>
  > = {},
) {
  const onChange = vi.fn();
  const onCreate = vi.fn();
  render(
    <SearchableCreatableSelect
      value="A"
      options={["A", "B", "C", "D", "E", "F"]}
      onChange={onChange}
      onCreate={onCreate}
      ariaLabel="State"
      createLabel={(value) => `+ "${value}" create`}
      emptyCreateLabel="Create new state"
      notFoundLabel="Nothing found"
      searchPlaceholder="Search..."
      testId="state-select"
      {...overrides}
    />,
  );
  return { onChange, onCreate };
}

describe("SearchableCreatableSelect", () => {
  it("keeps a fixed create action below a scrollable result list", () => {
    renderSelect();
    fireEvent.click(screen.getByTestId("state-select"));

    expect(screen.getByTestId("state-select-options")).toHaveClass(
      "overflow-y-auto",
      "max-h-[180px]",
    );
    expect(screen.getByTestId("state-select-create")).toBeVisible();
    expect(screen.getByTestId("state-select-create")).toBeEnabled();
  });

  it("creates with an empty query through the always-active footer", () => {
    const { onCreate } = renderSelect();
    fireEvent.click(screen.getByTestId("state-select"));

    fireEvent.pointerDown(screen.getByTestId("state-select-create"));

    expect(onCreate).toHaveBeenCalledWith("");
  });

  it("creates a unique query with Enter and returns focus to the trigger", async () => {
    const { onCreate } = renderSelect();
    const trigger = screen.getByTestId("state-select");
    fireEvent.click(trigger);
    const search = screen.getByTestId("state-select-search");
    fireEvent.change(search, { target: { value: "NEW" } });

    expect(screen.getByTestId("state-select-create")).toHaveTextContent(
      '+ "NEW" create',
    );
    fireEvent.keyDown(search, { key: "Enter" });

    expect(onCreate).toHaveBeenCalledWith("NEW");
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("selects results with the arrow keys and Enter", () => {
    const { onChange } = renderSelect();
    fireEvent.click(screen.getByTestId("state-select"));
    const search = screen.getByTestId("state-select-search");

    fireEvent.keyDown(search, { key: "ArrowDown" });
    fireEvent.keyDown(search, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith("B");
  });

  it("does not create an existing value and closes with Escape", async () => {
    const { onCreate } = renderSelect();
    const trigger = screen.getByTestId("state-select");
    fireEvent.click(trigger);
    const search = screen.getByTestId("state-select-search");
    fireEvent.change(search, { target: { value: "a" } });

    expect(screen.getByTestId("state-select-create")).toBeDisabled();
    fireEvent.keyDown(search, { key: "Enter" });
    expect(onCreate).not.toHaveBeenCalled();

    fireEvent.keyDown(search, { key: "Escape" });
    expect(screen.queryByTestId("state-select-search")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
