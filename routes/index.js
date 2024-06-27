const express = require('express');
const router = express.Router();
const faController = require('../controllers/fa.controller');

router.get('/v1/:model', faController.fa);
router.get('/v1/export/:model', faController.exportData);

module.exports = router;
