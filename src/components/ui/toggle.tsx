import * as React from "react";
import { cn } from "../../utils";

export interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, pressed, onPressedChange, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={pressed}
        data-state={pressed ? "on" : "off"}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-black data-[state=on]:text-white",
          className
        )}
        onClick={() => onPressedChange?.(!pressed)}
        {...props}
      />
    );
  }
);
Toggle.displayName = "Toggle";

export { Toggle };