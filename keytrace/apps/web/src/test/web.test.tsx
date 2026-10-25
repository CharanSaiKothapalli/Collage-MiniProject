import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "../components/ui/Button.js";
import { Badge, DecisionBadge } from "../components/ui/Badge.js";
import { Card, CardTitle } from "../components/ui/Card.js";
import { Input } from "../components/ui/Input.js";
import { KeystrokeCaptureField } from "../components/keystroke/KeystrokeCaptureField.js";
import { VERIFICATION_DECISION } from "@keytrace/shared";

describe("KEYTRACE Frontend Component Test Suite", () => {
  describe("Button Component", () => {
    it("renders button label and handles click events", () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Authenticate</Button>);

      const btn = screen.getByRole("button", { name: /Authenticate/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("disables button when disabled or loading", () => {
      render(
        <Button disabled isLoading>
          Processing
        </Button>
      );
      const btn = screen.getByRole("button", { name: /Processing/i });
      expect(btn).toBeDisabled();
    });
  });

  describe("Badge & Decision Badge", () => {
    it("renders PATTERN MATCH badge on MATCH decision", () => {
      render(<DecisionBadge decision={VERIFICATION_DECISION.MATCH} />);
      expect(screen.getByText(/PATTERN MATCH/i)).toBeInTheDocument();
    });

    it("renders NEEDS REVIEW badge on REVIEW decision", () => {
      render(<DecisionBadge decision={VERIFICATION_DECISION.REVIEW} />);
      expect(screen.getByText(/NEEDS REVIEW/i)).toBeInTheDocument();
    });

    it("renders INSUFFICIENT DATA badge", () => {
      render(<DecisionBadge decision={VERIFICATION_DECISION.INSUFFICIENT_DATA} />);
      expect(screen.getByText(/INSUFFICIENT DATA/i)).toBeInTheDocument();
    });
  });

  describe("Card Component", () => {
    it("renders card structure with title and children", () => {
      render(
        <Card elevated>
          <CardTitle>Keystroke Telemetry</CardTitle>
          <p>Real-time analytics body</p>
        </Card>
      );
      expect(screen.getByText("Keystroke Telemetry")).toBeInTheDocument();
      expect(screen.getByText("Real-time analytics body")).toBeInTheDocument();
    });
  });

  describe("Input Component", () => {
    it("renders label, placeholder, and helper text", () => {
      render(
        <Input
          label="Typing Velocity"
          name="velocity"
          placeholder="e.g. 5.2"
          helperText="Calculated in characters per second"
        />
      );
      expect(screen.getByLabelText("Typing Velocity")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g. 5.2")).toBeInTheDocument();
      expect(screen.getByText("Calculated in characters per second")).toBeInTheDocument();
    });

    it("renders error state when error prop is provided", () => {
      render(<Input label="Password" name="pwd" error="Password must be at least 8 characters" />);
      expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
    });
  });

  describe("KeystrokeCaptureField Component", () => {
    it("renders target prompt and typing input textarea", () => {
      const handleComplete = vi.fn();
      render(
        <KeystrokeCaptureField
          targetPromptText="Test sentence for biometric telemetry."
          onSessionComplete={handleComplete}
        />
      );

      expect(screen.getByText("Test sentence for biometric telemetry.")).toBeInTheDocument();
      const textarea = screen.getByPlaceholderText(/Click here and type the prompt above/i);
      expect(textarea).toBeInTheDocument();
    });

    it("warns when pasted text is detected to prevent synthetic text injection", () => {
      const handleComplete = vi.fn();
      render(<KeystrokeCaptureField onSessionComplete={handleComplete} />);

      const textarea = screen.getByPlaceholderText(/Click here and type the prompt above/i);
      fireEvent.paste(textarea, {
        clipboardData: { getData: () => "Synthetic paste input" },
      });

      expect(
        screen.getByText(/Pasting is disallowed. Behavioural dynamics requires physical keystroke transitions./i)
      ).toBeInTheDocument();
    });
  });
});
