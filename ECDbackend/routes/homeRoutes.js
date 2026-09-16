const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/authMiddleware');
const { 
	getHomeData, 
	getBanners, 
	getCategories, 
	getRecommendedRestaurants, 
	getExploreRestaurants 
} = require('../controllers/homeController');

router.get('/', optionalAuth, getHomeData);
router.get('/banners', optionalAuth, getBanners);
router.get('/categories', optionalAuth, getCategories);
router.get('/recommended', optionalAuth, getRecommendedRestaurants);
router.get('/explore', optionalAuth, getExploreRestaurants);

module.exports = router;

