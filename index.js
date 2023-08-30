const Util = require('./src/Util.js');
const Light = require('./src/Light.js');

const lightInfo1 = {
    bridgeIP: '192.168.123.253',
    username: 'kPaxKx0IAHRcoYJFqbEr9SmdJk4tieJAO1OdznEX',
    id: 5
}

// Follow this guide linenew Light(lightInfo, initial_power_state, [start_hour, end_hour], interval_time_in_ms);
light = new Light(lightInfo1, false, ['sunset', Util.getCurrentTimeInDecimal() + 0.001], 30 * 1000);
