import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Costumer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare nickname: string

  @column()
  declare email: string

  @column()
  declare plan: string

  @column()
  declare lastPaymentId: string

  @column.dateTime()
  declare lastPaymentDate: DateTime

  @column()
  declare status: boolean



  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

}