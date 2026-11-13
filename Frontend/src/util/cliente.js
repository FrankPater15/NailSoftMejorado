// Cómo se muestra un cliente en las pantallas del personal.
// Dos clientes pueden llamarse igual; el celular (único en el sistema) los
// distingue. Se muestran solo los últimos 4 dígitos para no exponer el número.

/** "Ana Pérez" (acepta el documento del cliente tal como lo devuelve la API). */
export const nombreCliente = (cliente) => {
  if (!cliente) return "Cliente no disponible"
  if (typeof cliente === "string") return cliente
  return [cliente.nombrecliente, cliente.apellidocliente].filter((p) => p && p !== "undefined" && p !== "null").join(" ") || "Cliente no disponible"
}

/** "…4521", o "" si no hay celular. */
export const finCelular = (cliente) => {
  const digitos = String(cliente?.celularcliente || "").replace(/\D/g, "")
  return digitos.length >= 4 ? `…${digitos.slice(-4)}` : ""
}

/** "Ana Pérez · …4521": nombre más un dato que la distingue de otra con el mismo nombre. */
export const etiquetaCliente = (cliente) => {
  const fin = finCelular(cliente)
  return fin ? `${nombreCliente(cliente)} · ${fin}` : nombreCliente(cliente)
}
