# Especificación de Requisitos de Software (SRS)

**Sistema:** AutoPark  
**Curso:** INF-5250 Ingeniería de Software II  
**Institución:** Universidad Autónoma de Santo Domingo (UASD)  
**Equipo:** CodeCraft Dynamics  
**Entregable de referencia:** E1, Actividad 2. Este es SRS del proyecto actual. ESTO ES UN BORRADOR.
**Versión de la base medida:** rama `main`, commit `924172c` (informe E1-A1, 2 de octubre de 2026)  
**Versión del documento:** 0.2 — Borrador
**Fecha:** 7 de octubre de 2026

**Integrantes**

| Nombre | Matrícula |
|---|---|
| Frady Josué Nova Vargas | 100343824 |
| Vladimir Paulino Alvarez | 100403163 |
| Jeyson Israel Montero Mateo | 100527928 |
| Rodwel Polanco Martinez | 100500328 |
| Ana Diuska Terreno Pérez | 100365875 |

---

## 1. Introducción

### 1.1 Propósito

Este documento es la especificación de requerimientos del MVP de AutoPark. Cumple el criterio de entrada de la Actividad 2 del Entregable 1: debe existir una SRS, al menos en borrador, con los módulos y funcionalidades pendientes claramente identificados.

La guía indica tres usos concretos de esta lista:

1. El WBS de E1-A2 se construye solo con lo que falta por implementar. El código ya existente, medido en E1-A1, no entra en esa descomposición.
2. El incremento funcional 1 (E3) debe dejar funcionando al menos un módulo adicional de esta SRS.
3. El incremento funcional 2 (E4) debe integrar el resto de los módulos de esta SRS.

### 1.2 Alcance del producto

AutoPark es el sistema de parqueos del equipo. Un operador registra la entrada y la salida de vehículos, cobra la estadía y consulta el historial. Un administrador gestiona usuarios y revisa lo recaudado. El MVP también debe permitir reservar un espacio y dejar constancia de la operación del parqueo.

**Nombre del producto:** AutoPark.  
**Base heredada:** la aplicación medida en el commit `924172c`.  
**Trabajo pendiente:** los módulos de la sección 3 marcados como Pendiente, repartidos entre E3 y E4.

**Fuera del MVP, y por tanto fuera del WBS:**

- Cobro con tarjeta, transferencia o pasarela de pago. El pago se registra en el sistema.
- Captura de foto o reconocimiento de placas. El interruptor de la pantalla de entrada no es un requisito.
- Aplicación móvil, facturación fiscal (NCF) y recuperación de contraseña por correo.
- Operar varios parqueos como instalaciones independientes.

### 1.3 Definiciones

| Término | Significado |
|---|---|
| SRS | Especificación de requisitos de software de este MVP. |
| Base | Código ya construido y medido en E1-A1. No es trabajo pendiente. |
| Módulo pendiente | Funcionalidad de esta SRS que aún no queda operando de punta a punta. |
| E3 | Incremento funcional 1. Al menos un módulo adicional de esta SRS. |
| E4 | Incremento funcional 2. El resto de los módulos pendientes, más las pruebas del sistema. |
| Ticket | Registro de una estadía: entrada, salida, monto y estado de pago. |
| Operador | Usuario con rol `usuario` y estado `activo`. |
| Administrador | Usuario con rol `admin` y estado `activo`. |

### 1.4 Referencias

- Guía del profesor, Entregable I (E1) / Actividad 2. Estimación de costo, esfuerzo y duración. Criterios de entrada: SRS en borrador, módulos pendientes identificados, y claridad de qué va en E3 y qué va en E4.
- Documento de actividades del curso. E3 Actividad 3: incremento funcional 1, al menos un módulo adicional de la SRS. E4 Actividad 4: el resto de los módulos de la SRS, con pruebas.
- Informe E1-A1 del equipo, commit `924172c`, 2 de octubre de 2026.
- IEEE Std 830-1998, como estructura de esta especificación.
- README del repositorio: MVP de AutoPark.

### 1.5 Organización

