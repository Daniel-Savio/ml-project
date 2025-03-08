import Costumer from "#models/costumer";
import env from "#start/env";
import { HttpContext } from "@adonisjs/core/http";
import { DateTime } from "luxon";
import Stripe from 'stripe';



//const stripe = new Stripe(env.get('STRIPE_SECRET_KEY') || '');

export default class CheckoutsController {

    async bronzePlan({ request, response }: HttpContext) {
        const stripe = new Stripe(env.get('STRIPE_SECRET_KEY') || '');
        const data = request.only(['nick', 'email'])
        console.log(data.nick)
        console.log(data.email)

        const customers = await stripe.customers.list({
            email: data.email,
            limit: 1
        })

        let customerId

        if (customers.data.length > 0) {
            // Use existing customer
            customerId = customers.data[0].id
            console.log('Using existing customer:', customerId)

            const subscriptions = await stripe.subscriptions.list({
                customer: customerId,
                status: 'active',
                limit: 1
            })

            // If there's an active subscription, prevent new checkout
            if (subscriptions.data.length > 0) {
                return response.status(200).json({
                    success: false,
                    message: 'Você já possui uma assinatura ativa. Cancele a assinatura atual antes de adquirir um novo plano.',
                    hasActiveSubscription: true
                })
            }
        } else {
            // Create new customer
            const newCustomer = await stripe.customers.create({
                email: data.email
            })
            customerId = newCustomer.id
            console.log('Created new customer:', customerId)
        }


        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price_data: {
                        currency: 'brl',
                        product_data: {
                            name: 'Mensal Bronze plan',
                            description: 'Acesso ao servidor por 1 mês',
                        },
                        unit_amount: 2999,
                        // Add recurring component for monthly subscription
                        recurring: {
                            interval: 'month',
                            interval_count: 1
                        }
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
            mode: 'subscription', // Changed from 'payment' to 'subscription'
            payment_method_types: ['card'],
            success_url: `http://tropadoml.com/complete/{CHECKOUT_SESSION_ID}`,
            cancel_url: 'http://tropadoml.com/',
        })


