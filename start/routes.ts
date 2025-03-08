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
import router from '@adonisjs/core/services/router'

router.get('/', [CostumersController, 'index'])

router.post('/bronze-plan', [CheckoutsController, 'bronzePlan'])
router.post('/gold-plan', [CheckoutsController, 'goldPlan'])
router.post('/add-costumer', [CheckoutsController, 'create'])
router.post('/cancel-signature', [CheckoutsController, 'cancel'])

router.post('/webhook', [CheckoutsController, 'webhook'])
