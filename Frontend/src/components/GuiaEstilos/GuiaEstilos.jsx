import { useState } from "react"
import Swal from "sweetalert2"
import { CalendarDays, Moon, Plus, Scissors, Sun, TrendingUp, Users, Wallet } from "lucide-react"
import Logo, { LogoSimbolo } from "../marca/Logo"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Campo, Input, Textarea } from "../ui/input"
import { Select } from "../ui/select"
import { Modal } from "../ui/modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Cargando, EncabezadoPagina, Esqueleto, EstadoVacio, TarjetaDato } from "../ui/estructura"

/**
 * Guía de estilos del sistema de diseño (solo en desarrollo: /guia-estilos).
 * Sirve para revisar de un vistazo colores, tipografía y componentes en claro y oscuro.
 */

const COLORES = [
  ["background", "Fondo"],
  ["card", "Tarjeta"],
  ["foreground", "Texto"],
  ["muted-foreground", "Texto secundario"],
  ["primary", "Marca"],
  ["accent", "Acento suave"],
  ["gold", "Oro"],
  ["border", "Borde"],
  ["success", "Éxito"],
  ["warning", "Aviso"],
  ["destructive", "Peligro"],
  ["info", "Información"],
]

const Seccion = ({ titulo, children }) => (
  <section className="space-y-4">
    <h2 className="text-2xl font-medium">{titulo}</h2>
    {children}
  </section>
)

