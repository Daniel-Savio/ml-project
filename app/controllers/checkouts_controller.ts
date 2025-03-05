import Costumer from "#models/costumer";
import env from "#start/env";
import { HttpContext } from "@adonisjs/core/http";
import { DateTime } from "luxon";
import Stripe from 'stripe';



const stripe = new Stripe(env.get('STRIPE_SECRET_KEY') || '');

export default class CheckoutsController {

    async bronzePlan({ request, response }: HttpContext) {
        const data = request.only(['nick'])
        console.log(data.nick)


        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'brl',
                        product_data: {
                            name: 'Um mês Bronze plan',
                            description: 'Acesso ao servidor por 1 mês',
                        },
                        unit_amount: 2999,
                    },
                    quantity: 1,

                }
            ],
            custom_fields: [
                {
                    key: 'discord_nickname',
                    label: {
                        type: 'custom',
                        custom: 'Nickname do Discord',
                    },
                    type: 'text',
                    text: {
                        minimum_length: 3,
                        maximum_length: 50,
                        default_value: data.nick
                    },
                    optional: false,
                },
            ],

            mode: 'payment',
            payment_method_types: ['card'],
            success_url: `http://tropadoml.com/complete/{CHECKOUT_SESSION_ID}`,
            cancel_url: 'http://tropadoml.com/',

        })


        response.json(session)
        console.log(session)
        response.status(200).send(session.url)
    }


    async goldPlan({ request, response }: HttpContext) {
        const data = request.only(['nick'])
        console.log(data.nick)


        try {
            const session = await stripe.checkout.sessions.create({
                line_items: [{
                    price_data: {
                        currency: 'brl',
                        product_data: {
                            name: 'Trimestral Gold plan',
                            description: 'Acesso ao servidor por 3 meses',

                        },
                        unit_amount: 1999,
                    },
                    quantity: 3,

                }],
                custom_fields: [
                    {
                        key: 'discord_nickname',
                        label: {
                            type: 'custom',
                            custom: 'Nickname do Discord',
                        },
                        type: 'text',
                        text: {
                            minimum_length: 3,
                            maximum_length: 50,
                            default_value: data.nick
                        },
                        optional: false,
                    },
                ],
                mode: 'payment',
                payment_method_types: ['card'],
                success_url: `http://tropadoml.com/complete/{CHECKOUT_SESSION_ID}`,
                cancel_url: 'http://tropadoml.com/',

            })
            console.log(session.url)
            response.status(200).send(session.url)
            return

        }
        catch (err) {
            console.log(err)
            response.status(500).send(err.message)
        }



    }

    async create({ request, response }: HttpContext) {
        const { sessionId } = request.only(['sessionId'])
        if (sessionId === null) {
            response.status(500
            ).send("undefined sessions")
            return
        }
        try {
            const session = await stripe.checkout.sessions.retrieve(sessionId)
            const plan = session.amount_total! >= 30000 ? 'trimestral' : 'mensal'
            const nickname = session.custom_fields?.find(field => field.key === 'discord_nickname')?.text?.value
            const name = session.customer_details?.name
            const email = session.customer_details?.email
            const lastPaymentDate = DateTime.now()
            const lastPaymentId = sessionId
            const status = true


            const newCostumer = {
                "plan": plan!,
                "nickname": nickname!,
                "name": name!,
                "email": email!,
                "lastPaymentDate": lastPaymentDate!,
                "lastPaymentId": lastPaymentId!,
                "status": status!
            }

            const costumer = await Costumer.updateOrCreate({ email: email! }, newCostumer)
            console.log(costumer)
            if (costumer.$isPersisted) {
                console.log("Cliente já existente - atualizando dados")
                response.status(200).send("Cliente já existente - atualizando dados")
            } else {
                console.log("Novo cliente cadastrado")
                response.status(200).send("Suas informações foram dastradas na nossa base com suscesso")
            }


        }
        catch (err) {
            console.log(err)
            response.status(500
            ).send(err.message)
        }

    }
}