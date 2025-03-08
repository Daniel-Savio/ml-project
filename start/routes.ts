/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import CheckoutsController from '#controllers/checkouts_controller'
import CostumersController from '#controllers/costumers_controller'
import { HttpContext } from '@adonisjs/core/http'
import router from '@adonisjs/core/services/router'

router.get('/', [CostumersController, 'index'])
router.get('/keep-alive', ({ response }: HttpContext) => {
    response.status(200).send("Alive and kicking")
})

router.post('/bronze-plan', [CheckoutsController, 'bronzePlan'])
router.post('/gold-plan', [CheckoutsController, 'goldPlan'])
router.post('/add-costumer', [CheckoutsController, 'create'])
router.post('/cancel-signature', [CheckoutsController, 'cancel'])

router.post('/webhook', [CheckoutsController, 'webhook'])
