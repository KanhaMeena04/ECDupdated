const express = require('express');
const router = express.Router();
const ServiceArea = require('../models/ServiceArea');
const { protect, admin } = require('../middleware/authMiddleware');

// Public/App: Get active service areas
router.get('/active', async (req, res) => {
  try {
    const areas = await ServiceArea.find({ isServiceActive: true }).sort({ state: 1, city: 1, zone: 1 });
    res.json({ success: true, count: areas.length, areas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Public/App: Check serviceability by pincode, city, zone, or lat/lng
router.all(['/check', '/check-serviceability'], async (req, res) => {
  try {
    const body = req.method === 'GET' ? req.query : req.body;
    const { pincode, city, zone, lat, lng, address } = body;

    const allActive = await ServiceArea.find({ isServiceActive: true });
    
    // If no service areas defined in system yet, allow service by default
    if (allActive.length === 0) {
      return res.json({
        success: true,
        isServiceable: true,
        serviceable: true,
        message: 'Default coverage active across all areas',
        serviceAreas: []
      });
    }

    let matchedArea = null;

    // 1. Match by pincode if provided or extracted from address
    let searchPincode = pincode ? pincode.toString().trim() : '';
    if (!searchPincode && address) {
      const match = address.toString().match(/\b\d{6}\b/);
      if (match) searchPincode = match[0];
    }

    if (searchPincode) {
      matchedArea = allActive.find(a => a.pincode === searchPincode);
    }

    // 2. Match by Zone or City name
    if (!matchedArea && (zone || city || address)) {
      const searchTerms = [zone, city, address].filter(Boolean).map(s => s.toString().toLowerCase());
      matchedArea = allActive.find(a => {
        const aZone = (a.zone || '').toLowerCase();
        const aCity = (a.city || '').toLowerCase();
        const aDistrict = (a.district || '').toLowerCase();
        return searchTerms.some(term => 
          (aZone && (term.includes(aZone) || aZone.includes(term))) || 
          (aCity && (term.includes(aCity) || aCity.includes(term))) || 
          (aDistrict && (term.includes(aDistrict) || aDistrict.includes(term)))
        );
      });
    }

    // 3. Match by Coordinates distance (if coords provided)
    if (!matchedArea && lat && lng) {
      const userLat = Number(lat);
      const userLng = Number(lng);
      for (const area of allActive) {
        if (area.coordinates && area.coordinates.lat && area.coordinates.lng) {
          const dLat = (userLat - area.coordinates.lat) * 111;
          const dLng = (userLng - area.coordinates.lng) * 111 * Math.cos(userLat * Math.PI / 180);
          const distanceKm = Math.sqrt(dLat * dLat + dLng * dLng);
          if (distanceKm <= (area.deliveryRadiusKm || 25)) {
            matchedArea = area;
            break;
          }
        }
      }
    }

    if (matchedArea) {
      return res.json({
        success: true,
        isServiceable: true,
        serviceable: true,
        area: matchedArea,
        message: `Service is active in ${matchedArea.zone || matchedArea.city} (${matchedArea.pincode || ''})`,
        deliveryFee: matchedArea.baseDeliveryFee,
        minimumOrderValue: matchedArea.minimumOrderValue
      });
    }

    return res.json({
      success: true,
      isServiceable: false,
      serviceable: false,
      message: 'We are not providing service in your location right now. We are coming soon!',
      serviceablePincodes: allActive.map(a => a.pincode),
      serviceableAreas: allActive.map(a => `${a.zone || a.city}, ${a.district} (${a.pincode})`)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin / App: Get all service areas
router.get('/', async (req, res) => {
  try {
    const areas = await ServiceArea.find().sort({ state: 1, city: 1, zone: 1 });
    res.json({ success: true, count: areas.length, areas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Add service area
router.post('/', async (req, res) => {
  try {
    const { state, district, city, zone, village, pincode, deliveryRadiusKm, baseDeliveryFee, minimumOrderValue, peakCharge, lat, lng, coordinates } = req.body;
    if (!state || !district || !city || !zone || !pincode) {
      return res.status(400).json({ success: false, message: 'State, District, City, Zone, and Pincode are required' });
    }

    const areaLat = Number(lat || (coordinates && coordinates.lat) || 0);
    const areaLng = Number(lng || (coordinates && coordinates.lng) || 0);

    // Check if duplicate area exists
    const existing = await ServiceArea.findOne({
      city: new RegExp(`^${city.trim()}$`, 'i'),
      zone: new RegExp(`^${zone.trim()}$`, 'i'),
      pincode: pincode.toString().trim()
    });

    if (existing) {
      existing.isServiceActive = true;
      existing.deliveryRadiusKm = Number(deliveryRadiusKm) || existing.deliveryRadiusKm || 25;
      existing.baseDeliveryFee = Number(baseDeliveryFee) || existing.baseDeliveryFee || 30;
      existing.minimumOrderValue = Number(minimumOrderValue) || existing.minimumOrderValue || 100;
      existing.state = state.trim();
      existing.district = district.trim();
      existing.village = village ? village.trim() : existing.village;
      if (areaLat && areaLng) {
        existing.coordinates = { lat: areaLat, lng: areaLng };
      }
      await existing.save();
      return res.status(200).json({ success: true, message: 'Service area updated successfully', area: existing });
    }

    const area = new ServiceArea({
      state: state.trim(),
      district: district.trim(),
      city: city.trim(),
      zone: zone.trim(),
      village: village ? village.trim() : '',
      pincode: pincode.toString().trim(),
      deliveryRadiusKm: Number(deliveryRadiusKm) || 25,
      baseDeliveryFee: Number(baseDeliveryFee) || 30,
      minimumOrderValue: Number(minimumOrderValue) || 100,
      peakCharge: Number(peakCharge) || 0,
      coordinates: { lat: areaLat, lng: areaLng },
      isServiceActive: true,
      createdBy: req.user ? req.user._id : null
    });
    await area.save();
    res.status(201).json({ success: true, message: 'Service area created successfully', area });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Admin: Update service area
router.put('/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.body.lat !== undefined && req.body.lng !== undefined) {
      updateData.coordinates = { lat: Number(req.body.lat), lng: Number(req.body.lng) };
    }
    const area = await ServiceArea.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!area) return res.status(404).json({ success: false, message: 'Service area not found' });
    res.json({ success: true, message: 'Service area updated successfully', area });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Admin: Toggle service area active switch
router.patch('/:id/toggle', async (req, res) => {
  try {
    const area = await ServiceArea.findById(req.params.id);
    if (!area) return res.status(404).json({ success: false, message: 'Service area not found' });
    area.isServiceActive = !area.isServiceActive;
    await area.save();
    res.json({ success: true, message: `Service area ${area.isServiceActive ? 'activated' : 'deactivated'}`, area });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Delete service area
router.delete('/:id', async (req, res) => {
  try {
    const area = await ServiceArea.findByIdAndDelete(req.params.id);
    if (!area) return res.status(404).json({ success: false, message: 'Service area not found' });
    res.json({ success: true, message: 'Service area deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
