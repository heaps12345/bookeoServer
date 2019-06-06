const express = require('express');
const router = express.Router();
const config = require('config');
const db = require('../config/db');
const moment = require('moment');

const { check, validationResult } = require('express-validator/check');

router.post('/new', async (req, res) => {
  const { startAt, dates, endAt, bookingId, totalPrice, days, guests, booking, rental, userId } = req.body;

  if (isValidBooking(booking, rental)) {
    if (userId === rental.ownerId) {
      return res.status(400).json({ errors: [{ param: 'dates', msg: 'Rental Owner cannot book their own place.' }] });
    }

    const trxResult = await db.transaction(async trx => {
      const bookingInfo = await trx
        .insert({
          bookingId,
          totalPrice: booking.totalPrice,

          days: booking.days,
          guests: booking.guests,
          startAt: booking.startAt,
          endAt: booking.endAt,
          userId,
          createdAt: new Date()
        })
        .into('booking')
        .returning(['startAt', 'endAt', 'bookingId']);

      const updateBooking = await trx('rentals')
        .where({ rentalId: bookingInfo[0].bookingId })

        .update({
          starting: db.raw('array_append(starting, ?)', [bookingInfo[0].startAt]),
          ending: db.raw('array_append(ending, ?)', [bookingInfo[0].endAt])
        })
        .returning(['starting', 'ending', 'rentalId']);

      res.json(updateBooking);
      trx.commit;
      trx.rollback;
    });
  }

  function isValidBooking(proposedBooking, rental) {
    let isValid = true;

    if (rental.starting && rental.ending) {
      for (let i = 0; i < rental.starting.length; i++) {
        const proposedStart = moment(proposedBooking.startAt).format('YYYY-MM-DD');
        const proposedEnd = moment(proposedBooking.endAt).format('YYYY-MM-DD');

        const actualStart = moment(rental.starting[i]).format('YYYY-MM-DD');
        const actualEnd = moment(rental.ending[i]).format('YYYY-MM-DD');

        if (
          (actualStart < proposedStart && actualEnd < proposedStart) ||
          (proposedEnd < actualEnd && proposedEnd < actualStart)
        ) {
          isValid = true;
        } else {
          return res.status(400).json({ errors: [{ param: 'dates', msg: 'Those dates have already been booked' }] });
        }
      }
    }
    return isValid;
  }
});

router.put('/manage/:id', async (req, res) => {
  const { userId, bookingId, rentalId } = req.body;
  try {
    const data = await db('rentals')
      .select('title', 'city', 'description', 'category')
      .join('booking', 'bookingId', '=', 'rentalId')
      .select('*')
      .from('rentals')
      .where({ userId: req.params.id });
    res.json(data);
  } catch (err) {
    return res.status(400).json({ errors: [{ param: 'manage', msg: 'problem getting bookings' }] });
  }
});

module.exports = router;
