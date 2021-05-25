// const Vibrant = require('node-vibrant');
const cv = require('opencv4nodejs');
const WebSocket = require('ws');
const { getAverageColor } = require('fast-average-color-node');

const express = require('express');
var bodyParser = require('body-parser')
const app = express();
app.use(express.static('public'));
app.use(bodyParser.json());
const httpPort = 3000;
const wsPort = 1337;

let forcedColor;

app.put('/', (req, res) => {
    const { body } = req;

    if(body && body.color && body.color.length === 3 && !isNaN(body.color[0]) && !isNaN(body.color[1]) && !isNaN(body.color[2])){
        forcedColor = body.color;
    } else {
        forcedColor = undefined;
    }

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
try {
    vCap = new cv.VideoCapture(1);
    console.log("Using video capture 1");
} catch (e) {
    vCap = new cv.VideoCapture(0);
    console.log("Using video capture 2");
}
vCap.set(cv.CAP_PROP_FRAME_WIDTH, 480);
vCap.set(cv.CAP_PROP_FRAME_HEIGHT, 270);

const waitAndRun = (startTime, func) => {
    const timeSinceStart = Date.now() - startTime;
    const waitTime = 0 - timeSinceStart < 0 ? 0 : 0 - timeSinceStart;
    setTimeout(() => {
        func();
    }, waitTime);
};

const sendColor = (color) => {
    Object.keys(wsMap).forEach((key) => {
        const ws = wsMap[key];
        ws.send(JSON.stringify(color));
    });
};

const run = async () => {
    const startTime = Date.now();

    if(forcedColor){
        sendColor(forcedColor);
        waitAndRun(startTime, run);
    } else {
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


