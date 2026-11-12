import { cn } from "../../libs/util"

export const Card = ({ className, children, ...props }) => (
  <div className={cn("rounded-xl border bg-card text-card-foreground shadow-soft", className)} {...props}>
    {children}
  </div>
)

export const CardHeader = ({ className, children, ...props }) => (
  <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props}>
    {children}
  </div>
)

export const CardTitle = ({ className, children, ...props }) => (
  <h3 className={cn("text-base font-semibold leading-tight tracking-tight", className)} {...props}>
    {children}
  </h3>
)

export const CardDescription = ({ className, children, ...props }) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props}>
    {children}
  </p>
)

export const CardContent = ({ className, children, ...props }) => (
  <div className={cn("p-6 pt-0", className)} {...props}>
    {children}
  </div>
)

export const CardFooter = ({ className, children, ...props }) => (
  <div className={cn("flex items-center gap-2 border-t px-6 py-4", className)} {...props}>
    {children}
  </div>
)
