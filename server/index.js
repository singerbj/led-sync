// const Vibrant = require('node-vibrant');
const cv = require('opencv4nodejs');
const WebSocket = require('ws');
const { getAverageColor } = require('fast-average-color-node');

const express = require('express');
var bodyParser = require('body-parser')
const app = express();
app.use(express.static('build'));
app.use(bodyParser.json());
const httpPort = 3000;
const wsPort = 1337;

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

app.listen(httpPort, () => {
    console.log(`Http listening at http://localhost:${httpPort}`)
});


// set up websocketserver
const wsMap = {};
const wss = new WebSocket.Server({ port: wsPort });

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

let lastSend = 0;
const sendColor = (color) => {
    const now = Date.now();
    if((now - lastSend) > 100){
        lastSend = now;
        Object.keys(wsMap).forEach((key) => {
            const ws = wsMap[key];
            ws.send(JSON.stringify(color));
        });
    }
};

let lastForcedColor;
const run = async () => {
    const startTime = Date.now();

    if(forcedColor){
        if(vCap){
            vCap.release();
            vCap = undefined;
        }
        if(lastForcedColor !== forcedColor) {
            lastForcedColor = forcedColor;
            console.log('sending forcedColor', forcedColor);
        }
        sendColor(forcedColor);
        waitAndRun(startTime, run);
    } else {
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

        waitAndRun(startTime, run);
    }
};
run();


