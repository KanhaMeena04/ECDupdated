const express = require('express');
const router = express.Router();
const https = require('https');

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyCN7XqyxOj5lgr2uaMNrTOg6PzHTOGa0xU';

function fetchGoogle(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// GET /api/location/reverse-geocode?lat=...&lng=...
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng required' });
    }
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;
    const data = await fetchGoogle(url);
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const topResult = data.results[0];
      return res.json({
        success: true,
        formatted_address: topResult.formatted_address,
        address_components: topResult.address_components,
        place_id: topResult.place_id,
        geometry: topResult.geometry,
      });
    }
    return res.json({ success: false, message: data.status, raw: data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/location/autocomplete?input=...
router.get('/autocomplete', async (req, res) => {
  try {
    const { input } = req.query;
    if (!input) return res.json({ success: true, predictions: [] });
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&components=country:in&key=${GOOGLE_API_KEY}`;
    const data = await fetchGoogle(url);
    return res.json({
      success: true,
      predictions: data.predictions || [],
      status: data.status,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/location/place-details?place_id=...
router.get('/place-details', async (req, res) => {
  try {
    const { place_id } = req.query;
    if (!place_id) return res.status(400).json({ success: false, message: 'place_id required' });
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${GOOGLE_API_KEY}`;
    const data = await fetchGoogle(url);
    return res.json({
      success: true,
      result: data.result || null,
      status: data.status,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
