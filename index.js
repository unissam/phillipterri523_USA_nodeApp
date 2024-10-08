const express = require('express');
const path = require('path');
require('dotenv').config();
const app = express();
app.use(express.urlencoded({ extended: true }));

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Serve static files (e.g., CSS) from the public directory
app.use(express.static(path.join(__dirname, 'public')));

const envV = process.env;
const stripeSecret = envV.stripeSecret;
const stripe = require('stripe')(stripeSecret); // Replace with your Stripe secret key

app.use(express.json());

// #region Database
const { Sequelize, DataTypes } = require('sequelize');
const dbName = envV.dbName, dbUser = "doadmin", dbPass = envV.dbPass, dbHost = envV.dbHost, dbPort = envV.dbPort;
console.log(dbName, dbUser, dbPass,dbHost,dbPort);
const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  port: dbPort,
  dialect: "mysql"
});

sequelize.authenticate()
  .then(() => {
    console.log('connected..')
  })
  .catch(err => {
    console.error(err.message);
  })
const db = {}

db.sequelize = sequelize

db.user = sequelize.define("user", {
  email: {
    type: DataTypes.STRING,
    unique: true
  }

})
db.sequelize.sync({ force: false })
  .then(() => {
    console.log('yes re-sync done!')
  }).catch(err => {
    console.error(err.message);
  })

//#endregion Database

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
app.get('/users', async (req, res) => {
  let user = await db.user.findAll({ attributes: ['email'] });
  res.json({ user: user });
});
app.get('/add-user', async (req, res) => {
  var validator = require("email-validator");
  console.log(validator.validate(req.query.text));
  if (req.query.text && validator.validate(req.query.text)) {
    try {
      let user = await await db.user.create({ email: req.query.text });
      res.send({ user: user });
    }
    catch (err) {
      res.send(err.message);
    }
  }
  else {
    res.send("address not correct !");
  }

});
app.get('/verify-email', async (req, res) => {
  var validator = require("email-validator");
  if (req.query.email && validator.validate(req.query.email)) {
  try {
    let user = await await db.user.findOne({ where: { email: req.query.email } });
    if(!user){
      await await db.user.create({ email: req.query.email });
    }
    res.send(true);
  }
  catch (err) {
    res.send(false);
  }
  }
  else{
    res.send(false);
  }
});
const port = envV.port;
app.listen(port, () => console.log('Server running on port ' + port));
