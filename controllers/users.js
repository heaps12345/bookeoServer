const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { check, validationResult } = require('express-validator/check');

router.post(
  '/login',
  [check('email', 'Please include a valid email').isEmail(), check('password', 'password is required').exists()],

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    const hash = bcrypt.hashSync(password);
    try {
      const data = await db
        .select('email', 'hash')
        .from('login')
        .where({ email: req.body.email });

      const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
      if (isValid) {
        const user = await db
          .select('*')
          .from('users')
          .where({ email: req.body.email });

        req.session.user = user[0].email;
        res.json(user[0]);
      }
      return res.status(400).json({ errors: [{ param: 'password', msg: 'Invalid Credentials' }] });
    } catch (err) {
      res.status(400).json({ errors: [{ param: 'password', msg: 'Invalid Credentials' }] });
    }
  }
);

router.post(
  '/register',
  [
    check('username', 'username is required')
      .not()
      .isEmpty(),

    check('email', 'Please include a valid email').isEmail(),
    check('gender', 'Gender is required')
      .not()
      .isEmpty(),
    check('password', 'Please enter a password with 4 or more characters').isLength({ min: 4 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, email, img } = req.body;

    const hash = bcrypt.hashSync(password);
    try {
      const trx = await db.transaction(async trx => {
        const loginEmail = await trx
          .insert({
            hash: hash,
            email: email
          })
          .into('login')
          .returning('email');

        const user = await trx('users')
          .returning('*')
          .insert({
            email: loginEmail[0],
            username: username,
            img,
            joined: new Date()
          });

        req.session.user = user[0].email;
        res.json(user[0]);
        trx.commit;
        trx.rollback;
      });
    } catch (err) {
      res.status(400).json({ errors: [{ param: 'email', msg: 'Email already exists' }] });
    }
  }
);

router.get('/logout', (req, res) => {
  res.clearCookie('user_sid');
  res.json('session ended');
});

module.exports = router;
