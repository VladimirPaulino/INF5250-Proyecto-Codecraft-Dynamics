class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400)
    this.name = 'ValidationError'
  }
}

class NotFoundError extends AppError {
  constructor(entity = 'Resource') {
    super(`${entity} not found`, 404)
    this.name = 'NotFoundError'
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409)
    this.name = 'ConflictError'
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError
}
