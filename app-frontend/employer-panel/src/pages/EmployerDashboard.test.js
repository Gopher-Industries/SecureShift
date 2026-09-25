import { fireEvent, render, screen } from "@testing-library/react";
import EmployerDashboard from "./EmployerDashboard";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock("../components/RefreshButton", () => {
  return function MockRefreshButton() {
    return <button type="button">Refresh</button>;
  };
});

describe("EmployerDashboard favourite incident reports", () => {
  beforeEach(() => {
    localStorage.clear();

    global.fetch = jest.fn((url) => {
      if (url.includes("/shifts/fatigue")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            dashboard: {
              guards: [],
              summary: {
                guardsMonitored: 0,
                fatiguedGuards: 0,
                averageFatigueScore: 0,
              },
            },
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("adds an incident report to favourites", () => {
    render(<EmployerDashboard />);

    const favouriteButton = screen.getByRole("button", {
      name: "Favourite incident INC-9921",
    });

    fireEvent.click(favouriteButton);

    expect(
      screen.getByRole("button", {
        name: "Unfavourite incident INC-9921",
      })
    ).toHaveAttribute("aria-pressed", "true");

    expect(screen.getByText("Favourite")).toBeInTheDocument();
  });

  test("removes an incident report from favourites", () => {
    render(<EmployerDashboard />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Favourite incident INC-9921",
      })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Unfavourite incident INC-9921",
      })
    );

    expect(
      screen.getByRole("button", {
        name: "Favourite incident INC-9921",
      })
    ).toHaveAttribute("aria-pressed", "false");
  });

  test("persists favourite state in localStorage", () => {
    render(<EmployerDashboard />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Favourite incident INC-9921",
      })
    );

    const storageKey = Object.keys(localStorage).find((key) =>
      key.startsWith("secureshift:favourite-incidents:")
    );

    expect(storageKey).toBeTruthy();

    const storedFavourites = JSON.parse(
      localStorage.getItem(storageKey)
    );

    expect(storedFavourites).toContain("INC-9921");
  });

  test("restores favourite state from localStorage", () => {
    localStorage.setItem(
      "secureshift:favourite-incidents:default",
      JSON.stringify(["INC-9920"])
    );

    render(<EmployerDashboard />);

    expect(
      screen.getByRole("button", {
        name: "Unfavourite incident INC-9920",
      })
    ).toHaveAttribute("aria-pressed", "true");
  });
});