La sección 2 describe el producto. La sección 3 es la lista que usa el WBS: cada módulo, su estado y el incremento al que pertenece. La sección 4 detalla los requisitos. La sección 5 fija cómo se acepta la base, E3 y E4.

---

## 2. Descripción general

### 2.1 Perspectiva

AutoPark es una aplicación web propia. El personal opera desde el navegador. Los datos quedan en MySQL o MariaDB, base `sistema_parqueos`. El servidor entrega las páginas y una API HTTP.

```text
[ Navegador ]
     |  páginas y API
     v
[ Servidor AutoPark ] ---- [ sistema_parqueos ]
```

Restricciones de esta entrega: JavaScript, HTML, CSS, Node.js, Express y Knex.js. Interfaz en español. Montos en pesos dominicanos, con dos decimales. Entorno de demostración en el servidor local del equipo.

### 2.2 Usuarios

| Actor | Qué hace |
|---|---|
| Operador | Entrada, salida y cobro, reservas, historial y movimientos. |
| Administrador | Lo del operador, más usuarios y reporte de ingresos. |
| Invitado | Ve un panel reducido y puede ir a iniciar sesión. En esta versión no reserva por su cuenta: la reserva la registra el operador a nombre del cliente. |

### 2.3 Regla de negocio que el equipo fija en este borrador

Hoy el cobro no es único: Registrar Salida usa RD$ 2.00 por minuto para automóvil y RD$ 1.00 por minuto para motocicleta, y Registro Vehicular usa RD$ 50.00 por hora. Para el MVP queda una sola regla por defecto, la de Registrar Salida, hasta que el módulo de tarifas de E4 la reemplace por una tarifa configurada:

- Automóvil: RD$ 2.00 por minuto.
- Motocicleta: RD$ 1.00 por minuto.
- Mínimo facturable: 1 minuto.

---

## 3. Módulos del MVP y trabajo pendiente

Esta es la lista de requerimientos del MVP. El estado se tomó de la base medida en `924172c`.

- **Implementado:** el flujo ya funciona de punta a punta en esa base. No se descompone en el WBS.
- **Parcial:** hay pantalla o API, pero la regla de esta SRS no se cumple. El faltante sí entra al WBS, dentro del incremento indicado.
- **Pendiente:** el módulo no opera. Entra completo al incremento indicado.

| ID | Módulo | Estado en la base | Incremento del faltante |
|---|---|---|---|
| M1 | Autenticación y sesión | Parcial. Hay login por nombre y contraseña. No rechaza cuentas inactivas ni protege la contraseña. | E4 |
| M2 | Panel de operación | Implementado. Activos, ingresos, total de tickets, búsqueda por placa y detalle. | Ninguno |
| M3 | Entrada y ticket | Parcial. Crea vehículo y ticket pendiente. No reutiliza la placa ni impide un segundo ticket abierto. | E3, porque la llegada de una reserva depende de esta regla |
| M4 | Salida y pago | Parcial. Cierra el ticket y registra el pago. La tarifa está duplicada y no sale de un catálogo. | E4, en el módulo de tarifas |
| M5 | Historial de tickets | Implementado. Listado, filtro e impresión. | Ninguno |
| M6 | Gestión de usuarios | Implementado. Alta, edición, baja y búsqueda, solo si el rol guardado en el navegador es admin. | Ninguno |
| M7 | Reporte de ingresos | Implementado. Total recaudado, pagos y tickets pendientes, solo para admin. | Ninguno |
| M8 | Reservaciones | Pendiente. La pantalla no guarda en la base. La tabla y la API existen, sin estados ni cupo. | E3 |
| M9 | Espacios, disponibilidad y secciones | Pendiente. Existen tablas y API. La entrada, la salida y la reserva no ocupan ni liberan un puesto. | E4 |
| M10 | Tarifas | Pendiente. La tabla no tiene monto ni unidad. El cobro usa dos fórmulas distintas en el navegador. | E4 |
| M11 | Notificaciones | Pendiente. La API crea avisos. Ningún flujo del parqueo genera ni muestra una notificación. | E4 |
| M12 | Auditoría | Pendiente. La API guarda registros. Las acciones reales no escriben la bitácora. | E4 |

