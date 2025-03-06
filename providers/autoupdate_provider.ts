import Costumer from '#models/costumer'
import env from "#start/env";
import type { ApplicationService } from '@adonisjs/core/types'
import { DateTime } from 'luxon'
import cron from 'node-cron'
import axios from 'axios'
import { SerializedCostumer } from '../types/serialized_costumer_type.js';



export default class AutoupdateProvider {
  constructor(protected app: ApplicationService) { }

  /**
   * Register bindings to the container
   */
  register() {
    console.log("register")
  }

  /**
   * The container bindings have booted
   */
  async boot() {
    console.log("boot")
  }

  /**
   * The application has been booted
   */
  async start() {
    console.log("start")
  }

  /**
   * The process has been started
   */
  async ready() {



    //Rotina para atualizar o status conforme tempo de pagamento
    //Rotina para teste
    // Agendar uma tarefa para rodar no primeiro dia de cada mês, à meia-noite
    cron.schedule('*/1 * * * *', async () => {
      const url = env.get('API_URL')
      const costumers = await axios.get(url!).then((response) => { return response.data })

      costumers.forEach(async (costumer: SerializedCostumer) => {

        const costumerModel = await Costumer.findOrFail(costumer.id)
        const timeSinceLastPayment = DateTime.now().diff(DateTime.fromISO(costumer.updatedAt), 'days').toObject().minutes
        console.table([costumer.name, timeSinceLastPayment])

        if (costumer.status == true && costumer.plan === "trimestral" && timeSinceLastPayment! >= 90) {

          costumerModel.status = false
          await costumerModel.save()

          console.log(`O usuário: ${costumer.nickname} teve seu acesso suspenso por falta de pagamento`)
        }
        if (costumer.status == true && costumer.plan === "mensal" && timeSinceLastPayment! >= 30) {
          costumerModel.status = false
          await costumerModel.save()

          console.log(`O usuário: ${costumer.nickname} teve seu acesso suspenso por falta de pagamento`)
        }
      })
    })

  }

  /**
   * Preparing to shutdown the app
   */
  async shutdown() {
    console.log("shudown")
  }
}