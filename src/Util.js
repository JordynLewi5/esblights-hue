const axios = require('axios');
require('dotenv').config();

class Util {
    /**
     * Fetch the light data from the ESB Lights API
     * @returns {Object} The light data
     */
    static async getLightData() {
        return (await axios.get(`https://esblight-api.kinetic.com/api/esb-light-data?apikey=${process.env.ESBAPIKEY}`)).data.content;
    }
    
    /**
     * Fetch the time of the next sunset in terms of the hour in decimal form.
     * @returns {Number} The time of the next sunset
     */
    static async getSunset() {
        // Get tomorrow's date in YYYY-MM-DD format
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const year = tomorrow.getFullYear();
        const month = tomorrow.getMonth() + 1;
        const day = tomorrow.getDate();

        return await axios.get(`https://api.sunrisesunset.io/json?lat=33.500280&lng=-86.792912&&date=${year}-${month}-${day}`)
            .then((response) => {
                return parseFloat(
                    response.data.results.sunset.split(':')[0]) + 
                    parseFloat(response.data.results.sunset.split(':')[1])/60 + 12;
            })
    }

    /**
     * Gets current time in terms of the hour in decimal form.
     * @returns {Number} decimalTime
     */
    static getCurrentTimeInDecimal() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const decimalTime = hours + minutes / 60 + seconds / 3600;
        return decimalTime;
    }
}

module.exports = Util;