### 3.1 Qué no entra al WBS

El WBS estima el trabajo pendiente, no el sistema ya medido. Quedan fuera de la descomposición:

- M2 Panel, M5 Historial, M6 Usuarios y M7 Reportes.
- La parte ya operable de M1 (iniciar y cerrar sesión), de M3 (abrir un ticket) y de M4 (cerrar ticket y registrar pago con la tarifa por defecto).
- Lo declarado fuera del MVP en la sección 1.2.

### 3.2 Incremento funcional 1 (E3)

Un solo módulo adicional, que es lo que la actividad de E3 pide como mínimo: **reservaciones operativas**.

Paquetes que el WBS debe poder descomponer:

1. Persistir la reservación (cliente, placa, tipo, inicio, duración y espacio) mediante la API, de modo que siga existiendo al recargar.
2. Estados confirmada, completada y cancelada, con filtro por texto y por estado.
3. Al marcar la llegada, completar la reserva y abrir un ticket pendiente reutilizando la placa, sin duplicar el vehículo ni el ticket abierto.
4. Al cancelar, liberar el cupo apartado.
5. Rechazar la reserva si no hay cupo en el intervalo, o si faltan cliente, placa o fecha, o si la fecha es pasada.

### 3.3 Incremento funcional 2 (E4)

El resto de los módulos de esta SRS:

1. **Tarifas (M10 y cierre de M4).** Un solo cálculo de cobro, leído de la tarifa vigente. Mientras no haya tarifa cargada, se usa la regla de la sección 2.3. Desaparece el cobro de RD$ 50 por hora.
2. **Espacios y secciones (M9).** La entrada y la reserva ocupan un puesto. La salida o la cancelación lo liberan.
3. **Notificaciones (M11).** Aviso al usuario cuando se confirma una reserva, cuando el vehículo entra y cuando el pago queda registrado. Tipos: `info`, `error`, `emergencia`.
4. **Auditoría (M12).** Bitácora al crear o anular un ticket, registrar un pago, confirmar o cancelar una reserva, y crear, editar o eliminar un usuario. Sin guardar la contraseña.
5. **Acceso (cierre de M1).** Rechazar cuentas inactivas. No devolver ni almacenar la contraseña en claro. La API de usuarios, reportes y bitácora solo atiende a un administrador activo.

E4, según el documento de actividades, cierra además con pruebas unitarias y de integración de todo el sistema. Esas pruebas son parte del entregable E4, no un módulo funcional de esta SRS.

---

## 4. Requisitos específicos

Cada requisito usa «El sistema deberá». La columna de estado indica si la base `924172c` ya lo cumple.

### 4.1 Autenticación y sesión (M1)

| ID | Requisito | Estado |
|---|---|---|
| RF-01 | El sistema deberá permitir iniciar sesión con nombre y contraseña. | Implementado |
| RF-02 | Si los datos no coinciden, deberá rechazar el acceso sin decir si falló el nombre o la contraseña. | Implementado |
| RF-03 | Si falta nombre o contraseña, deberá pedirlo y no deberá autenticar. | Implementado |
| RF-04 | Tras un acceso válido, deberá recordar identificador, nombre y rol, y abrir el panel. | Implementado |
| RF-05 | Deberá impedir el acceso de una cuenta `inactiva`. | Pendiente, E4 |
| RF-06 | Deberá cerrar la sesión y olvidar identificador, nombre y rol en ese navegador. | Implementado |
| RF-07 | Deberá impedir que quien no sea administrador abra la gestión de usuarios y el reporte de ingresos. | Implementado en la pantalla. El control equivalente en la API queda en E4 |

### 4.2 Panel (M2)

