const express = require('express')
const app = express()
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)


app.set('view engine', 'ejs')


app.get('/', (req, res)=>{
    res.render('index.ejs')
})

app.post('/checkout', async (req, res)=>{
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price_data:{
                    currency: 'usd',
                    product_data: {
                        name: 'T-shirts',
                    },
                    unit_amount: 10 * 100
                },
                quantity: 1
            }
        ],
        mode: 'payment',
        shipping_address_collection:{
            allowed_countries: ['PK', 'ID']
        },
        success_url: `${process.env.BASE_URL}/complete?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.BASE_URL}/cancel`,
    })
    res.redirect(session.url)
})

app.get('/complete', async (req, res)=>{
    const result = Promise.all([
        stripe.checkout.sessions.retrieve(req.query.session_id, {
            expand: ['payment_intent.payment_method'
            ]}),
        stripe.checkout.sessions.listLineItems(req.query.session_id)
    ]) 
    console.log(JSON.stringify(await result))
    res.send('your payment was successful')
})

app.get('/cancel', (req, res)=>{
   res.redirect('/')
})


app.listen(5000, ()=>{
    console.log('server started')
})