        response.json(session)
        console.log(session)
        response.status(200).send(session.url)
    }

    async goldPlan({ request, response }: HttpContext) {
        const stripe = new Stripe(env.get('STRIPE_SECRET_KEY') || '');
        const data = request.only(['nick', 'email'])
        console.log(data.nick)
        console.log(data.email)

        const customers = await stripe.customers.list({
            email: data.email,
            limit: 1
        })

        let customerId

        if (customers.data.length > 0) {
            // Use existing customer
            customerId = customers.data[0].id
            console.log('Using existing customer:', customerId)

            const subscriptions = await stripe.subscriptions.list({
                customer: customerId,
                status: 'active',
                limit: 1
            })

            // If there's an active subscription, prevent new checkout
            if (subscriptions.data.length > 0) {
                console.log("assinatura já ativa")
                response.status(200).send({
                    success: false,
                    message: 'Você já possui uma assinatura ativa. Cancele a assinatura atual antes de adquirir um novo plano.',
                    hasActiveSubscription: true
                })
                return
            }

        } else {
            // Create new customer
            const newCustomer = await stripe.customers.create({
                email: data.email
            })
            customerId = newCustomer.id
            console.log('Created new customer:', customerId)
        }


        try {
            const session = await stripe.checkout.sessions.create({
                customer: customerId,
                line_items: [{
                    price_data: {
                        currency: 'brl',
                        product_data: {
                            name: 'Trimestral Gold plan',
                            description: 'Acesso ao servidor por 3 meses',
                        },
                        unit_amount: 5999,
                        // Add recurring component for subscription
                        recurring: {
                            interval: 'month',
                            interval_count: 3
                        }
                    },
                    quantity: 1, // Changed from 3 to 1 since this is now a subscription
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
                mode: 'subscription', // Changed from 'payment' to 'subscription'
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
        const stripe = new Stripe(env.get('STRIPE_SECRET_KEY') || '');
        const { sessionId } = request.only(['sessionId'])
        if (sessionId === null) {
            response.status(500
            ).send("undefined sessions")
            return
        }

        try {
            const session = await stripe.checkout.sessions.retrieve(sessionId)

            const plan = session.amount_total! < 3000 ? 'mensal' : 'trimestral';
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

            //Checks costumer

            const existingCostumer = await Costumer.findBy('email', newCostumer.email)

            if (existingCostumer) {
                // Costumer exists, update their data
                existingCostumer.merge(newCostumer)
                await existingCostumer.save()

                console.log("Cliente já existente - atualizando dados")
                return response.status(200).send("Cliente já existente - atualizando dados")
            } else {
                // New Costumer, create record
                Costumer.create(newCostumer)
                console.log("Novo cliente cadastrado")
                return response.status(200).send("Suas informações foram cadastradas na nossa base com sucesso")
            }



        }
        catch (err) {
            console.log(err)
            response.status(500
            ).send(err.message)
        }

    }

    async cancel({ request, response }: HttpContext) {
        const stripe = new Stripe(env.get('STRIPE_SECRET_KEY') || '');
        const { email } = request.only(['email'])
        console.log(email)

        try {
            // Search for the customer in Stripe
            const customers = await stripe.customers.list({
                email: email,
                limit: 1
            })

            if (customers.data.length === 0) {
                return response.status(200).json({
                    success: false,
                    message: 'Cliente não encontrado na base de pagamentos'
                })
            }

            const stripeCustomer = customers.data[0]

            // 2. Check if customer exists in your database
            const localCustomer = await Costumer.findBy('email', email)

            if (!localCustomer) {
                return response.status(404).json({
                    success: false,
                    message: 'Cliente não encontrado na base de dados'
                })
            }

            // 3. Find active subscriptions for this customer
            const subscriptions = await stripe.subscriptions.list({
                customer: stripeCustomer.id,
                status: 'active'
            })

            if (subscriptions.data.length === 0) {
                return response.status(404).json({
                    success: false,
                    message: 'Nenhuma assinatura ativa encontrada'
                })
            }
            // 4. Cancel all active subscriptions
            const cancelResults = []
            for (const subscription of subscriptions.data) {
                const canceledSubscription = await stripe.subscriptions.cancel(subscription.id)
                cancelResults.push(canceledSubscription)
            }

            //Change the status on the customer to false

            localCustomer.status = false
            await localCustomer.save()

            return response.status(200).json({
                success: true,
                message: 'Assinatura cancelada com sucesso',
                canceledCount: cancelResults.length
            })
        } catch (error) {
            console.error('Error in cancellation process:', error)
            return response.status(500).json({
                success: false,
                message: 'Erro ao processar o cancelamento',
                error: error.message
            })
        }

    }



    async webhook({ request, response }: HttpContext) {
        const stripe = new Stripe(env.get('STRIPE_SECRET_KEY') || '');
        const event = request.body()

        //console.log(request.body())

        // Handle the event
        switch (event.type) {
            case 'payment_method.attached':
                {
                    const paymentMethod = event.data.object;
                    console.log('PaymentMethod was attached to a Costumer!');
                    console.log(paymentMethod)
                    break;
                }
            case 'customer.subscription.updated':
                {
                    const subscription = event.data.object as Stripe.Subscription;
                    if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
                        console.log('Subscription in trouble:', subscription.id);
                        console.log('Current status:', subscription.status);
                        console.log('Customer ID:', subscription.customer);

                        try {
                            // 1. Get customer details from Stripe using the customer ID
                            const stripeCustomer = await stripe.customers.retrieve(
                                subscription.customer as string
                            );

                            if (!stripeCustomer || stripeCustomer.deleted) {
                                console.log('Customer not found or deleted in Stripe');
                                break;
                            }

                            // 2. Get the customer's email
                            const customerEmail = stripeCustomer.email;

                            // 3. Find the customer in your database using the email
                            const localCustomer = await Costumer.findBy('email', customerEmail);

                            if (localCustomer) {
                                // 4. Update the status to false
                                localCustomer.status = false;
                                await localCustomer.save();

                                console.log(`Updated customer ${customerEmail} status to inactive due to subscription issue`);
                            } else {
                                console.log(`Customer with email ${customerEmail} not found in local database`);
                            }
                        } catch (error) {
                            console.error('Error updating customer status:', error);
                        }





                    }
                    break;
                }

            // ... handle other event types

        }

        // Return a 200 response to acknowledge receipt of the event
        response.json({ received: true });
    }
}