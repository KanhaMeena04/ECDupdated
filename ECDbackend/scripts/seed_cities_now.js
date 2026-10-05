const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const City = require('../models/City');

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

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected!');

    let addedCount = 0;
    for (const cityName of HARYANA_CITIES) {
      const res = await City.updateOne(
        { name: { $regex: new RegExp(`^${cityName.trim()}$`, 'i') } },
        {
          $set: {
            name: cityName,
            state: 'Haryana',
            country: 'India',
            isActive: true
          },
          $setOnInsert: {
            isDefault: cityName === 'Sohna'
          }
        },
        { upsert: true }
      );
      if (res.upsertedCount > 0) addedCount++;
    }

    console.log(`✅ Haryana cities successfully synced to MongoDB Atlas! Total cities checked/updated: ${HARYANA_CITIES.length}`);
    const allCities = await City.find().select('name state isActive');
    console.log(`Current Total Cities in DB: ${allCities.length}`);
    console.log('Sample Cities:', allCities.map(c => c.name).slice(0, 15));

    process.exit(0);
  } catch (err) {
    console.error('Error seeding cities:', err);
    process.exit(1);
  }
}

seed();
