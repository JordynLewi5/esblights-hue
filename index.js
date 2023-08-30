const Util = require('./src/Util.js');
const Light = require('./src/Light.js');

const lightInfo1 = {
    bridgeIP: '192.168.123.253',
    username: 'kPaxKx0IAHRcoYJFqbEr9SmdJk4tieJAO1OdznEX',
    id: 18
}

// Hint: new Light(lightInfo, initial_power_state, [start_hour, end_hour], interval_time_in_ms);
new Light(lightInfo1, false, ['sunset', 3], 30 * 1000);