| ID | Requisito | Estado |
|---|---|---|
| RF-08 | El panel deberá mostrar la cantidad de tickets con pago pendiente, como vehículos activos. | Implementado |
| RF-09 | Deberá mostrar la suma de los pagos registrados. | Implementado |
| RF-10 | Deberá mostrar la cantidad total de tickets. | Implementado |
| RF-11 | Deberá listar los pendientes con hora de entrada, placa, tipo y estado. | Implementado |
| RF-12 | Deberá buscar un pendiente por placa exacta e informar si no existe o no tiene ticket abierto. | Implementado |
| RF-13 | Al elegir una fila, deberá mostrar identificador, placa, tipo, entrada, salida si existe, estado y total. | Implementado |
| RF-14 | Un invitado podrá ver el listado y el total de tickets, y no deberá ver ingresos ni el conteo reservado al personal autenticado. | Implementado |

### 4.3 Entrada y ticket (M3)

| ID | Requisito | Estado |
|---|---|---|
| RF-15 | Deberá registrar la entrada con placa, tipo (`carro` o `motocicleta`) y fecha y hora. | Implementado |
| RF-16 | Si no se indica la hora, deberá usar la fecha y hora actuales. | Implementado |
| RF-17 | La placa deberá guardarse sin duplicarse. | Parcial: la base exige placa única, pero la pantalla no reutiliza el vehículo existente |
| RF-18 | Si la placa ya existe, deberá reutilizar ese vehículo. | Pendiente, E3 |
| RF-19 | Marca, modelo y color son opcionales. | Implementado en los datos |
| RF-20 | La entrada deberá crear un ticket `pendiente` con total cero. | Implementado |
| RF-21 | Deberá rechazar otra entrada si ese vehículo ya tiene un ticket pendiente. | Pendiente, E3 |
| RF-22 | La pantalla de entrada deberá listar los últimos ingresos con fecha, vehículo y estado de pago. | Implementado |

### 4.4 Salida, tarifa y pago (M4 y M10)

| ID | Requisito | Estado |
|---|---|---|
| RF-23 | El operador deberá buscar por placa el ticket pendiente. | Implementado |
| RF-24 | Si no hay vehículo o no hay ticket pendiente, no deberá mostrar un cobro. | Implementado |
| RF-25 | Antes de confirmar, deberá mostrar placa, tipo, hora de entrada y total. | Implementado |
| RF-26 | El total deberá calcularse con la tarifa del tipo de vehículo y el tiempo entre la entrada y la salida. | Parcial: se calcula, pero con dos reglas distintas |
| RF-27 | Tarifa por defecto, mientras no haya otra activa: automóvil RD$ 2.00 por minuto, motocicleta RD$ 1.00 por minuto, mínimo un minuto. | Pendiente de unificar, E4 |
| RF-28 | El administrador deberá poder registrar una tarifa con nombre, descripción, monto y unidad. Si hay una tarifa activa, el cobro deberá usarla. | Pendiente, E4 |
| RF-29 | Al confirmar, deberá guardar hora de salida, total y estado `pagado`, y crear el pago con usuario, ticket, monto y fecha. | Implementado en Registrar Salida |
| RF-30 | Si el ticket se actualiza y el pago no queda registrado, no deberá informar la operación como exitosa. | Parcial |
| RF-31 | El registro vehicular deberá listar ticket, vehículo, entrada, salida, total y estado. Su cobro deberá ser el mismo de RF-27 o RF-28. | Parcial: el listado existe; el cobro de esa pantalla es otra tarifa |

### 4.5 Reservaciones (M8) — módulo de E3

