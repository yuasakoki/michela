import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", asChild = false, isLoading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95",
          // Variants
          variant === "primary" && 
            "bg-blue-600 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-500 hover:shadow-blue-500/30 hover:-translate-y-0.5 border border-blue-500/20",
          variant === "secondary" && 
            "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700 hover:border-slate-600",
          variant === "danger" && 
            "bg-red-900/50 text-red-200 hover:bg-red-900/80 border border-red-900/50",
          variant === "ghost" && 
            "hover:bg-slate-800/50 text-slate-300 hover:text-white",
          variant === "link" && 
            "text-blue-400 underline-offset-4 hover:underline",
            
          // Sizes
          size === "default" && "h-11 px-6 py-2",
          size === "sm" && "h-9 rounded-lg px-3",
          size === "lg" && "h-14 rounded-2xl px-10 text-base",
          size === "icon" && "h-10 w-10",
          
          className
        )}
        ref={ref}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Wait...
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button };
