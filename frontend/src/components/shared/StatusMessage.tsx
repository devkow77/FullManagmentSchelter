import type { LucideIcon } from "lucide-react";
import { CircleAlert, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const VARIANT_STYLES = {
  error: {
    role: "alert" as const,
    box: "border-red-200 bg-red-50",
    icon: "text-red-600",
    title: "text-red-900",
    description: "text-red-800",
    Icon: CircleAlert,
  },
  info: {
    role: "status" as const,
    box: "border-blue-200 bg-blue-50",
    icon: "text-blue-600",
    title: "text-blue-900",
    description: "text-blue-800",
    Icon: Info,
  },
  success: {
    role: "status" as const,
    box: "border-green-200 bg-green-50",
    icon: "text-green-600",
    title: "text-green-900",
    description: "text-green-800",
    Icon: Info,
  },
};

export type StatusMessageProps = {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  children?: ReactNode;
  className?: string;
};

type StatusMessageBaseProps = StatusMessageProps & {
  variant: keyof typeof VARIANT_STYLES;
};

const StatusMessage = ({
  variant,
  title,
  description,
  icon: CustomIcon,
  children,
  className,
}: StatusMessageBaseProps) => {
  const styles = VARIANT_STYLES[variant];
  const Icon = CustomIcon ?? styles.Icon;

  return (
    <div
      role={styles.role}
      className={cn(
        "col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border px-6 py-12 text-center",
        styles.box,
        className,
      )}
    >
      <Icon className={cn("size-12", styles.icon)} aria-hidden="true" />
      <div className="space-y-2">
        <p className={cn("text-lg font-semibold md:text-xl", styles.title)}>
          {title}
        </p>
        {description != null && description !== "" && (
          <p
            className={cn("max-w-md text-sm md:text-base", styles.description)}
          >
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
};

export const ErrorState = (props: StatusMessageProps) => (
  <StatusMessage variant="error" {...props} />
);

export const InfoState = (props: StatusMessageProps) => (
  <StatusMessage variant="info" {...props} />
);

export const EmptyState = ({
  variant = "info",
  ...props
}: StatusMessageProps & { variant?: "info" | "success" }) => (
  <StatusMessage variant={variant} {...props} />
);

export default StatusMessage;