| ID | Requisito | Estado |
|---|---|---|
| RF-32 | El operador deberá crear una reservación con cliente, placa, tipo, fecha y hora de inicio, y duración. | Pendiente. Hoy solo se agrega en la página |
| RF-33 | Las duraciones deberán ser 1, 2, 4 y 8 horas. | Pendiente de persistir |
| RF-34 | Deberá exigir cliente, placa y fecha, y no deberá aceptar una fecha pasada. | Parcial: la validación está en la página y no se guarda |
| RF-35 | Deberá guardarse en la base, con usuario, espacio, inicio y fin previsto, y deberá seguir ahí al recargar. | Pendiente, E3 |
| RF-36 | Una reservación nueva queda confirmada. | Pendiente, E3 |
| RF-37 | El listado deberá mostrar cliente, placa, tipo, fecha, duración y estado. | Parcial: se ve en la página, con datos de ejemplo que no vienen de la base |
| RF-38 | Deberá filtrar por cliente o placa y por estado: todas, confirmada, completada o cancelada. | Pendiente de operar sobre datos reales |
| RF-39 | Marcar la llegada deberá pasar la reserva a completada y abrir el ticket pendiente de ese vehículo, cumpliendo RF-18 y RF-21. | Pendiente, E3 |
| RF-40 | Cancelar una reserva confirmada deberá pasarla a cancelada y liberar el cupo. | Pendiente, E3 |
| RF-41 | No deberá confirmarse una reserva si el espacio no tiene cupo en ese intervalo. | Pendiente, E3 |

### 4.6 Historial (M5)

| ID | Requisito | Estado |
|---|---|---|
| RF-42 | El historial deberá listar identificador, vehículo, entrada, salida, monto y acción de impresión. | Implementado |
| RF-43 | Si no hay salida, deberá indicar que el vehículo sigue en el parqueo. | Implementado |
| RF-44 | Deberá filtrar por identificador de ticket o de vehículo. | Implementado |
| RF-45 | Deberá poder imprimir un ticket individual. | Implementado |

### 4.7 Usuarios (M6)

| ID | Requisito | Estado |
|---|---|---|
| RF-46 | Solo el administrador podrá abrir la gestión de usuarios. | Implementado en la pantalla |
| RF-47 | Deberá mostrar total de usuarios, de administradores y de cuentas activas. | Implementado |
| RF-48 | El listado deberá mostrar nombre, correo, rol y estado, y buscar por nombre o correo. | Implementado |
| RF-49 | El alta deberá pedir nombre, correo, teléfono, contraseña, rol (`admin` o `usuario`) y estado (`activo` o `inactivo`). Nombre, correo y contraseña son obligatorios. El correo no se repite. | Implementado |
| RF-50 | En la edición, si la contraseña queda en blanco, se conserva la anterior. | Implementado |
| RF-51 | La baja deberá pedir confirmación y no deberá eliminar al administrador de la sesión abierta. | Parcial: hay confirmación; falta la protección de la propia sesión |
| RF-52 | Pasar una cuenta a `inactivo` deberá impedir un nuevo inicio de sesión sin borrar su historial. | Pendiente, E4, junto con RF-05 |

### 4.8 Reportes (M7)

| ID | Requisito | Estado |
|---|---|---|
| RF-53 | Solo el administrador podrá abrir el reporte de ingresos. | Implementado en la pantalla |
| RF-54 | Deberá mostrar total recaudado, cantidad de pagos y cantidad de tickets pendientes. | Implementado |
| RF-55 | Deberá listar cada pago con ticket, fecha, monto y estado pagado, y filtrar por identificador de ticket. | Implementado |
| RF-56 | Deberá listar los tickets pendientes con identificador, vehículo, hora de entrada y estado. | Implementado |

### 4.9 Espacios, notificaciones y auditoría (M9, M11, M12) — E4

| ID | Requisito | Estado |
|---|---|---|
| RF-57 | Deberá registrar espacios con nombre, dirección, cupo, apertura y cierre. | Parcial: la API lo permite; la operación del parqueo no lo usa |
| RF-58 | Deberá conocer si un espacio tiene disponibilidad y si una sección está `disponible` u `ocupada`. | Pendiente de usarse en la operación, E4 |
| RF-59 | Al ocupar una sección, el estado deberá pasar a `ocupado`. Al cerrar el ticket, deberá volver a `disponible`. | Pendiente, E4 |
| RF-60 | Deberá crear una notificación al confirmar una reserva, al registrar una entrada y al registrar un pago, con tipo `info`, `error` o `emergencia`. | Pendiente, E4 |
| RF-61 | Deberá escribir en la bitácora usuario, acción y detalle en ticket, pago, reserva y usuario, sin incluir la contraseña. | Pendiente, E4 |

