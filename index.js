const Light = require('./src/Light.js');
const Util = require('./src/Util.js');

const lightData = {
    bridgeIP: '192.168.123.253',
    username: 'kPaxKx0IAHRcoYJFqbEr9SmdJk4tieJAO1OdznEX',
    id: 5
}

light = new Light(lightData, true, [Util.getCurrentTimeInDecimal() + 0.001, Util.getCurrentTimeInDecimal() + 0.01]);