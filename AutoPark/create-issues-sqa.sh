#!/usr/bin/env bash
# Crea los issues H1-H8 del Plan de SQA de AutoPark (v0.2-E2-A1).
# Requisitos: gh instalado y `gh auth login` hecho con una cuenta con permiso de escritura.
# Edita los responsables (RESP_*) antes de ejecutar. Ejecutar desde cualquier carpeta.
set -e
REPO="VladimirPaulino/INF5250-Proyecto-Codecraft-Dynamics"

# Responsables (usuarios de GitHub). Ajusta según lo que decida el equipo.
RESP_AUTH="Rodwel09"            # H1, H3 (UsuarioService)
RESP_API="VladimirPaulino"      # H2, H5, H6, H7 (API y rutas)
RESP_CONF="beyonderhakerman"       # H4 (config) y H8 (frontend)

# Etiquetas de severidad y de calidad
gh label create "severidad: crítica" -c B60205 -R $REPO 2>/dev/null || true
gh label create "severidad: alta"    -c D93F0B -R $REPO 2>/dev/null || true
gh label create "severidad: media"   -c FBCA04 -R $REPO 2>/dev/null || true
gh label create "severidad: baja"    -c 0E8A16 -R $REPO 2>/dev/null || true
gh label create "SQA"                -c 1F3864 -R $REPO 2>/dev/null || true
gh label create "seguridad"          -c 5319E7 -R $REPO 2>/dev/null || true

mk() { # id titulo sev criterio ubicacion hallazgo recomendacion responsable
  gh issue create -R $REPO --title "[$1] $2" --assignee "$8" \
    --label "SQA,seguridad,severidad: $3" --body "**Versión evaluada:** v0.2-E2-A1 (commit 7a43558)
**Severidad:** $3
**Criterio incumplido:** $4 (Plan de SQA, sección 5)
**Ubicación:** $5

**Hallazgo**
$6

**Recomendación**
$7

**Cierre:** lo cierra el responsable de calidad (Jeyson Israel Montero Mateo) solo después de repetir la prueba del checklist y adjuntar la captura."
}

mk H1 "Contraseña en texto plano y expuesta por la API" crítica C3 "UsuarioService.login, BaseService.findAll" \
 "La contraseña se guarda y se compara en texto plano, y GET /api/usuarios devuelve todas las columnas, incluida contrasena." \
 "Guardar un hash (bcrypt) y excluir el campo de las respuestas." "$RESP_AUTH"
mk H2 "API de usuarios sin autenticación ni autorización" crítica C4 "AutoParkApp.js, routes/usuarios.js" \
 "La API no valida sesión ni rol; el rol solo se consulta en localStorage y CORS está abierto, así que cualquiera puede crear o borrar usuarios." \
 "Middleware de autenticación y verificación de administrador activo." "$RESP_API"
mk H3 "El inicio de sesión ignora el estado de la cuenta" alta C5 "UsuarioService.login" \
 "El inicio de sesión no revisa estado, por lo que una cuenta inactiva entra." \
 "Rechazar las cuentas inactivas." "$RESP_AUTH"
mk H4 "Credenciales de base de datos por defecto en el repositorio" alta C2 "database/db.config.js" \
 "Usuario root y contraseña por defecto versionados en el repositorio." \
 "Usar variables de entorno y poner .env en .gitignore." "$RESP_CONF"
mk H5 "AuditLogService no se invoca" media C7 "AuditLogService" \
 "El servicio existe, pero ningún servicio ni ruta lo invoca." \
 "Registrar usuario, acción y detalle en las operaciones críticas, sin contraseña." "$RESP_API"
mk H6 "Errores 500 devuelven err.message" media C6 "routeHelpers.handle" \
 "Los errores 500 devuelven err.message, que puede incluir mensajes de MySQL." \
 "Respuesta genérica y registro interno del error." "$RESP_API"
mk H7 "Validación solo comprueba presencia de campos" baja C8 "BaseService.requireFields" \
 "Solo valida que el campo exista, no su tipo ni su formato." \
 "Validar correo, teléfono y rol permitido." "$RESP_API"
mk H8 "XSS almacenado por innerHTML sin escapar" alta C8 "html/admin.html líneas 134 a 143 y cinco pantallas más" \
 "Los datos de la API se insertan con innerHTML sin escapar; un nombre con HTML se ejecuta en el navegador del administrador." \
 "Usar textContent o una función escapeHtml()." "$RESP_CONF"
echo "Listo: revisa https://github.com/$REPO/issues"