/**
 * Las reservaciones fallan sin al menos un espacio de parqueo.
 * Inserta un lote por defecto si la tabla está vacía.
 */
exports.up = async function (knex) {
  const existente = await knex('espacios_parqueo').first()
  if (existente) return

  await knex('espacios_parqueo').insert({
    name: 'AutoPark Principal',
    address: 'Campus UASD',
    espacio_total: 2,
    tiempo_abierto: 6,
    tiempo_cerrado: 22
  })
}

exports.down = async function (knex) {
  await knex('espacios_parqueo')
    .where({ name: 'AutoPark Principal', address: 'Campus UASD' })
    .del()
}
