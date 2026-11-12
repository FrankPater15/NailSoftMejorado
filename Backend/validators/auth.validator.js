const Joi = require("joi")

// Regla única de contraseña para registro, restablecimiento y gestión de usuarios.
// Debe coincidir con Frontend/src/util/validacionPassword.js
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,64}$/

const passwordRule = Joi.string()
  .min(8)
  .max(64)
  .pattern(PASSWORD_REGEX)
  .messages({
    "string.base": "La contraseña debe ser un texto.",
    "string.empty": "La contraseña es obligatoria.",
    "string.min": "La contraseña debe tener al menos 8 caracteres.",
    "string.max": "La contraseña no puede superar los 64 caracteres.",
    "string.pattern.base":
      "La contraseña debe incluir una mayúscula, una minúscula, un número, un carácter especial y no debe contener espacios.",
    "any.required": "La contraseña es obligatoria.",
  })

const confirmPasswordRule = Joi.any().valid(Joi.ref("password")).required().messages({
  "any.only": "Las contraseñas no coinciden.",
  "any.required": "La confirmación de la contraseña es obligatoria.",
})

// Letras (incluye tildes y ñ) y espacios
const nombreRule = (campo) =>
  Joi.string()
    .trim()
    .min(3)
    .max(50)
    .pattern(/^[\p{L}\s]+$/u)
    .required()
    .messages({
      "string.base": `El ${campo} debe ser un texto.`,
      "string.empty": `El ${campo} es obligatorio.`,
      "string.min": `El ${campo} debe tener al menos 3 caracteres.`,
      "string.max": `El ${campo} no puede superar los 50 caracteres.`,
      "string.pattern.base": `El ${campo} solo puede contener letras y espacios.`,
      "any.required": `El ${campo} es obligatorio.`,
    })

const emailRule = Joi.string()
  .trim()
  .lowercase()
  .email({ minDomainSegments: 2 })
  .max(80)
  .required()
  .messages({
    "string.base": "El correo debe ser un texto.",
    "string.empty": "El correo es obligatorio.",
    "string.email": "El correo no tiene un formato válido.",
    "string.max": "El correo no puede superar los 80 caracteres.",
    "any.required": "El correo es obligatorio.",
  })

const celularRule = Joi.string()
  .trim()
  .pattern(/^[1-9][0-9]{9}$/)
  .required()
  .messages({
    "string.base": "El celular debe ser un texto.",
    "string.empty": "El celular es obligatorio.",
    "string.pattern.base": "El celular debe tener 10 dígitos y no puede empezar por 0.",
    "any.required": "El celular es obligatorio.",
  })

// Campos extra (como rol o estado) se descartan: el registro público no los acepta.
const registroSchema = Joi.object({
  nombre: nombreRule("nombre"),
  apellido: nombreRule("apellido"),
  email: emailRule,
  celular: celularRule,
  password: passwordRule.required(),
  confirmPassword: confirmPasswordRule,
}).options({ stripUnknown: true })

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().max(80).required(),
  password: Joi.string().max(128).required(),
})
  .options({ stripUnknown: true })
  .messages({
    "any.required": "Email y contraseña son requeridos",
    "string.empty": "Email y contraseña son requeridos",
    "string.base": "Email y contraseña son requeridos",
    "string.max": "Credenciales inválidas",
  })

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Token, contraseña y confirmación son requeridos",
    "string.empty": "Token, contraseña y confirmación son requeridos",
    "string.base": "Token, contraseña y confirmación son requeridos",
  }),
  password: passwordRule.required(),
  confirmPassword: confirmPasswordRule,
}).options({ stripUnknown: true })

// Valida y devuelve { value } o { mensaje } con el primer error
const validar = (schema, datos) => {
  const { value, error } = schema.validate(datos || {}, { abortEarly: true })
  if (error) {
    return { mensaje: error.details[0].message }
  }
  return { value }
}

module.exports = {
  PASSWORD_REGEX,
  passwordRule,
  nombreRule,
  registroSchema,
  loginSchema,
  resetPasswordSchema,
  validar,
}
