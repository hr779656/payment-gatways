const express = require('express')
const app = express()
const bodyParser = require('body-parser')
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

app.use(express.static('public'));
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.json())


app.get('/', (req, res)=>{
    res.render('index.ejs')
})

app.post('/checkout', async (req, res) => {
    console.log(req.body)
    const { productName, price, quantity } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: productName,
                        },
                        unit_amount: price
                    },
                    quantity: quantity
                }
            ],
            mode: 'payment',
            shipping_address_collection: {
                allowed_countries: ['PK', 'ID']
            },
            success_url: `${process.env.BASE_URL}/complete?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BASE_URL}/cancel`,
        });

        res.redirect(session.url);
    } catch (error) {
        res.status(500).send(error.message);
    }
});


app.get('/complete', async (req, res) => {
    try {
        const [session, lineItems] = await Promise.all([
            stripe.checkout.sessions.retrieve(req.query.session_id, {
                expand: ['payment_intent.payment_method']
            }),
            stripe.checkout.sessions.listLineItems(req.query.session_id)
        ]);

        // Extracting required data
        const paymentIntent = session.payment_intent;
        const paymentMethod = paymentIntent.payment_method;
        const amountPaid = paymentIntent.amount_received / 100; // Converting to dollars
        const tax = paymentIntent.amount_details?.tax / 100 || 0; // Converting to dollars, default to 0 if no tax
        const productDetails = lineItems.data.map(item => ({
            description: item.description,
            amount: item.amount_total / 100, // Converting to dollars
            quantity: item.quantity
        }));

        // Simplified output for current session
        const result = {
            productDetails,
            amountPaid,
            tax,
            paymentMethod
        };

        console.log(result);
        res.send(`Your payment was successful! <br> Details: <pre>${JSON.stringify(result, null, 2)}</pre>`);
    } catch (error) {
        console.error(error);
        // res.status(500).send('There was an error retrieving the payment details.');
    }
});



app.get('/cancel', (req, res)=>{
   res.redirect('/')
})


app.listen(5000, ()=>{
    console.log('server started')
})