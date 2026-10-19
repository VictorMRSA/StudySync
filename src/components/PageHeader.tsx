import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /** Small uppercase label shown above the title */
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** Right-aligned actions (buttons, badges, etc.) */
  actions?: ReactNode;
  className?: string;
}

/**
 * Shared page header following the workspace design language:
 * uppercase eyebrow, bold compact title, muted subtitle, actions on the right.
 */
export const PageHeader = ({ eyebrow, title, description, icon, actions, className }: PageHeaderProps) => (
  <div className={cn("flex flex-col sm:flex-row sm:items-end justify-between gap-4", className)}>
    <div className="min-w-0">
      {eyebrow && (
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1 select-none">
          {eyebrow}
        </div>
      )}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
        {icon && <span className="text-foreground/80 [&_svg]:w-6 [&_svg]:h-6 shrink-0">{icon}</span>}
        <span className="truncate">{title}</span>
      </h1>
      {description && (
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">{description}</p>
      )}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

/** Standard page container used across workspace tabs. */
export const PageContainer = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6", className)}>{children}</div>
);

export default PageHeader;
