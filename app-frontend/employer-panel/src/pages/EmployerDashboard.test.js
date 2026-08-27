import { fireEvent, render, screen } from "@testing-library/react";
import EmployerDashboard from "./EmployerDashboard";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {},
  }),
}));

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}));

describe("EmployerDashboard incident pinning", () => {
  beforeEach(() => {
    localStorage.clear();

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("pins and unpins an incident report", () => {
    render(<EmployerDashboard />);

    const pinButton = screen.getByRole("button", {
      name: "Pin incident INC-9921",
    });

    fireEvent.click(pinButton);

    expect(
      screen.getByRole("button", {
        name: "Unpin incident INC-9921",
      })
    ).toHaveAttribute("aria-pressed", "true");

    expect(screen.getByText("Pinned")).toBeInTheDocument();

    const storedPins = JSON.parse(
      localStorage.getItem(
        "secureshift:pinned-incidents:default"
      )
    );

    expect(storedPins).toContain("INC-9921");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Unpin incident INC-9921",
      })
    );

    expect(
      screen.getByRole("button", {
        name: "Pin incident INC-9921",
      })
    ).toHaveAttribute("aria-pressed", "false");

    const storedAfterUnpin = JSON.parse(
      localStorage.getItem(
        "secureshift:pinned-incidents:default"
      )
    );

    expect(storedAfterUnpin).not.toContain("INC-9921");
  });

  test("restores persisted pinned incidents", () => {
    localStorage.setItem(
      "secureshift:pinned-incidents:default",
      JSON.stringify(["INC-9920"])
    );

    render(<EmployerDashboard />);

    expect(
      screen.getByRole("button", {
        name: "Unpin incident INC-9920",
      })
    ).toHaveAttribute("aria-pressed", "true");
  });
});