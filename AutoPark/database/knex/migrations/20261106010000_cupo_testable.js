/**
 * Cupo de 50 hacía imposible la prueba manual de «sin cupo».
 * Baja la capacidad del lote por defecto a 2 espacios.
 */
exports.up = async function (knex) {
  await knex('espacios_parqueo')
    .where({ name: 'AutoPark Principal' })
    .update({ espacio_total: 2 })

  const row = await knex('espacios_parqueo').orderBy('id').first()
  if (row && Number(row.espacio_total) > 10) {
    await knex('espacios_parqueo').where('id', row.id).update({ espacio_total: 2 })
  }
}

exports.down = async function (knex) {
  await knex('espacios_parqueo')
    .where({ name: 'AutoPark Principal' })
    .update({ espacio_total: 50 })
}
