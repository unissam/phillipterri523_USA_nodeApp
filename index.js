const express = require('express');
const path = require('path');
const app = express();
app.use(express.urlencoded({ extended: true }));

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Serve static files (e.g., CSS) from the public directory
app.use(express.static(path.join(__dirname, 'public')));
const stripe = require('stripe')('sk_test_51PONjZP6maGPcKP6DnZCUAF2Fwt4awu4EczuAvDebhEZJy6RLIggONgSCdXHZZLQMAIZodqZ3cdnqLq7KgDCduuS00DnHtihuS'); // Replace with your Stripe secret key

app.use(express.json());

app.get('/', async (req, res) => {
    res.render('index');
  });

  app.post('/create-payment-intent', async (req, res) => {
    const { amount, currency, name, country } = req.body;
  
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Amount in cents
        currency: currency,
        metadata: {
          cardholder_name: name,
          country: country,
        },
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

app.listen(8080, () => console.log('Server running on port 8080'));
