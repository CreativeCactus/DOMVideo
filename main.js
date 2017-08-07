const path = require('path');
const childProcess = require('child_process');
const phantomjs = require('phantomjs-prebuilt');

const args = process.argv.slice(2).concat([null]);
const url = args[0] || 'https://ffmpeg.org/donations.html';

const childArgs = [
    path.join(__dirname, './lib/rasterize.js'),
    url
];
 
console.log(`Running phantomjs ${childArgs.join(' ')}...`);

const child = childProcess.spawn(phantomjs.path, childArgs);

child.stdout.on('data', (data) => { console.log(`out: ${data}`); });
child.stderr.on('data', (data) => { console.error(`err: ${data}`); });
child.on('close', (code) => {  
    console.log(`exited with code ${code}`);
    if (code == 0) {
        require('./lib/compile')(url);
    }
});

