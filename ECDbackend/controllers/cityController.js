const City = require('../models/City');
const ServiceArea = require('../models/ServiceArea');
const { getPaginationParams } = require('../utils/pagination');
const { formatCityForUser } = require('../utils/responseFormatter');

const HARYANA_CITIES = [
  'Sohna',
  'Gurugram',
  'Faridabad',
  'Panipat',
  'Ambala',
  'Karnal',
  'Hisar',
  'Rohtak',
  'Sonipat',
  'Panchkula',
  'Yamunanagar',
  'Rewari',
  'Bhiwani',
  'Sirsa',
  'Jind',
  'Jhajjar',
  'Kaithal',
  'Kurukshetra',
  'Charkhi Dadri',
  'Fatehabad',
  'Nuh',
  'Palwal',
  'Narnaul',
  'Mahendragarh',
  'Bahadurgarh',
  'Hansi',
  'Gohana',
  'Mandi Dabwali',
  'Tohana',
  'Narwana',
  'Kalka',
  'Shahbad',
  'Pehowa',
  'Pinjore',
  'Hodal',
  'Hathin',
  'Pataudi',
  'Manesar',
  'Ujina',
  'Sangel'
];

const seedHaryanaCities = async () => {
  try {
    for (const cityName of HARYANA_CITIES) {
      const existing = await City.findOne({
        name: { $regex: new RegExp(`^${cityName.trim()}$`, 'i') }
      });
      if (!existing) {
        await City.create({
          name: cityName.trim(),
          state: 'Haryana',
          country: 'India',
          isActive: true,
          isDefault: cityName.trim() === 'Sohna'
        });
      } else if (!existing.state) {
        existing.state = 'Haryana';
        await existing.save();
      }
    }
  } catch (err) {
    console.error('Error seeding Haryana cities:', err.message);
  }
};

exports.addCity = async (req, res) => {
  try {
    const { name, country, state = 'Haryana', isActive = true, isDefault = false, meta } = req.body;
    if (isDefault) {
      await City.updateMany({ country }, { $set: { isDefault: false } });
    }
    const city = await City.create({ name, country, state, isActive, isDefault, meta });
    res.status(201).json({ message: 'City created', city });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'City already exists for this country' });
    res.status(500).json({ message: error.message });
  }
};

