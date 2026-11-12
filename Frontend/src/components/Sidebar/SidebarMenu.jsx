import { menuConfig } from "../../config/menuConfig"
import MenuGroup from "../../config/MenuGroup"
import MenuItem from "../../config/MenuItem"
import { usePermissions } from "../../hooks/usePermissions"

const esActiva = (pathname, path) => pathname === path || pathname.startsWith(`${path}/`)

const SidebarMenu = ({ collapsed, pathname }) => {
  const { hasPermission } = usePermissions()

  // Solo las opciones que el usuario puede ver, agrupadas en el orden del menú
  const grupos = []
  for (const opcion of menuConfig) {
    if (opcion.permission && !hasPermission(opcion.permission)) continue
    const nombre = opcion.group || ""
    let grupo = grupos.find((g) => g.nombre === nombre)
    if (!grupo) {
      grupo = { nombre, opciones: [] }
      grupos.push(grupo)
    }
    grupo.opciones.push(opcion)
  }

  const renderOpcion = (opcion) => (
    <MenuItem
      key={opcion.path}
      to={opcion.path}
      icon={opcion.icon}
      collapsed={collapsed}
      isActive={esActiva(pathname, opcion.path)}
    >
      {opcion.label}
    </MenuItem>
  )

  return (
    <div className="flex flex-col gap-1">
      {grupos.map(({ nombre, opciones }) =>
        nombre ? (
          <MenuGroup
            key={nombre}
            title={nombre}
            collapsed={collapsed}
            defaultExpanded={opciones.some((o) => esActiva(pathname, o.path))}
          >
            {opciones.map(renderOpcion)}
          </MenuGroup>
        ) : (
          <div key="principal" className="flex flex-col gap-0.5">
            {opciones.map(renderOpcion)}
          </div>
        ),
      )}
    </div>
  )
}

export default SidebarMenu
