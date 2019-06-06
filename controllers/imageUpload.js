const express = require('express');
const router = express.Router();
const upload = require('../services/imageUpload');

const singleUpload = upload.single('image');

router.post('/', (req, res) => {
  
  singleUpload(req, res, err => {
    if (err) {
      return res.status(400).json({ errors: [{ param: 'imageUpload', msg: err.message }] });
    }
    return res.json(req.file.location);
  });
});

module.exports = router;
