const fs = require('fs');
const content = fs.readFileSync('./controllers/riderController.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('getAllRiders') || line.includes('getPendingRiders') || line.includes('getRiderDetails') || line.includes('onboardRider')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
