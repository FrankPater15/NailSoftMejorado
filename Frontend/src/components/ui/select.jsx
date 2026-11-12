import { forwardRef } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../libs/util"

// Select nativo (accesible y usable en móvil) con el estilo de los campos
export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "h-10 w-full appearance-none rounded-md border border-input bg-card pl-3 pr-9 text-sm text-foreground shadow-xs",
          "transition-[border-color,box-shadow] duration-150 hover:border-foreground/25",
          "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20",
          "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70 aria-[invalid=true]:border-destructive",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  )
})

export const SelectItem = ({ className, children, ...props }) => (
  <option className={className} {...props}>
    {children}
  </option>
)

export default Select