export default function GuiaEstilos() {
  const [oscuro, setOscuro] = useState(document.documentElement.classList.contains("dark"))
  const [modalAbierto, setModalAbierto] = useState(false)

  const cambiarTema = () => {
    const siguiente = !oscuro
    document.documentElement.classList.toggle("dark", siguiente)
    setOscuro(siguiente)
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-14">
        <EncabezadoPagina
          miga="Sistema de diseño"
          titulo="Guía de estilos"
          descripcion="Colores, tipografía y componentes de NailSoft. Esta página solo existe en desarrollo."
          acciones={
            <Button variant="outline" onClick={cambiarTema}>
              {oscuro ? <Sun /> : <Moon />}
              {oscuro ? "Modo claro" : "Modo oscuro"}
            </Button>
          }
        />

        <Seccion titulo="Logo">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="flex items-center justify-center p-8">
              <Logo tamano={44} />
            </Card>
            <Card className="flex items-center justify-center gap-6 p-8">
              <LogoSimbolo tamano={44} titulo="NailSoft" />
              <LogoSimbolo tamano={28} />
              <LogoSimbolo tamano={16} />
            </Card>
            <div className="flex items-center justify-center rounded-xl bg-primary p-8 shadow-soft">
              <Logo tamano={44} tono="blanco" />
            </div>
          </div>
        </Seccion>

        <Seccion titulo="Colores">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {COLORES.map(([token, nombre]) => (
              <div key={token} className="overflow-hidden rounded-lg border bg-card">
                <div className="h-16 border-b" style={{ background: `hsl(var(--${token}))` }} />
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{nombre}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">--{token}</p>
                </div>
              </div>
            ))}
          </div>
        </Seccion>

        <Seccion titulo="Tipografía">
          <Card className="space-y-4 p-6">
            <p className="font-display text-5xl font-medium tracking-tight">Belleza en cada detalle</p>
            <h1 className="text-4xl font-medium">Título de página · Fraunces</h1>
            <h2 className="text-2xl font-medium">Título de sección · Fraunces</h2>
            <h3 className="text-lg">Subtítulo · Inter seminegrita</h3>
            <p className="max-w-2xl text-base leading-relaxed">
              Texto de lectura en Inter. Agenda citas, registra ventas y controla el inventario de tu spa desde un
              solo lugar, con una interfaz pensada para el día a día.
            </p>
            <p className="text-sm text-muted-foreground">Texto secundario para descripciones y ayudas.</p>
            <p className="font-display text-3xl tabular-nums">$ 1.250.000</p>
          </Card>
        </Seccion>

        <Seccion titulo="Botones">
          <Card className="space-y-5 p-6">
            <div className="flex flex-wrap gap-3">
              <Button>Primario</Button>
              <Button variant="secondary">Secundario</Button>
              <Button variant="outline">Contorno</Button>
              <Button variant="ghost">Fantasma</Button>
              <Button variant="gold">Dorado</Button>
              <Button variant="destructive">Eliminar</Button>
              <Button variant="link">Enlace</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">
                <Plus /> Pequeño
              </Button>
              <Button>
                <Plus /> Normal
              </Button>
              <Button size="lg">
                <Plus /> Grande
              </Button>
              <Button size="icon" variant="outline" aria-label="Agregar">
                <Plus />
              </Button>
              <Button cargando>Guardando</Button>
              <Button disabled>Deshabilitado</Button>
            </div>
          </Card>
        </Seccion>

        <Seccion titulo="Formularios">
          <Card className="grid gap-5 p-6 sm:grid-cols-2">
            <Campo etiqueta="Nombre del servicio" requerido ayuda="Así lo verán los clientes en el catálogo.">
              <Input placeholder="Manicure semipermanente" />
            </Campo>
            <Campo etiqueta="Correo" requerido error="Escribe un correo válido, por ejemplo ana@gmail.com">
              <Input type="email" defaultValue="ana@" />
            </Campo>
            <Campo etiqueta="Categoría">
              <Select defaultValue="manos">
                <option value="manos">Manos</option>
                <option value="pies">Pies</option>
              </Select>
            </Campo>
            <Campo etiqueta="Deshabilitado">
              <Input disabled value="No editable" readOnly />
            </Campo>
            <Campo etiqueta="Descripción" className="sm:col-span-2">
              <Textarea placeholder="Describe el servicio..." />
            </Campo>
          </Card>
        </Seccion>

        <Seccion titulo="Etiquetas de estado">
          <Card className="flex flex-wrap gap-2 p-6">
            <Badge punto>Pendiente</Badge>
            <Badge variant="success" punto>
              Completada
            </Badge>
            <Badge variant="warning" punto>
              En progreso
            </Badge>
            <Badge variant="destructive" punto>
              Cancelada
            </Badge>
            <Badge variant="info">Nuevo</Badge>
            <Badge variant="gold">Promoción</Badge>
            <Badge variant="secondary">Inactivo</Badge>
            <Badge variant="outline">Borrador</Badge>
          </Card>
        </Seccion>

        <Seccion titulo="Datos y tarjetas">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TarjetaDato etiqueta="Citas de hoy" valor="12" detalle="+3 frente a ayer" tendencia="sube" icono={<CalendarDays />} />
            <TarjetaDato etiqueta="Ventas del mes" valor="$ 4,2 M" detalle="+8 % frente al mes pasado" tendencia="sube" icono={<Wallet />} />
            <TarjetaDato etiqueta="Clientes nuevos" valor="27" detalle="-2 frente al mes pasado" tendencia="baja" icono={<Users />} />
            <TarjetaDato etiqueta="Ticket promedio" valor="$ 85.000" detalle="Sin cambios" icono={<TrendingUp />} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tarjeta con pie</CardTitle>
                <CardDescription>Para agrupar información relacionada.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                El contenido va aquí. Las tarjetas tienen borde fino, sombra suave y esquinas amplias.
              </CardContent>
              <CardFooter className="justify-end">
                <Button variant="outline" size="sm">
                  Cancelar
                </Button>
                <Button size="sm">Guardar</Button>
              </CardFooter>
            </Card>
            <Card className="space-y-3 p-6">
              <p className="text-sm font-medium">Cargando contenido</p>
              <Esqueleto className="h-4 w-3/4" />
              <Esqueleto className="h-4 w-1/2" />
              <Esqueleto className="h-24 w-full" />
            </Card>
          </div>
        </Seccion>

        <Seccion titulo="Tabla">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ["Ana Pérez", "Manicure semipermanente", "12 nov · 10:00", "success", "Completada", "$ 65.000"],
                ["Lucía Martínez", "Pedicure spa", "12 nov · 11:30", "warning", "En progreso", "$ 80.000"],
                ["Mariana Gómez", "Uñas acrílicas", "13 nov · 09:00", "default", "Pendiente", "$ 120.000"],
                ["Sofía Ruiz", "Retiro de esmalte", "13 nov · 15:00", "destructive", "Cancelada", "$ 20.000"],
              ].map(([cliente, servicio, fecha, variante, estado, total]) => (
                <TableRow key={cliente}>
                  <TableCell className="font-medium">{cliente}</TableCell>
                  <TableCell>{servicio}</TableCell>
                  <TableCell className="text-muted-foreground">{fecha}</TableCell>
                  <TableCell>
                    <Badge variant={variante} punto>
                      {estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Seccion>

        <Seccion titulo="Estados">
          <div className="grid gap-4 md:grid-cols-2">
            <EstadoVacio
              icono={<Scissors />}
              titulo="Aún no hay servicios"
              descripcion="Crea el primero para que aparezca en el catálogo y los clientes puedan agendarlo."
              accion={
                <Button size="sm">
                  <Plus /> Nuevo servicio
                </Button>
              }
            />
            <Card>
              <Cargando texto="Cargando citas..." />
            </Card>
          </div>
        </Seccion>

        <Seccion titulo="Modal y alertas">
          <Card className="flex flex-wrap gap-3 p-6">
            <Button onClick={() => setModalAbierto(true)}>Abrir modal</Button>
            <Button
              variant="outline"
              onClick={() =>
                Swal.fire({ icon: "success", title: "Servicio guardado", text: "Ya aparece en el catálogo.", confirmButtonColor: "#db2777" })
              }
            >
              Alerta de éxito
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                Swal.fire({
                  icon: "warning",
                  title: "¿Eliminar el servicio?",
                  text: "Esta acción no se puede deshacer.",
                  showCancelButton: true,
                  confirmButtonText: "Sí, eliminar",
                  cancelButtonText: "Cancelar",
                  confirmButtonColor: "#d33",
                  cancelButtonColor: "#3085d6",
                })
              }
            >
              Confirmación de borrado
            </Button>
            <Button variant="outline" onClick={() => Swal.fire("Error", "No se pudo conectar con el servidor.", "error")}>
              Alerta de error
            </Button>
          </Card>
          <Modal
            abierto={modalAbierto}
            alCambiar={setModalAbierto}
            titulo="Nuevo servicio"
            descripcion="Completa los datos y guarda para publicarlo en el catálogo."
            pie={
              <>
                <Button variant="outline" onClick={() => setModalAbierto(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setModalAbierto(false)}>Guardar servicio</Button>
              </>
            }
          >
            <div className="grid gap-4">
              <Campo etiqueta="Nombre" requerido>
                <Input placeholder="Manicure semipermanente" />
              </Campo>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo etiqueta="Precio">
                  <Input inputMode="numeric" placeholder="65000" />
                </Campo>
                <Campo etiqueta="Duración (min)">
                  <Input inputMode="numeric" placeholder="60" />
                </Campo>
              </div>
            </div>
          </Modal>
        </Seccion>
      </div>
    </div>
  )
}
