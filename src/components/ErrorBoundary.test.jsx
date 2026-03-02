import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ErrorBoundary from "./ErrorBoundary";

function Boom() {
  throw new Error("boom");
}

test("renders fallback UI on error", () => {
  render(
    <MemoryRouter>
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    </MemoryRouter>
  );
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
