import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'costumers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('name').nullable()
      table.string('nickname').nullable()
      table.string('email').nullable()
      table.string('plan').nullable()
      table.string('last_payment_id').nullable()
      table.datetime('last_payment_date').nullable()
      table.boolean('status')


      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}