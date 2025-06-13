const express = require('express');
const router = express.Router();
const { analyzeText, addKeyword } = require('../controllers/seoController');

// Analyze text for SEO improvements
router.post('/analyze', analyzeText);

// Add a keyword to the original text
router.post('/add-keyword', addKeyword);

module.exports = router;
