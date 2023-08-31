const Util = require('./Util.js');
const axios = require('axios');

class Light {
    // CONSTRUCTOR
    /**
     * Creates a new Light object to control a Hue Light
     * @param {Object} lightInfo 
     * @param {Boolean} powerIn 
     * @param {Array} scheduleIn 
     * @param {Number} intervalTimeIn 
     */
    constructor(lightInfo, powerIn, scheduleIn, intervalTimeIn) {
        this.lightInfo = lightInfo;
        this.power = powerIn;
        this.setPower(this.power)
        this.schedule = scheduleIn;
        this.intervalTime = intervalTimeIn;
        this.colorData = [];

        this.initialize();
    }

    // METHODS

    /**
     * Initialize the light
     */
    async initialize() {
        await this.updateColorData();
        this.startESBLightUpdateCycle();
        this.scheduleLight();
    }


    /**
     * Cycles through the colors in the colorData.xyzCodes array
     * @param {Number} intervalTime 
     */
    cycleLights(intervalTime) {
        let i = 0;
        this.setColor(this.colorData.xyzCodes[i++]);
        if (i == this.colorData.xyzCodes.length) i = 0;
        let interval = setInterval(() => {
            if (!this.power) clearInterval(interval);
            if (this.power) this.setColor(this.colorData.xyzCodes[i++]);
            if (i == this.colorData.xyzCodes.length) i = 0;
        }, intervalTime / (this.colorData.xyzCodes.length));
    
    }   

    /**
     * Updates the color data every hour
     */
    startESBLightUpdateCycle() {
        setInterval(() => {
            this.updateColorData();
        }, 60 * 60 * 1000);
    }

    /**
     * Schedules the next time the light will turn on and off
     * 
     */
    async scheduleLight() {
        const scheduleEvaluated = [
            this.schedule[0] == 'sunset' ? await Util.getSunset() : this.schedule[0], 
            this.schedule[1]
        ];
        // If the current time is within the scheduled time, turn the light on
        if (scheduleEvaluated[0] < scheduleEvaluated[1]) {
            if (Util.getCurrentTimeInDecimal() > scheduleEvaluated[0] && Util.getCurrentTimeInDecimal() < scheduleEvaluated[1]) {
                this.setPower(true);
                this.cycleLights(this.intervalTime)
            }
        } else {
            if (Util.getCurrentTimeInDecimal() > scheduleEvaluated[0] || Util.getCurrentTimeInDecimal() < scheduleEvaluated[1]) {
                this.setPower(true);
                this.cycleLights(this.intervalTime)
            }
        }
        // Calculate the time until the next on/off time
        const timeUntilOn = (
            scheduleEvaluated[0] > Util.getCurrentTimeInDecimal() ? scheduleEvaluated[0] - Util.getCurrentTimeInDecimal() : scheduleEvaluated[0] - Util.getCurrentTimeInDecimal() + 24
        );
        const timeUntilOff = (
            scheduleEvaluated[1] > Util.getCurrentTimeInDecimal() ? scheduleEvaluated[1] - Util.getCurrentTimeInDecimal() : scheduleEvaluated[1] - Util.getCurrentTimeInDecimal() + 24
        );

        console.log(new Date() + "\n" + this.lightInfo.id + ': Next light on in ' + timeUntilOn + ' hours...\n'
            + this.lightInfo.id + ': Next light off in ' + timeUntilOff + ' hours...')

        // Schedule the next day's on/off time
        // On time
        setTimeout(() => {
            this.setPower(true);
            this.cycleLights(this.intervalTime)
        }, timeUntilOn * 60 * 60 * 1000);

        // Off time
        setTimeout(() => {
            this.setPower(false);
            setTimeout(() => {
                console.log(new Date() + "\n" + this.lightInfo.id + ': Scheduling next light cycle...')
                this.scheduleLight();
            }, 1000);
        }, timeUntilOff * 60 * 60 * 1000);
    }


    /**
     * Set the color data of the light
     * @returns {Object} The color data
    */
    async updateColorData() {
        this.colorData = await Util.getColorData();
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
            bri: Math.floor(colorIn[2] * 254),
        });

        return colorIn;
    }


    /**
     * Set the power state of the light
     * @param {Number} powerIn
    */
    setPower(powerIn) {
        console.log(new Date() + "\n" + this.lightInfo.id + ': Light power set to ' + powerIn + '...');
        this.power = powerIn;
        this.updateLights({
            on: this.power,
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
            return await axios.put(`http://${this.lightInfo.bridgeIP}/api/${this.lightInfo.username}/lights/${this.lightInfo.id}/state`, JSON.stringify(bodyIn), {
                headers: {
                    'Content-Type': 'application/json',
                }
            }).then(response => {
                console.log(response.data)
                return response.data;
            })
        } catch (error) {
            console.log(new Date() + "\n" + this.lightInfo.id + ': Error updating light ' + this.lightInfo.id + '...\n' +
                '\x1b[33m%s\x1b[0m', JSON.stringify(bodyIn));
        }
    }
}

module.exports = Light;