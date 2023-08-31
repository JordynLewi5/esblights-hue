require('dotenv').config();
const Light = require('./src/Light.js');

const lightInfo1 = {
    bridgeIP: process.env.BRIDGEIP, // Hue Bridge IP
    username: process.env.USERNAME, // Hue Bridge Username
    id: 18 // Hue Light ID
}

// Hint: new Light(lightInfo, initial_power_state, [start_hour, end_hour], interval_time_in_ms);
// Start and end hours are in decimal form from 0 to 24.
new Light(lightInfo1, false, ['sunset', 3], 30 * 1000);