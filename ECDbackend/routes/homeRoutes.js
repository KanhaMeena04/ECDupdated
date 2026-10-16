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

const { getRecommendedDishes, getSpecialDishes } = require('../controllers/homeCmsController');

router.get('/', optionalAuth, getHomeData);
router.get('/banners', optionalAuth, getBanners);
router.get('/categories', optionalAuth, getCategories);
router.get('/recommended', optionalAuth, getRecommendedRestaurants);
router.get('/recommended-dishes', optionalAuth, getRecommendedDishes);
router.get('/special-dishes', optionalAuth, getSpecialDishes);
router.get('/explore', optionalAuth, getExploreRestaurants);

module.exports = router;