### 4.10 Datos

- **RD-01.** Los identificadores los genera la base.
- **RD-02.** El correo de usuario es único. La placa es única.
- **RD-03.** El estado de pago del ticket solo puede ser `pendiente` o `pagado`. El rol solo puede ser `admin` o `usuario`. El estado de la cuenta solo puede ser `activo` o `inactivo`. El tipo de vehículo solo puede ser `carro` o `motocicleta`.
- **RD-04.** Los montos usan dos decimales. Un ticket nuevo nace con total 0.
- **RD-05.** No deberá eliminarse un vehículo, un espacio o un usuario si hay tickets, pagos o reservas que dependan de ellos, salvo baja lógica.
- **RD-06.** La contraseña no deberá aparecer en listados, reportes ni consultas.

### 4.11 Requisitos no funcionales que siguen pendientes

Estos no son módulos del WBS funcional, pero E4 debe cumplirlos al cerrar M1:

- **RNF-01.** La contraseña no deberá poder leerse en claro desde la base ni desde la API.
- **RNF-02.** La API no deberá crear, cambiar ni borrar usuarios si quien llama no es un administrador activo.
- **RNF-03.** El mensaje de error hacia el navegador no deberá incluir SQL, rutas internas ni la contraseña.
- **RNF-04.** Si el servidor no responde, la pantalla deberá decirlo y no deberá borrar lo escrito, salvo después de un guardado confirmado.

Los ya observables en la base: la entrada rápida pide placa y tipo en una sola pantalla; el panel carga activos, ingresos y tickets sin una segunda página; el esquema se crea por migraciones.

---

## 5. Criterios de aceptación

### 5.1 Ya cubiertos por la base (no son trabajo del WBS)

| Prueba | Resultado |
|---|---|
| Acceso con usuario y clave correctos | Entra al panel |
| Clave incorrecta | No entra |
| Quien no es administrador abre usuarios o reportes | La pantalla lo devuelve al panel |
| Entrada con placa nueva | Crea vehículo y ticket pendiente |
| Salida con ticket pendiente | Cierra el ticket y registra el pago |
| Panel después de la salida | Ese vehículo deja de contarse como activo y el ingreso sube |
| Alta de usuario sin correo o sin clave | No se guarda |
| Reporte de administrador | La suma de pagos coincide con el total recaudado |

### 5.2 Cierran el incremento E3

| Prueba | Resultado |
|---|---|
| Reservación con cliente, placa y fecha futura | Queda confirmada y sigue al recargar |
| Reservación sin fecha, o con fecha pasada | No se guarda |
| Llegada de la reserva | Pasa a completada y abre un solo ticket pendiente |
| Segunda entrada de esa misma placa con ticket abierto | Se rechaza |
| Cancelación | Pasa a cancelada y libera el cupo |
| Intervalo sin cupo | No se confirma |

### 5.3 Cierran el incremento E4

| Prueba | Resultado |
|---|---|
| Salida de un automóvil, 10 minutos, tarifa por defecto | RD$ 20.00 en Registrar Salida y en Registro Vehicular |
| Salida de una motocicleta, 10 minutos, tarifa por defecto | RD$ 10.00 en ambas pantallas |
| Tarifa activa cargada por el administrador | El cobro usa esa tarifa |
| Entrada | Ocupa una sección |
| Salida o cancelación de reserva | Libera la sección |
| Reserva, entrada y pago | Generan notificación |
| Esas mismas acciones, y el alta o baja de un usuario | Quedan en la bitácora, sin contraseña |
| Cuenta inactiva | No inicia sesión |
| Consulta de usuarios | La respuesta no trae la contraseña |

---

## 6. Historial

| Versión | Fecha | Descripción |
|---|---|---|
| 0.1 | 2026-10-07 | Borrador inicial del comportamiento de AutoPark. |
| 0.2 | 2026-10-07 | Ajuste a la guía de E1-A2: módulos del MVP, estado frente al commit `924172c`, y reparto del trabajo pendiente entre E3 y E4. |
