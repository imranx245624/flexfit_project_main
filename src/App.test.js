import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders home CTA", () => {
  render(<App />);
  expect(screen.getByRole("button", { name: /train with ai/i })).toBeInTheDocument();
});
