const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const db = require('./config/db');
const config = require('./config');
const session = require('express-session');
const cookieParser = require('cookie-parser');
// const stripe = require('stripe')(config.get('stripeSecretKey'));
const moment = require('moment');
const { check, validationResult } = require('express-validator/check');
const whitelist = ['http://localhost:3000'];

const corsOptions = {
  credentials: true,
  origin: function(origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

const imageUpload = require('./controllers/imageUpload');
const users = require('./controllers/users');
const rentals = require('./controllers/rentals');
const bookings = require('./controllers/bookings');
const reviews = require('./controllers/reviews');

const app = express();
app.use(cors(corsOptions));
app.use(express.json({ extended: false }));
app.use(cookieParser());

app.set('trust proxy', 1);
app.use(
  session({
    key: 'user_sid',
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 5184000000
    }
  })
);

app.use((req, res, next) => {
  if (req.cookies.user_sid && !req.session.user) {
    res.clearCookie('user_sid');
  }
  next();
});

app.get('/', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    try {
      const user = await db
        .select('*')
        .from('users')
        .where('email', '=', req.session.user);

      res.json(user[0]);
    } catch (err) {
      res.status(400).json('unable to get user');
    }
  }
});

// app.get('/profile/:id', async (req, res) => {
//   const profile = await db('users')
//     .select('*')
//     .where({ id: req.params.id });

//   res.json(profile);
// });

// app.post('/payment', async (req, res) => {
//   const { token, email, ownerId, amount } = req.body;
//   const customer = await stripe.customers.create({
//     source: token,
//     email: email
//   });
//   if (customer) {
//     const payment = await db('payment')
//       .insert({
//         customerEmail: email,
//         ownerId,
//         tokenId: token,
//         amount: amount,
//         stripeCustomerId: customer.id,
//         paymentMadeOn: new Date()
//       })
//       .returning('*');
//     res.json(payment);
//   } else {
//     res.status(400).json({ errors: [{ param: 'password', msg: 'Invalid Credentials' }] });
//   }

// });

// app.put('/payment', async (req, res) => {
//   const { userId } = req.body;
//   const payment = await db('payment')
//     .select('amount', 'customerEmail', 'status')
//     // .join('booking', 'bookingId', '=', 'rentalId')
//     .where({ ownerId: userId });

//   res.json(payment);

app.use('/imageUpload', imageUpload);
app.use('/users', users);
app.use('/rentals', rentals);
app.use('/bookings', bookings);
app.use('/reviews', reviews);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
