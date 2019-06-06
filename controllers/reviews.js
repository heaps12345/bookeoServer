const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/:id', async (req, res) => {
  const { id, userId, text, rating, username, img } = req.body;
  const booking = await db('booking')
    .select('hasReview')
    .where({ id })
    .update({
      hasReview: true
    })
    .returning('hasReview');

  const review = await db('reviews')
    .insert({
      text,
      rating,
      username,
      bookingId: id,
      userImg: img,
      reviewId: req.params.id,
      createdAt: new Date()
    })
    .returning('*');

  res.json(review);
});

router.get('/:id', async (req, res) => {
  const reviews = await db('reviews')
    .select('*')
    .where({ reviewId: req.params.id });
  res.json(reviews);
});

router.put('/', async (req, res) => {
  const { reviewId } = req.body;

  const avg = await db('reviews')
    .where({ reviewId })
    .avg('rating');

  const reviewCount = await db('reviews')
    .where({ reviewId })
    .count('rating');

  const updatedRating = await db('rentals')
    .select('*')
    .where({ rentalId: reviewId })
    .update({
      avgRating: Math.round(avg[0].avg * 10) / 10,
      reviewCount: reviewCount[0].count
    })
    .returning('avgRating');

  res.json(updatedRating);
});

module.exports = router;
