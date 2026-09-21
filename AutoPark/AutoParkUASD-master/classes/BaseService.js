const { NotFoundError, ValidationError } = require('./errors')

class BaseService {
  constructor(db, tableName, entityName) {
    this.db = db
    this.tableName = tableName
    this.entityName = entityName
  }

  query() {
    return this.db(this.tableName)
  }

  async findAll() {
    return this.query().select('*')
  }

  async findById(id) {
    const row = await this.query().where('id', id).first()
    if (!row) {
      throw new NotFoundError(this.entityName)
    }
    return row
  }

  async create(data) {
    const ids = await this.query().insert(data)
    return ids[0]
  }

  async update(id, data) {
    const updated = await this.query().where('id', id).update(data)
    if (!updated) {
      throw new NotFoundError(this.entityName)
    }
    return updated
  }

  async delete(id) {
    const deleted = await this.query().where('id', id).del()
    if (!deleted) {
      throw new NotFoundError(this.entityName)
    }
    return deleted
  }

  requireFields(data, fields) {
    const missing = fields.filter((field) => {
      const value = data[field]
      return value === undefined || value === null || value === ''
    })

    if (missing.length > 0) {
      throw new ValidationError(`Missing required fields: ${missing.join(', ')}`)
    }
  }
}

module.exports = BaseService
