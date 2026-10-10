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

// GET /api/location/directions?originLat=...&originLng=...&destLat=...&destLng=...
router.get('/directions', async (req, res) => {
  try {
    const { originLat, originLng, destLat, destLng } = req.query;
    if (!originLat || !originLng || !destLat || !destLng) {
      return res.status(400).json({ success: false, message: 'originLat, originLng, destLat, and destLng required' });
    }

    // 1. Google Directions API
    try {
      const googleUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=driving&key=${GOOGLE_API_KEY}`;
      const googleData = await fetchGoogle(googleUrl);
      if (googleData.status === 'OK' && googleData.routes && googleData.routes.length > 0) {
        const polyline = googleData.routes[0].overview_polyline?.points;
        const duration = googleData.routes[0].legs?.[0]?.duration?.text;
        const distance = googleData.routes[0].legs?.[0]?.distance?.text;
        return res.json({
          success: true,
          points: polyline,
          duration,
          distance,
          source: 'google'
        });
      }
    } catch (e) {
      console.error('Google directions fetch error:', e.message);
    }

    // 2. High-speed OSRM fallback with User-Agent
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=polyline`;
      const osrmData = await new Promise((resolve, reject) => {
        const reqOSRM = https.get(osrmUrl, {
          headers: { 'User-Agent': 'ECDKartApp/1.0' },
          timeout: 5000
        }, (resp) => {
          let body = '';
          resp.on('data', chunk => body += chunk);
          resp.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch (err) {
              reject(err);
            }
          });
        });
        reqOSRM.on('error', reject);
        reqOSRM.on('timeout', () => {
          reqOSRM.destroy();
          reject(new Error('OSRM timeout'));
        });
      });

      if (osrmData.code === 'Ok' && osrmData.routes && osrmData.routes.length > 0) {
        const polyline = osrmData.routes[0].geometry;
        const distanceMeters = osrmData.routes[0].distance;
        const durationSecs = osrmData.routes[0].duration;
        return res.json({
          success: true,
          points: polyline,
          duration: `${Math.round(durationSecs / 60)} mins`,
          distance: `${(distanceMeters / 1000).toFixed(1)} km`,
          source: 'osrm'
        });
      }
    } catch (e) {
      console.error('OSRM fetch error:', e.message);
    }

    return res.status(500).json({ success: false, message: 'Could not fetch road directions' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
