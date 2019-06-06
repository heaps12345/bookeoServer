const aws = require('aws-sdk');
const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3');
const config = require('../config');

aws.config.update({
  secretAccessKey: config.AWS_SecretAccessKey,
  accessKeyId: config.AWS_AccessKey,
  region: 'us-east-2'
});

const s3 = new aws.S3({});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type, only JPEG and PNG is aloud'), false);
  }
};

const upload = multer({
  fileFilter,
  storage: multerS3({
    s3,
    acl: 'public-read',
    bucket: 'travel-app-1',
    metadata: function(req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function(req, file, cb) {
      cb(null, Date.now().toString());
    }
  })
});

module.exports = upload;