exports.getAllCitiesAdmin = async (req, res) => {
  try {
    await seedHaryanaCities();
    
    // Fetch active service areas to connect city list with Service Areas
    const activeServiceAreas = await ServiceArea.find({ isServiceActive: true }).select('city state zone pincode');
    const activeCitySet = new Set(
      activeServiceAreas
        .map(a => (a.city || '').trim().toLowerCase())
        .filter(Boolean)
    );

    const isAll = req.query.limit === 'all' || req.query.all === 'true';
    const limitVal = isAll ? 1000 : (parseInt(req.query.limit) || 500);
    const pageVal = parseInt(req.query.page) || 1;
    const skipVal = (pageVal - 1) * limitVal;

    const search = req.query.search || '';
    const country = req.query.country;
    const isActive = req.query.isActive;
    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (country) query.country = country;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const total = await City.countDocuments(query);
    const rawCities = await City.find(query)
      .skip(skipVal)
      .limit(limitVal)
      .sort({ createdAt: -1 });

    const formattedCities = rawCities.map(c => {
      const cityNameLower = (c.name || '').trim().toLowerCase();
      const isServiceAvailable = activeCitySet.has(cityNameLower) || 
        activeServiceAreas.some(sa => (sa.city || '').toLowerCase().includes(cityNameLower) || cityNameLower.includes((sa.city || '').toLowerCase()));

      return {
        _id: c._id,
        name: c.name,
        state: c.state || 'Haryana',
        country: c.country || 'India',
        isActive: c.isActive !== false,
        isDefault: c.isDefault || false,
        isServiceAvailable,
        serviceStatusLabel: isServiceAvailable ? 'Services Available' : 'Service Not Available',
        displayName: isServiceAvailable ? `${c.name} 📍 (Services Available)` : c.name,
        zones: c.zones || []
      };
    });

    // Include any active Service Area cities that might not be in City model yet
    for (const sa of activeServiceAreas) {
      if (!sa.city) continue;
      const saCityLower = sa.city.trim().toLowerCase();
      const exists = formattedCities.some(f => f.name.trim().toLowerCase() === saCityLower);
      if (!exists) {
        formattedCities.push({
          _id: sa._id,
          name: sa.city,
          state: sa.state || 'Haryana',
          country: 'India',
          isActive: true,
          isDefault: false,
          isServiceAvailable: true,
          serviceStatusLabel: 'Services Available',
          displayName: `${sa.city} 📍 (Services Available)`,
          zones: []
        });
      }
    }

    // Sort: Active Service Area cities first, then alphabetically
    formattedCities.sort((a, b) => {
      if (a.isServiceAvailable && !b.isServiceAvailable) return -1;
      if (!a.isServiceAvailable && b.isServiceAvailable) return 1;
      return a.name.localeCompare(b.name);
    });

    res.status(200).json({
      cities: formattedCities,
      total: formattedCities.length,
      page: pageVal,
      limit: limitVal,
      pages: Math.ceil(formattedCities.length / limitVal)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCityById = async (req, res) => {
  try {
    const city = await City.findById(req.params.id);
    if (!city) return res.status(404).json({ message: 'City not found' });
    res.status(200).json(city);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCity = async (req, res) => {
  try {
    const { name, country, state, isActive, isDefault, meta } = req.body;
    if (isDefault) await City.updateMany({ country }, { $set: { isDefault: false } });
    const updated = await City.findByIdAndUpdate(req.params.id, { name, country, state, isActive, isDefault, meta }, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'City not found' });
    res.status(200).json({ message: 'City updated', city: updated });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'City already exists for this country' });
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCity = async (req, res) => {
  try {
    const deleted = await City.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'City not found' });
    res.status(200).json({ message: 'City deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPublicCities = async (req, res) => {
  try {
    await seedHaryanaCities();
    const activeServiceAreas = await ServiceArea.find({ isServiceActive: true }).select('city state zone pincode');
    const activeCitySet = new Set(
      activeServiceAreas
        .map(a => (a.city || '').trim().toLowerCase())
        .filter(Boolean)
    );

    const country = req.query.country;
    const query = { isActive: true };
    if (country) query.country = country;
    const cities = await City.find(query).sort({ name: 1 });
    
    const formattedCities = cities.map(c => {
      const cityNameLower = (c.name || '').trim().toLowerCase();
      const isServiceAvailable = activeCitySet.has(cityNameLower) || 
        activeServiceAreas.some(sa => (sa.city || '').toLowerCase().includes(cityNameLower) || cityNameLower.includes((sa.city || '').toLowerCase()));
      
      return {
        _id: c._id,
        name: c.name,
        state: c.state || 'Haryana',
        country: c.country || 'India',
        isActive: c.isActive,
        isDefault: c.isDefault,
        isServiceAvailable,
        serviceStatusLabel: isServiceAvailable ? 'Services Available' : 'Service Not Available',
        displayName: isServiceAvailable ? `${c.name} 📍 (Services Available)` : c.name,
        zones: c.zones || []
      };
    });

    formattedCities.sort((a, b) => {
      if (a.isServiceAvailable && !b.isServiceAvailable) return -1;
      if (!a.isServiceAvailable && b.isServiceAvailable) return 1;
      return a.name.localeCompare(b.name);
    });

    res.status(200).json(formattedCities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.addZone = async (req, res) => {
  try {
    const { cityId } = req.params;
    const { name, isActive = true, deliveryCharges = [], polygon, center, meta } = req.body;
    const city = await City.findById(cityId);
    if (!city) return res.status(404).json({ message: 'City not found' });
    city.zones.push({ name, isActive, deliveryCharges, polygon, center, meta, createdBy: req.user._id });
    await city.save();
    res.status(201).json({ message: 'Zone added', zone: city.zones[city.zones.length - 1] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getZonesByCityAdmin = async (req, res) => {
  try {
    const { cityId } = req.params;
    const search = req.query.search || '';
    const city = await City.findById(cityId).select('zones name country');
    if (!city) return res.status(404).json({ message: 'City not found' });
    let zones = city.zones || [];
    if (search) zones = zones.filter(z => z.name.toLowerCase().includes(search.toLowerCase()));
    res.status(200).json({ city: { _id: city._id, name: city.name }, zones });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getZoneById = async (req, res) => {
  try {
    const { id } = req.params; // zone id
    const city = await City.findOne({ 'zones._id': id }, { 'zones.$': 1, name: 1 });
    if (!city || !city.zones || city.zones.length === 0) return res.status(404).json({ message: 'Zone not found' });
    const zone = city.zones[0];
    res.status(200).json({ city: { _id: city._id, name: city.name }, zone });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.updateZone = async (req, res) => {
  try {
    const { id } = req.params; // zone id
    const { name, isActive, deliveryCharges, polygon, center, meta } = req.body;
    const city = await City.findOne({ 'zones._id': id });
    if (!city) return res.status(404).json({ message: 'Zone not found' });
    const zone = city.zones.id(id);
    if (!zone) return res.status(404).json({ message: 'Zone not found' });
    if (name !== undefined) zone.name = name;
    if (isActive !== undefined) zone.isActive = isActive;
    if (deliveryCharges !== undefined) zone.deliveryCharges = deliveryCharges;
    if (polygon !== undefined) zone.polygon = polygon;
    if (center !== undefined) zone.center = center;
    if (meta !== undefined) zone.meta = meta;
    zone.updatedBy = req.user._id;
    await city.save();
    res.status(200).json({ message: 'Zone updated', zone });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.deleteZone = async (req, res) => {
  try {
    const { id } = req.params; // zone id
    const city = await City.findOne({ 'zones._id': id });
    if (!city) return res.status(404).json({ message: 'Zone not found' });
    city.zones.id(id).remove();
    await city.save();
    res.status(200).json({ message: 'Zone deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getPublicZones = async (req, res) => {
  try {
    const { city } = req.query;
    const query = { 'isActive': true };
    if (city) query._id = city;
    const cities = await City.find(city ? { _id: city } : {}).select('name zones');
    const result = [];
    for (const c of cities) {
      const zones = (c.zones || []).filter(z => z.isActive);
      for (const z of zones) result.push({ city: { _id: c._id, name: c.name }, zone: z });
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.lookupZoneByPoint = async (req, res) => {
  try {
    const { long, lat, city } = req.body;
    if (long === undefined || lat === undefined) return res.status(400).json({ message: 'long and lat required' });
    const point = { type: 'Point', coordinates: [ Number(long), Number(lat) ] };
    const match = city ? { _id: mongoose.Types.ObjectId(city) } : {};
    const agg = [
      { $match: match },
      { $unwind: '$zones' },
      { $match: { 'zones.polygon': { $geoIntersects: { $geometry: point } } } },
      { $project: { city: { _id: '$_id', name: '$name' }, zone: '$zones' } },
      { $limit: 1 }
    ];
    const found = await City.aggregate(agg);
    if (!found || found.length === 0) return res.status(404).json({ message: 'No zone found for this point' });
    res.status(200).json(found[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
