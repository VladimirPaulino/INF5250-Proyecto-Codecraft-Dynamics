module.exports = {
  BaseService: require('./BaseService'),
  UsuarioService: require('./UsuarioService'),
  VehiculoService: require('./VehiculoService'),
  TicketService: require('./TicketService'),
  PagoService: require('./PagoService'),
  ReservacionService: require('./ReservacionService'),
  RateService: require('./RateService'),
  NotificacionService: require('./NotificacionService'),
  SeccionParqueoService: require('./SeccionParqueoService'),
  EspacioParqueoService: require('./EspacioParqueoService'),
  EspacioDisponibleService: require('./EspacioDisponibleService'),
  CambioPuestoService: require('./CambioPuestoService'),
  AuditLogService: require('./AuditLogService'),
  ...require('./errors'),
  ...require('./routeHelpers')
}
