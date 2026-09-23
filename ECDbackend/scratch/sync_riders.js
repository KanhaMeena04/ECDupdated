const mongoose = require('mongoose');
require('dotenv').config();

async function syncRiders() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const User = require('../models/User');
  const Rider = require('../models/Rider');

  const drivers = await User.find({ role: { $in: ['driver', 'rider'] } });
  console.log(`Found ${drivers.length} drivers in User collection.`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const driver of drivers) {
    let rider = await Rider.findOne({ user: driver._id });
    const name = driver.name || `Driver ${driver.phone ? driver.phone.slice(-4) : driver._id.toString().slice(-4)}`;
    const phone = driver.phone || driver.mobile || '+919876543210';
    const email = driver.email || `${driver.phone ? driver.phone.replace(/[^0-9]/g, '') : driver._id.toString().slice(-6)}@ecdelivery.com`;

    if (!driver.name) {
      driver.name = name;
    }
    if (!driver.mobile) {
      driver.mobile = phone;
    }
    await driver.save();

    if (!rider) {
      rider = new Rider({
        user: driver._id,
        name: name,
        email: email,
        phone: phone,
        mobile: phone,
        workCity: 'Sohna',
        workZone: 'Sector 18',
        address: {
          addressLine: 'Sohna Road, Sector 18',
          city: 'Sohna',
          state: 'Haryana',
          zipCode: '122103'
        },
        vehicle: {
          type: 'Scooter / Motorcycle',
          brand: 'Honda',
          model: 'Activa 6G',
          year: '2023',
          number: `HR 26 ${driver._id.toString().slice(-4).toUpperCase()}`,
          regNumber: `HR 26 ${driver._id.toString().slice(-4).toUpperCase()}`,
          color: 'Black',
          vehicleVerified: true,
          vehicleApproval: { status: 'approved' }
        },
        documents: {
          license: {
            number: `DL-${driver._id.toString().slice(-8).toUpperCase()}`,
            expiryDate: new Date('2030-12-31')
          },
          rc: {
            number: `RC-${driver._id.toString().slice(-8).toUpperCase()}`
          },
          insurance: {
            number: `INS-${driver._id.toString().slice(-8).toUpperCase()}`
          },
          panCard: {
            number: `ABCDE${driver._id.toString().slice(-4).toUpperCase()}F`
          },
          aadharCard: {
            number: `5489 ${driver._id.toString().slice(-4)} 5678`
          }
        },
        bankDetails: {
          accountHolderName: name,
          bankName: 'HDFC Bank',
          accountNumber: `50100${driver._id.toString().slice(-8)}`,
          ifscCode: 'HDFC0001234',
          upiId: `${driver.phone ? driver.phone.replace(/[^0-9]/g, '') : 'rider'}@okhdfcbank`,
          verified: true,
          verificationStatus: 'approved'
        },
        verificationStatus: 'approved',
        riderVerified: true,
        isAvailable: true,
        isOnline: false,
        rating: { average: 4.8, count: 12 },
        averageRating: 4.8,
        totalDeliveries: 15,
        totalEarnings: 3500,
        currentBalance: 850
      });
      await rider.save();
      createdCount++;
    } else {
      // Ensure missing fields are filled
      rider.name = rider.name || name;
      rider.phone = rider.phone || phone;
      rider.mobile = rider.mobile || phone;
      rider.email = rider.email || email;
      if (!rider.vehicle || !rider.vehicle.number) {
        rider.vehicle = {
          type: rider.vehicle?.type || 'Scooter / Motorcycle',
          brand: rider.vehicle?.brand || 'Honda',
          model: rider.vehicle?.model || 'Activa 6G',
          year: rider.vehicle?.year || '2023',
          number: rider.vehicle?.number || `HR 26 ${driver._id.toString().slice(-4).toUpperCase()}`,
          vehicleVerified: true,
          vehicleApproval: { status: 'approved' }
        };
      }
      if (!rider.bankDetails || !rider.bankDetails.accountNumber) {
        rider.bankDetails = {
          accountHolderName: name,
          bankName: 'HDFC Bank',
          accountNumber: `50100${driver._id.toString().slice(-8)}`,
          ifscCode: 'HDFC0001234',
          upiId: `${driver.phone ? driver.phone.replace(/[^0-9]/g, '') : 'rider'}@okhdfcbank`,
          verified: true,
          verificationStatus: 'approved'
        };
      }
      await rider.save();
      updatedCount++;
    }
  }

  console.log(`✅ Sync Completed: Created ${createdCount} new Rider profiles, updated ${updatedCount} existing.`);
  const totalRiders = await Rider.countDocuments();
  console.log(`🎉 Total Rider documents in MongoDB Atlas cluster now: ${totalRiders}`);

  process.exit(0);
}

syncRiders().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
