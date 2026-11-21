/**
 * E4-A4 · Incremento funcional 2.
 *
 * - M10 Tarifas (RF-27, RF-28): la tabla rates gana monto, unidad, tipo de
 *   vehículo y una bandera de tarifa activa.
 * - M9 Secciones (RF-58, RF-59): una sección es un puesto físico del espacio.
 *   Puede estar libre (sin vehículo), así que vehiculo_id pasa a ser opcional.
 *   El ticket guarda la sección que ocupa para liberarla en la salida.
 *   Se crean tantas secciones como espacio_total tenga cada espacio.
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('rates', (table) => {
    table.enu('tipo_vehiculo', ['carro', 'motocicleta']).notNullable().defaultTo('carro')
    table.decimal('monto', 10, 2).notNullable().defaultTo(0)
    table.enu('unidad', ['minuto', 'hora']).notNullable().defaultTo('minuto')
    table.boolean('activa').notNullable().defaultTo(false)
  })

  await knex.schema.alterTable('secciones_parqueo', (table) => {
    table.integer('vehiculo_id').unsigned().nullable().alter()
    table.string('codigo', 20).nullable()
  })

  await knex.schema.alterTable('tickets', (table) => {
    table.integer('seccion_id').unsigned().nullable()
    table.foreign('seccion_id').references('secciones_parqueo.id').onDelete('SET NULL')
  })

  const espacios = await knex('espacios_parqueo').select('id', 'espacio_total')
  for (const espacio of espacios) {
    const existentes = await knex('secciones_parqueo').where('espacio_id', espacio.id).count({ n: '*' }).first()
    const faltan = Number(espacio.espacio_total) - Number(existentes.n)
    for (let i = 1; i <= faltan; i += 1) {
      await knex('secciones_parqueo').insert({
        espacio_id: espacio.id,
        vehiculo_id: null,
        estado: 'disponible',
        codigo: `P-${Number(existentes.n) + i}`
      })
    }
  }
}

exports.down = async function (knex) {
  await knex.schema.alterTable('tickets', (table) => {
    table.dropForeign('seccion_id')
    table.dropColumn('seccion_id')
  })
  await knex('secciones_parqueo').whereNull('vehiculo_id').del()
  await knex.schema.alterTable('secciones_parqueo', (table) => {
    table.dropColumn('codigo')
    table.integer('vehiculo_id').unsigned().notNullable().alter()
  })
  await knex.schema.alterTable('rates', (table) => {
    table.dropColumn('activa')
    table.dropColumn('unidad')
    table.dropColumn('monto')
    table.dropColumn('tipo_vehiculo')
  })
}
