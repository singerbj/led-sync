const WebSocket = require('ws');
const find = require('local-devices');
const ws281x = require('rpi-ws281x');

const SERVER_PORT = 1337;
const HANDSHAKE_TIMEOUT = 5000;
const WAIT_TO_RECONNECT = 1000;
const WAIT_TO_CHECK_CURRENT_SERVER = 1000;


// Set my Neopixel configuration
const config = { leds: 300 };

// Configure ws281x
ws281x.configure(config);

const componentToHex = (c) => {
    var hex = (c).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
};

const rgbToHex = (r, g, b) => {
    return "0x" + (componentToHex(r) + componentToHex(g) + componentToHex(b)).toString(16);
};

const setSolidColor = (r, g, b) => {
    const pixels = new Uint32Array(config.leds);
    const hexColor = rgbToHex(r, g, b);

    for(let i = 0; i < config.leds; i += 1){
        pixels[i] = hexColor;
    }

    // Render to strip
    ws281x.render(pixels);
};

let currentServer;
let lastMessage;

const run = async () => {

    const devices = await find();

    for (const i in devices) {
        if(!currentServer){
            const device = devices[i];
            console.log('==============================');
            console.log('Trying ' + device.name + " - " + device.ip);
            try {
                const promise = new Promise((resolve, reject) => {
                    const ws = new WebSocket(`ws://${device.ip}:${SERVER_PORT}`, {
                        handshakeTimeout: HANDSHAKE_TIMEOUT
                    });

                    ws.on('open', () => {
                        console.log('open');
                        currentServer = ws;
                        resolve(device);
                    });

                    ws.on('message', (data) => {
                        const parsedData = JSON.parse(data);
			            if(lastMessage !== data){
                            lastMessage = data;
                            console.log('message = ' + parsedData);
                        }

                        setSolidColor(parsedData[0], parsedData[1], parsedData[2]);
                    });

                    ws.on('close', () => {
                        console.log('close');
                        currentServer = undefined;
                        reject();
                    });

                    ws.on('error', (error) => {
                        console.log('error');
                        currentServer = undefined;
                        reject(error);
                    });
                });
                await promise;
            } catch (error) {
                if(error){
                    console.log(error);
                }
            }
            console.log('==============================');
        }
    }

    const checkCurrentServer = () => {
        if(!currentServer){
            console.log('No server found. Attempting to reconnect again in 1 second...')
            setTimeout(() => {
                run();
            }, WAIT_TO_RECONNECT);
        } else {
            setTimeout(() => {
                checkCurrentServer();
            }, WAIT_TO_CHECK_CURRENT_SERVER)
        }
    };
    checkCurrentServer();

};

run();
