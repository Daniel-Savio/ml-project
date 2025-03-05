import Costumer from '#models/costumer'
import type { HttpContext } from '@adonisjs/core/http'

export default class CostumersController {

    async index({ response }: HttpContext) {
        const costumers = await Costumer.all()
        response.send(costumers)
    }

    async delete({ request, response }: HttpContext) {
        const { email } = request.only(['email'])
        try {
            const costumer = await Costumer.findByOrFail('email', email)
            await costumer.delete()

            response.status(203).send("Cliente deletado com sucesso")


        }
        catch (err) {
            response.send(err.message)
        }
    }

}