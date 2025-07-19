import { cn } from "@/lib/utils";

export interface ButtonProps {
  /** Is this the principal call to action on the page? */
  primary?: boolean;
  /** What background color to use */
  backgroundColor?: string;
  /** How large should the button be? */
  size?: "small" | "medium" | "large";
  /** Button contents */
  label: string;
  /** Optional click handler */
  onClick?: () => void;
}

/** Primary UI component for user interaction */
export const Button = ({
  primary = false,
  size = "medium",
  backgroundColor,
  label,
  ...props
}: ButtonProps) => {
  // Base styles
  const baseClasses =
    "inline-flex items-center justify-center font-bold rounded-full cursor-pointer border-0 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  // Variant styles
  const variantClasses = primary
    ? "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary"
    : "bg-transparent text-gray-700 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)] hover:bg-gray-100 focus:ring-gray-400";

  // Size styles
  const sizeClasses = {
    small: "px-4 py-2.5 text-xs",
    medium: "px-5 py-3 text-sm",
    large: "px-6 py-3 text-base",
  };

  return (
    <button
      type="button"
      className={cn(baseClasses, variantClasses, sizeClasses[size])}
      style={backgroundColor ? { backgroundColor } : undefined}
      {...props}
    >
      {label}
    </button>
  );
};
