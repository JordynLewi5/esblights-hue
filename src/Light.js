const Util = require('./Util.js');
const axios = require('axios');
const bridgeIP = '';
const username = 'kPaxKx0IAHRcoYJFqbEr9SmdJk4tieJAO1OdznEX';

class Light {
    /**
     * 
     * @param {Bool} powerIn 
     * @param {Array} colorIn
     * @param {Array} scheduleIn
     */
    constructor(lightInfo, powerIn, scheduleIn) {
        this.lightInfo = lightInfo;
        this.url = `http://${this.lightInfo.bridgeIP}/api/${this.lightInfo.username}/lights/${this.lightInfo.id}/state`;
        this.power = powerIn;
        this.schedule = scheduleIn;
        this.colorData = [];

        this.initialize();
    }

    /**
     * Initialize the light
     */
    async initialize() {
        this.colorData = await this.getColorData();
        console.log(this.colorData);
        this.scheduleLight();
    }

    /**
     * 
     * @param {Number} intervalTime 
     */
    cycleLights(intervalTime) {
        let i = 0;
        let interval = setInterval(() => {
            if (!this.power) clearInterval(interval);
            const color = this.colorData.xyzCodes[i++];
            this.setColor(color);
            if (i == this.colorData.xyzCodes.length) i = 0;
        }, intervalTime / (this.colorData.xyzCodes.length));
    
    }   

    /**
     * Schedules the next time the light will turn on and off
     */
    async scheduleLight() {
        const scheduleEvaluated = [
            this.schedule[0] == 'sunset' ? await Util.getSunset() : this.schedule[0], 
            this.schedule[1]
        ];
        
        const timeUntilOn = (scheduleEvaluated[0] > Util.getCurrentTimeInDecimal() ? scheduleEvaluated[0] - Util.getCurrentTimeInDecimal() : scheduleEvaluated[0] - Util.getCurrentTimeInDecimal() + 24);
        const timeUntilOff = (scheduleEvaluated[1] > Util.getCurrentTimeInDecimal() ? scheduleEvaluated[1] - Util.getCurrentTimeInDecimal() : scheduleEvaluated[1] - Util.getCurrentTimeInDecimal() + 24);

        console.log(`On time is in ${timeUntilOn} hours`);
        console.log(`Off time is in ${timeUntilOff} hours`);

        // Schedule the next day's on/off time
        // On time
        setTimeout(() => {
            this.setPower(true);
            this.cycleLights(2000)
        }, timeUntilOn * 60 * 60 * 1000);

        // Off time
        setTimeout(() => {
            this.setPower(false);

            setTimeout(() => {
                console.log('Scheduling next light cycle...')
                this.scheduleLight();
            }, 1000);
        }, timeUntilOff * 60 * 60 * 1000);
    }

    /**
     * Set the color data of the light
     * @returns {Object} The color data
    */
    async getColorData() {
        this.colorData = await Util.getLightData();
        return this.colorData;
    }

    /**
     * Set the color of the light
     * @param {Array} colorIn
     */
    async setColor(colorIn) {
        // set color from input
        this.updateLights({
            xy: [colorIn[0], colorIn[1]],
            bri: colorIn[2],
        });

        return colorIn;
    }

    /**
     * Set the power state of the light
     * @param {Number} powerIn
    */
    setPower(powerIn) {
        console.log('Light power set to ' + powerIn + '...');

        this.power = powerIn;
        this.updateLights({
            on: this.powerIn,
        });

        return this.power;
    }

    /**
     * Sends an update request to the Hue Bridge
     * @param {*} bodyIn 
     * @returns response
     */
    async updateLights(bodyIn) {
        try {
            return await axios.put(this.url, JSON.stringify(bodyIn), {
                headers: {
                    'Content-Type': 'application/json',
                }
            }).then(response => {
                return response.data;
            })
        } catch (error) {
            // console.log(error);
            console.log('Error updating light ' + this.lightInfo.id + '...')
        }
    }
}

module.exports = Light;