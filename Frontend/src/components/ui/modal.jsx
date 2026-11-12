import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "../../libs/util"

/**
 * Ventana modal accesible (foco atrapado, Escape para cerrar, aria correcto).
 *
 *   <Modal abierto={abierto} alCambiar={setAbierto} titulo="Nuevo servicio" descripcion="..."
 *          pie={<Button>Guardar</Button>}>
 *     ...formulario...
 *   </Modal>
 *
 * tamano: sm | md | lg | xl
 */
const anchos = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
}

export function Modal({ abierto, alCambiar, titulo, descripcion, tamano = "md", pie, children, className }) {
  return (
    <Dialog.Root open={abierto} onOpenChange={alCambiar}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1000] bg-foreground/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[1001] flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col",
            "rounded-xl border bg-card text-card-foreground shadow-elevated focus:outline-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            anchos[tamano] || anchos.md,
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
            <div className="min-w-0">
              <Dialog.Title className="font-display text-xl font-medium tracking-tight">{titulo}</Dialog.Title>
              {descripcion ? (
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">{descripcion}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{titulo}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="-mr-2 -mt-1 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Cerrar"
            >
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

          {pie && <div className="flex flex-wrap justify-end gap-2 border-t bg-muted/30 px-6 py-4">{pie}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default Modal
