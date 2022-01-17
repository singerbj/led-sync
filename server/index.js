// const Vibrant = require('node-vibrant');
const cv = require('opencv4nodejs');
const WebSocket = require('ws');
const { getAverageColor } = require('fast-average-color-node');
const find = require('local-devices');
var dgram = require('dgram');

const express = require('express');
var bodyParser = require('body-parser');
const { existsSync } = require('fs');
const app = express();
app.use(express.static('build'));
app.use(bodyParser.json());
const HTTP_PORT = 3000;
const WS_PORT = 1336;
const UDP_PORT = 1337;
const PACKET_SEND_INTERVAL = 0; // was 100ms
const DEVICE_SEARCH_INTERVAL = 30000;
let devices = [];

//find devices every 30 seconds
const getDevices = async () => {
    devices = await find();
    console.log(devices);
};
setInterval(() => {
    getDevices();
}, DEVICE_SEARCH_INTERVAL);
getDevices();
  

let forcedColor = [100, 100, 100];

app.get('/color', (req, res) => {
    res.send(forcedColor);
});

app.put('/color', (req, res) => {
    const { body } = req;

    if(body && body.length === 3 && !isNaN(body[0]) && !isNaN(body[1]) && !isNaN(body[2])){
        forcedColor = body;
    } else {
        forcedColor = undefined;
    }

    console.log("forcedColor: ", forcedColor === undefined ? "undefined": forcedColor);

    res.send(body);
});

app.listen(HTTP_PORT, () => {
    console.log(`Http listening at http://localhost:${HTTP_PORT}`)
});

// set up websocketserver
const wsMap = {};
const wss = new WebSocket.Server({ port: WS_PORT });

wss.getUniqueID = function () {
    const s4 = () => {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4();
};

wss.on('connection', (ws) => {
    console.log('connection');
    ws.id = wss.getUniqueID();
    wsMap[ws.id] = ws;

    ws.on('close',  (ws) => {
        console.log('close');
        delete wsMap[ws.id];
    });
});

wss.on('error', (err) => {
    console.error(err);
});


var client = dgram.createSocket('udp4');
client.on('error', (error) => {
    console.error(error);
});

let vCap;
const setupVCap = () => {
    try {
        vCap = new cv.VideoCapture(1);
        console.log("Using video capture 1");
    } catch (e) {
        vCap = new cv.VideoCapture(0);
        console.log("Using video capture 2");
    }
    vCap.set(cv.CAP_PROP_FRAME_WIDTH, 480);
    vCap.set(cv.CAP_PROP_FRAME_HEIGHT, 270);
};

const waitAndRun = (startTime, func) => {
    const timeSinceStart = Date.now() - startTime;
    const waitTime = 0 - timeSinceStart < 0 ? 0 : 0 - timeSinceStart;
    setTimeout(() => {
        func();
    }, waitTime);
};

const sendColorToUdpDevice = (color, device) => {
    return new Promise((resolve) => {
        if(device.name.indexOf("esp32") > -1){
            client.send(color.join(',') + ",", 0, 12, UDP_PORT, device.ip, function(err, bytes) {
                if(err){
                    console.error('err', err);
                } else {
                    console.log(`sent ${color.join(',') + ","} to ${device.ip}`)
                }
                resolve();
            });
        } else {
            resolve();
        }
    });
};

const sendColorToWebsocket = (stringifiedColor, ws, key) => {
    return new Promise((resolve) => {
        ws.send(stringifiedColor);
        console.log(`sent ${stringifiedColor} to ${key}`)
        resolve();
    });
};

let lastSend = 0;
const sendColor = (color) => {
    const now = Date.now();
    if((now - lastSend) > PACKET_SEND_INTERVAL){
        lastSend = now;
        const stringifiedColor = JSON.stringify(color);
        Object.keys(wsMap).forEach((key) => {
            sendColorToWebsocket(stringifiedColor, wsMap[key], key)
        });
        devices.forEach((device) => {
            sendColorToUdpDevice(color, device)
        });
    }
};

const run = async () => {
    const startTime = Date.now();

    if(forcedColor){
        try{
            if(vCap){
                vCap.release();
                vCap = undefined;
            }
            
            console.log('sending forcedColor', forcedColor);
            sendColor(forcedColor);
        } catch (e) {
            console.error(e);
        }
        waitAndRun(startTime, run);
    } else {
        try {
            if(!vCap){
                setupVCap();
            }

            let frame = vCap.read();
            // loop back to start on end of stream reached
            if (frame.empty) {
                vCap.reset();
                frame = vCap.read();
            }

            // get dominant color of image
            const dominantColor = await getAverageColor(cv.imencode('.jpg', frame));
            // console.log(dominantColor.value);

            // send dominant color
            sendColor(dominantColor.value);
        } catch (e) {
            console.error(e);
        }

        waitAndRun(startTime, run);
    }
};
run();


