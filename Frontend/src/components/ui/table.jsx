import { cn } from "../../libs/util"

// Contenedor con borde y esquinas redondeadas; desplaza horizontalmente en pantallas pequeñas
export const Table = ({ className, contenedor, ...props }) => (
  <div className={cn("w-full overflow-x-auto rounded-xl border bg-card shadow-soft", contenedor)}>
    <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </div>
)

export const TableHeader = ({ className, ...props }) => (
  <thead className={cn("bg-muted/60 [&_tr]:border-b", className)} {...props} />
)

export const TableBody = ({ className, ...props }) => (
  <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
)

export const TableFooter = ({ className, ...props }) => (
  <tfoot className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
)

export const TableRow = ({ className, ...props }) => (
  <tr
    className={cn("border-b transition-colors hover:bg-accent/40 data-[state=selected]:bg-accent", className)}
    {...props}
  />
)

export const TableHead = ({ className, ...props }) => (
  <th
    className={cn(
      "h-11 whitespace-nowrap px-4 text-left align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground",
      className,
    )}
    {...props}
  />
)

export const TableCell = ({ className, ...props }) => (
  <td className={cn("px-4 py-3 align-middle", className)} {...props} />
)

export const TableCaption = ({ className, ...props }) => (
  <caption className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
)
