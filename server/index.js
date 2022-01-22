const spawn = require("child_process").spawn;
const pythonProcess = spawn('python3', ["server.py"]);

pythonProcess.stdout.on('data', (buffer) => {
    console.log(buffer.toString('utf8'));
});

pythonProcess.stderr.on('data', (buffer) => {
    console.error(buffer.toString('utf8'));
});

var cleanExit = function() { 
    pythonProcess.kill();
    process.exit()
};

process.on('SIGINT', cleanExit); // catch ctrl-c
process.on('SIGTERM', cleanExit);
process.on('SIGQUIT', cleanExit);