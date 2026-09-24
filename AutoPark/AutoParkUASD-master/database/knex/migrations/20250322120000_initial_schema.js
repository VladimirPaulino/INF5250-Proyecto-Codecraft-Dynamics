/**
 * Mirrors database/sql/CREATE_TABLES.sql with correct FK order:
 * espacios_parqueo must exist before cambios_puestos (fixed vs raw script order).
 */

exports.up = async function (knex) {
  await knex.schema.createTable('usuarios', (table) => {
    table.increments('id').primary();
    table.string('nombre', 120).notNullable();
    table.string('email', 191).notNullable().unique();
    table.string('telefono', 20).notNullable();
    table.string('contrasena', 255).notNullable();
    table.enu('role', ['admin', 'usuario']).notNullable().defaultTo('usuario');
    table.enu('estado', ['activo', 'inactivo']).notNullable().defaultTo('activo');
    table.timestamp('created_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    table
      .timestamp('updated_at')
      .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
  });

  await knex.schema.createTable('espacios_parqueo', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('address', 255).notNullable();
    table.integer('espacio_total').notNullable();
    table.integer('tiempo_abierto').notNullable();
    table.integer('tiempo_cerrado').notNullable();
  });

  await knex.schema.createTable('vehiculos', (table) => {
    table.increments('id').primary();
    table
      .integer('usuario_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table.string('placa', 20).notNullable().unique();
    table.string('marca', 80);
    table.string('modelo', 80);
    table.string('color', 80);
    table.enu('tipo', ['carro', 'motocicleta']).notNullable().defaultTo('carro');
    table.timestamp('created_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    table
      .timestamp('updated_at')
      .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
  });

  await knex.schema.createTable('tickets', (table) => {
    table.increments('id').primary();
    table
      .integer('vehiculo_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('vehiculos')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table.dateTime('fecha_hora_entrada').notNullable();
    table.dateTime('fecha_hora_salida');
    table.decimal('total_pagar', 10, 2).notNullable().defaultTo(0);
    table.enu('status_de_pago', ['pendiente', 'pagado']).notNullable().defaultTo('pendiente');
    table.timestamp('created_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    table
      .timestamp('updated_at')
      .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
  });

  await knex.schema.createTable('notificaciones', (table) => {
    table.increments('id').primary();
    table
      .integer('usuario_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table.text('mensaje').notNullable();
    table.enu('tipo', ['emergencia', 'info', 'error']).notNullable().defaultTo('info');
    table.timestamp('created_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    table
      .timestamp('updated_at')
      .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
  });

  await knex.schema.createTable('cambios_puestos', (table) => {
    table.increments('id').primary();
    table
      .integer('usuario_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table
      .integer('espacio_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('espacios_parqueo')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table.dateTime('fecha_de_entrada').notNullable();
    table.dateTime('fecha_de_salida');
    table.timestamp('created_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    table
      .timestamp('updated_at')
      .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
  });

  await knex.schema.createTable('audit_logs', (table) => {
    table.increments('id').primary();
    table
      .integer('usuario_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table.string('accion', 255).notNullable();
    table.text('detalle').notNullable();
    table.timestamp('created_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    table
      .timestamp('updated_at')
      .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
  });

  await knex.schema.createTable('espacios_disponibles', (table) => {
    table.increments('id').primary();
    table
      .integer('espacio_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('espacios_parqueo')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table.boolean('disponible').notNullable().defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    table
      .timestamp('updated_at')
      .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
  });

  await knex.schema.createTable('reservaciones', (table) => {
    table.increments('id').primary();
    table
      .integer('usuario_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table
      .integer('espacio_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('espacios_parqueo')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table.dateTime('fecha_de_entrada').notNullable();
    table.dateTime('fecha_de_salida');
    table.timestamp('created_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    table
      .timestamp('updated_at')
      .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
  });

  await knex.schema.createTable('secciones_parqueo', (table) => {
    table.increments('id').primary();
    table
      .integer('vehiculo_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('vehiculos')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table
      .integer('espacio_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('espacios_parqueo')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table.enu('estado', ['disponible', 'ocupado']).notNullable().defaultTo('disponible');
    table.timestamp('created_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    table
      .timestamp('updated_at')
      .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
  });

  await knex.schema.createTable('pagos', (table) => {
    table.increments('id').primary();
    table
      .integer('usuario_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table
      .integer('ticket_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('tickets')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table.decimal('monto', 10, 2).notNullable();
    table.dateTime('fecha_de_pago').notNullable();
    table.timestamp('created_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    table
      .timestamp('updated_at')
      .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
  });

  await knex.schema.createTable('rates', (table) => {
    table.increments('id').primary();
    table.string('nombre', 255).notNullable();
    table.text('descripcion');
    table.timestamp('created_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    table
      .timestamp('updated_at')
      .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('rates');
  await knex.schema.dropTableIfExists('pagos');
  await knex.schema.dropTableIfExists('secciones_parqueo');
  await knex.schema.dropTableIfExists('reservaciones');
  await knex.schema.dropTableIfExists('espacios_disponibles');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('cambios_puestos');
  await knex.schema.dropTableIfExists('notificaciones');
  await knex.schema.dropTableIfExists('tickets');
  await knex.schema.dropTableIfExists('vehiculos');
  await knex.schema.dropTableIfExists('espacios_parqueo');
  await knex.schema.dropTableIfExists('usuarios');
};
