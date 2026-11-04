/**
 * E3-A3: datos de la reservación, estados y enlace con el ticket de llegada.
 * Cubre RF-32, RF-33, RF-35, RF-36 y RF-39 de la SRS v0.3.
 */

exports.up = async function (knex) {
  await knex.schema.alterTable('reservaciones', (table) => {
    table.string('cliente', 120).notNullable().defaultTo('');
    table.string('placa', 20).notNullable().defaultTo('');
    table.enu('tipo', ['carro', 'motocicleta']).notNullable().defaultTo('carro');
    table.integer('duracion_horas').notNullable().defaultTo(1);
    table
      .enu('estado', ['confirmada', 'completada', 'cancelada'])
      .notNullable()
      .defaultTo('confirmada');
    table
      .integer('ticket_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('tickets')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
    table.index(['espacio_id', 'estado', 'fecha_de_entrada'], 'idx_reservaciones_cupo');
    table.index(['placa'], 'idx_reservaciones_placa');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('reservaciones', (table) => {
    table.dropForeign(['ticket_id']);
    table.dropIndex(['espacio_id', 'estado', 'fecha_de_entrada'], 'idx_reservaciones_cupo');
    table.dropIndex(['placa'], 'idx_reservaciones_placa');
    table.dropColumn('ticket_id');
    table.dropColumn('estado');
    table.dropColumn('duracion_horas');
    table.dropColumn('tipo');
    table.dropColumn('placa');
    table.dropColumn('cliente');
  });
};
