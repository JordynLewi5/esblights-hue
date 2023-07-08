const axios = require('axios');
const bridgeIP = '192.168.123.253';
const username = 'kPaxKx0IAHRcoYJFqbEr9SmdJk4tieJAO1OdznEX';
require('dotenv').config();

let colorSlideInterval; // Declare the colorSlideInterval variable here

// Main
(async () => {
    cycleLights(18, await getHexCodes());

    // Every 1 hour check for new color array and
    // cycle through the colors over a set interval
    // for each color.
    setInterval(async () => {
        cycleLights(18, await getHexCodes());
    }, 3600000);
})();

// Rest of the code...

/**
 * Cycles through the colors in the hexCodes array and apply the color to
 * the corresponding light.
 * @param {*} id
 * @param {*} hexCodes
 */
function cycleLights(id, hexCodes) {
    let i = 0;
    try {
        clearInterval(colorSlideInterval); // Clear the previous interval
    } catch (error) {
        // Do nothing
    }
    colorSlideInterval = setInterval(async () => {
        setLightProperties(id, hexCodes[i++], 254)
            .then((successMessage) => {
                console.log('success message:', successMessage);
            });

        if (i > hexCodes.length - 1) i = 0;
    }, 3000);
}

/**
 * Returns the hex codes from our ESBLIGHTS API.
 * @returns Hex codes
 */
async function getHexCodes() {
    const response = await axios.get(`http://esblight-api.uvtywtylvd-zqy3jy2wn3kg.p.temp-site.link/api/esb-light-data?apikey=${process.env.ESBAPIKEY}`);
    const data = response.data;
    return data.content[0];
}

/**
 * Convert hex codes to XY values.
 * @param {} hex
 * @returns XY values
 */
function hexToXY(hex) {
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
    const y = gammaCorrectedRGB[0] * 0.212656 + gammaCorrectedRGB[1] * 0.715158 + gammaCorrectedRGB[2] * 0.072186;

    if (y == 0) y = 0.01;
    return y;
}

/**
 * Get light properties
 * @param {int} id
 * @returns response
 */
function getLightProperties(id) {
    return axios.get(`http://${bridgeIP}/api/${username}/lights/${id}`)
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
 * Set light properties
 * @param {*} id
 * @param {*} hexCode
 * @returns response
 */
function setLightProperties(id, hexCode) {
    const xy = hexToXY(hexCode);
    const bri = Math.round(calculateBrightness(hexCode) * 254);

    return axios.put(`http://${bridgeIP}/api/${username}/lights/${id}/state`, {
            on: true,
            xy: xy,
            bri: bri,
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
 * Set light properties
 * @param {*} id 
 * @param {*} hexCode 
 * @param {*} bri
 * @returns response
 */
function setLightProperties(id, hexCode, bri) {
    const url = `http://${bridgeIP}/api/${username}/lights/${id}/state`;
    const body = JSON.stringify({
        on: true,
        xy: hexToXY(hexCode),
        bri: bri,
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