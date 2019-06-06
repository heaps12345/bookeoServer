const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { check, validationResult } = require('express-validator/check');

router.post(
  '/',
  [
    check('title', 'Title is required')
      .not()
      .isEmpty(),
    check('description', 'Description is required')
      .not()
      .isEmpty(),
    check('image', 'Image is required').isLength({ min: 1 }),
    check('category', 'Category is required')
      .not()
      .isEmpty(),
    check('city', 'City is required')
      .not()
      .isEmpty(),
    check('street', 'Street is required')
      .not()
      .isEmpty(),
    check('bedrooms', 'Bedrooms is required')
      .not()
      .isEmpty(),
    check('dailyRate', 'Daily Rate is required')
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      city,
      street,
      category,
      image,
      bedrooms,
      description,
      dailyRate,
      userId,
      username,
      userImg
    } = req.body;
    // const rental = await db('rentals')

    try {
      const rental = await db('rentals')
        .insert({
          title: title,
          city: city,
          street: street,
          category: category,
          image: image,
          bedrooms: bedrooms,
          description: description,
          dailyRate: dailyRate,
          ownerId: userId,
          username: username,
          userImg: userImg,
          createdAt: new Date()
        })
        .returning('*');
      res.json(rental);
    } catch (err) {
      console.log(err);
    }
  }
);

router.get('/', async (req, res) => {
  const { city } = req.query;
  try {
    if (city) {
      const rentals = await db
        .select('*')
        .from('rentals')
        .whereRaw('LOWER(city) LIKE ?', city.toLowerCase());
      rentals.length === 0 ? res.status(400).json({ errors: ['err'] }) : res.json(rentals);
    } else {
      const rentals = await db('rentals').select('*');
      res.json(rentals);
    }
  } catch (err) {
    console.log(err);
  }
});

router.get('/:id', async (req, res) => {
  const rental = await db('rentals')
    .select('*')
    .where({ rentalId: req.params.id });
  res.json(rental);
});

router.put('/:id', async (req, res) => {
  const { title, city, street, category, bedrooms, description, dailyRate } = req.body;

  const rental = await db('rentals')
    .select('*')
    .where({ rentalId: req.params.id })

    .update({
      title: title,
      city: city,
      street: street,
      category: category,
      // image: image,
      bedrooms: bedrooms,
      description: description,
      dailyRate: dailyRate
    })
    .returning('*');

  res.json(rental);
});

router.delete('/:id', async (req, res) => {
  const { userId } = req.body;

  // if (ownerId !== userId) {
  //   res.status(400).json({ errors: [{ param: 'owners', msg: 'You are not the rental owner' }] });
  // }

  const rental = await db('rentals')
    .select('*')
    .where({
      // ownerId: userId,
      rentalId: req.params.id
      // rentalId
    })
    .join('booking', 'bookingId', '=', 'rentalId')

    .select('*')
    .from('rentals')

    .del();
  res.json(rental);
});

router.put('/manage/:id', async (req, res) => {
  const { userId, rentalId, bookingId } = req.body;
  try {
    const rentals = await db('rentals')
      // .select('startAt', 'endAt', 'guests', 'totalPrice')
      .select('*')
      // .join('booking', 'bookingId', '=', 'rentalId')
      // .select('*')
      // .from('rentals')
      .where({ ownerId: userId });

    let rentalArr = [];
    rentals.forEach(rental => {
      // Check if the id already exists in the array 't'
      if (!rentalArr.find(self => self.rentalId === rental.rentalId)) {
        // If not, pushes rental to renatlArr
        rentalArr.push(rental);
      }
    });
    res.json(rentalArr);
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
