import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RequireAuth from "./RequireAuth";
import { useAuth } from "../utils/auth";

jest.mock("../utils/auth", () => ({
  useAuth: jest.fn(),
}));

test("shows gate when user is not signed in", () => {
  useAuth.mockReturnValue({ user: null, loading: false });
  render(
    <MemoryRouter>
      <RequireAuth>
        <div>Secret</div>
      </RequireAuth>
    </MemoryRouter>
  );
  expect(screen.getByText(/sign in required/i)).toBeInTheDocument();
});

test("renders children when user is signed in", () => {
  useAuth.mockReturnValue({ user: { id: "1" }, loading: false });
  render(
    <MemoryRouter>
      <RequireAuth>
        <div>Secret</div>
      </RequireAuth>
    </MemoryRouter>
  );
  expect(screen.getByText("Secret")).toBeInTheDocument();
});
