const axios = require('axios');
const bridgeIP = '192.168.123.253';
const username = 'kPaxKx0IAHRcoYJFqbEr9SmdJk4tieJAO1OdznEX';

require('dotenv').config();

// MAIN
(async function main() {    
    await lightOn(18, false);
    await lightOn(18, true);

    let id = 18;
    // number between 0 and 1 please.
    let boostFactor = 1;

    // Manage hours of operation
    let [start, end] = [await axios.get('https://api.sunrisesunset.io/json?lat=33.500280&lng=-86.792912')
    .then((response) => {
        return parseFloat(
            response.data.results.sunset.split(':')[0]) + 
            parseFloat(response.data.results.sunset.split(':')[1])/60 + 12;
    }), 3];

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const decimalTime = hours + (minutes / 60) + (seconds / 3600);   

    if (decimalTime >= start || decimalTime < end) {
        // Turn on light
        lightOn(id, true);
        // Cycle through the colors
        cycleLights(id, await getHexCodes(), boostFactor);
    } else {
        // Turn off light
        lightOn(id, false);
    }

    // Every 1 hour check for new color array and
    // cycle through the colors over a set interval
    // for each color.
    setInterval(async () => {


        if (decimalTime >= start || decimalTime < end) {
            // Turn on light
            lightOn(id, true);
            // Cycle through the colors
            cycleLights(id, await getHexCodes(), boostFactor);
        } else {
            // Turn off light
            lightOn(id, false);
        }
    }, 3600000);
})();
// END OF MAIN

// METHODS
function lightOn(id, on) {
    return axios.put(`http://${bridgeIP}/api/${username}/lights/${id}/state`, {
            on: on
        })
        .then((response) => {
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error('Something went wrong');
            }
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Cycles through the colors in the hexCodes array and apply the color to
 * the corresponding light.
 * @param {*} id
 * @param {*} hexCodes
 */
function cycleLights(id, hexCodes, boostFactor) {

    // hexCodes[0] = "#000000"
    // for (let n = 0; n < 99; n++) {
    //     //push a random color to the array
    //     hexCodes.push(`#${Math.floor(Math.random()*16777215).toString(16)}`);
    // }

    let i = 0;

    try {
        clearInterval(colorSlideInterval); // Clear the previous interval
    } catch (error) {
        // Do nothing
    }

    colorSlideInterval = setInterval(async () => {
        setLightProperties(id, hexCodes[i], boostFactor)
        
        i++;
        if (i >= hexCodes.length) i = 0;
    }, 20 * 1000 / (hexCodes.length));
}

/**
 * Converts hex code to RGB.
 * @param {String} hex 
 * @returns {array} [r, g, b]
 */
function hexToRGB(hex) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
  }

/**
 * Returns the hex codes from our ESBLIGHTS API.
 * @returns Hex codes
 */
async function getHexCodes() {
    const response = await axios.get(`https://esblight-api.kinetic.com/api/esb-light-data?apikey=${process.env.ESBAPIKEY}`);
    const data = response.data;
    return data.content.hexCodes;
}

/**
 * Returns the brightest from our ESBLIGHTS API.
 * @returns birghtest
 */
async function getBrightest() {
    const response = await axios.get(`https://esblight-api.kinetic.com/api/esb-light-data?apikey=${process.env.ESBAPIKEY}`);
    const data = response.data;
    let zArr = [];
    data.content.xyzCodes.forEach((xyz) => { 
        zArr.push(xyz[2] * 254);
    });

    const brightest = Math.round(Math.max(...zArr));
    return brightest;
}

/**
 * Convert hex codes to XY values.
 * @param {} hex
 * @returns XY values
 */
function hexToXY(hex) {
    // Convert hex color code to RGB
    let rgb = hex
        .replace(/^#/, '')
        .match(/.{1,2}/g)
        .map((color) => parseInt(color, 16));

    colorSequence = `\x1b[38;2;${rgb.join(';')}m`;
    resetSequence = '\x1b[0m';
    console.log(colorSequence + "Boom!" + resetSequence);

    // Make sure no values are 0
    if (rgb[0] <= 0) rgb[0] = .001;
    if (rgb[1] <= 0) rgb[1] = .001;
    if (rgb[2] <= 0) rgb[2] = .001;

    // Normalize the RGB values
    const normalizedRGB = rgb.map((value) => value / 255);

    // Apply gamma correction to the RGB values
    const gammaCorrectedRGB = normalizedRGB.map((value) =>
        value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    );

    // Convert gamma corrected RGB to XYZ
    const x = gammaCorrectedRGB[0] * 0.664511 + gammaCorrectedRGB[1] * 0.154324 + gammaCorrectedRGB[2] * 0.162028;
    const y = gammaCorrectedRGB[0] * 0.283881 + gammaCorrectedRGB[1] * 0.668433 + gammaCorrectedRGB[2] * 0.047685;
    const z = gammaCorrectedRGB[0] * 0.000088 + gammaCorrectedRGB[1] * 0.072310 + gammaCorrectedRGB[2] * 0.986039;

    // Calculate XY values
    const sum = x + y + z;
    const xy = [x / sum, y / sum];

    return xy;
}

/**
 * Calculate the brightness of a color in the CIE 1931 XY color space.
 * @param {string} hex - The hexadecimal color code.
 * @returns {number} The brightness value (Y component) of the color.
 */
function calculateBrightness(hex) {
    // Convert hex color code to RGB
    const rgb = hex
        .replace(/^#/, '')
        .match(/.{1,2}/g)
        .map((color) => parseInt(color, 16));

    // Normalize the RGB values
    const normalizedRGB = rgb.map((value) => value / 255);

    // Apply gamma correction to the RGB values
    const gammaCorrectedRGB = normalizedRGB.map((value) =>
        value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    );

    // Calculate the brightness (Y component) in XYZ color space
    let y = gammaCorrectedRGB[0] * 0.212656 + gammaCorrectedRGB[1] * 0.715158 + gammaCorrectedRGB[2] * 0.072186;

    if (y == 0) y = 0.001;

    return y;
}

/**
 * Set light properties
 * @param {*} id
 * @param {*} hexCode
 * @returns response
 */
async function setLightProperties(id, hexCode, boostFactor) {
    // Calibrate
    let briBoost = Math.round((254 - await getBrightest()) * boostFactor);
    let xy = hexToXY(hexCode);

    // xy = [xy[0] + 0.15, xy[1] - 0.1] // Normalize the color to appear warmer

    const url = `http://${bridgeIP}/api/${username}/lights/${id}/state`;
    const body = JSON.stringify({
        xy: xy,
        bri: Math.round(calculateBrightness(hexCode) * 254) + briBoost,
        // ct: 500,
    });

    return axios.put(url, body, {
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            return response.data;
        })
        .catch(error => {
            console.log(error);
        });
}