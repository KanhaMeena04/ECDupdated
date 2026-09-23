const riderController = require('../controllers/riderController');
const authController = require('../controllers/authController');

console.log('--- RIDER CONTROLLER EXPORTS (' + Object.keys(riderController).length + ') ---');
console.log(Object.keys(riderController));

console.log('--- AUTH CONTROLLER EXPORTS (' + Object.keys(authController).length + ') ---');
console.log(Object.keys(authController));
