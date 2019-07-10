const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const db = require('./config/db');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const multer = require('multer');

const moment = require('moment');
const { check, validationResult } = require('express-validator/check');
const whitelist = [
  'http://localhost:3000',
  'https://still-castle-84291.herokuapp.com/',
  'https://bookeo.herokuapp.com',
  'https://optimistic-spence-d73e5b.netlify.com'
];

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

app.use('/imageUpload', imageUpload);
app.use('/users', users);
app.use('/rentals', rentals);
app.use('/bookings', bookings);
app.use('/reviews', reviews);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
