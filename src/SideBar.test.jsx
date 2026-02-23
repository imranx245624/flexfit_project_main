import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Sidebar from "./SideBar.jsx";

jest.mock("./utils/auth", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

function renderSidebar(path = "/") {
  const setOpen = jest.fn();
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<Sidebar open={true} setOpen={setOpen} />} />
      </Routes>
    </MemoryRouter>
  );
  return { setOpen };
}

test("Flex Rankings link is present and has accessible label", () => {
  renderSidebar("/");
  const link = screen.getByRole("link", { name: /flex rankings/i });
  expect(link).toBeInTheDocument();
  expect(link).toHaveAttribute("href", "/leaderboard");
  expect(link).toHaveAttribute("title", "Flex Rankings");
});

test("Flex Rankings button has active class when on /leaderboard", () => {
  renderSidebar("/leaderboard");
  const link = screen.getByRole("link", { name: /flex rankings/i });
  const btn = link.querySelector("button");
  expect(btn).toHaveClass("active");
});

test("Flex Rankings button has no active class when on other route", () => {
  renderSidebar("/");
  const link = screen.getByRole("link", { name: /flex rankings/i });
  const btn = link.querySelector("button");
  expect(btn).not.toHaveClass("active");
});
