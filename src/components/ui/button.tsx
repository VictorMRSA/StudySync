import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-border/70 bg-background text-foreground hover:bg-neutral-50 dark:hover:bg-neutral-800/60",
        secondary: "bg-neutral-100 text-foreground hover:bg-neutral-200/70 dark:bg-neutral-800 dark:hover:bg-neutral-700",
        ghost: "text-muted-foreground hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-[#059669] text-white shadow-sm hover:bg-[#047857]",
        streak: "bg-[#D97706] text-white shadow-sm hover:bg-[#B45309]",
        xp: "bg-[#7C3AED] text-white shadow-sm hover:bg-[#6D28D9]",
        gamified: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-10 rounded-lg px-5",
        icon: "h-10 w-10",
        xl: "h-14 rounded-lg px-10 text-lg font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
