/* eslint-disable strict, object-shorthand, prefer-template, prefer-arrow-callback, no-var */

'use strict';

console.log('Starting...');

var safe=require('./safe');

var fs = require('fs');
var page = require('webpage').create(),
    system = require('system'),
    address, 
    safePath;

if (system.args.length < 2 || system.args.length > 3) {
    console.log(['MODIFIED RASTERIZE.JS [MattD]:',
        'Usage: rasterize.js URL [zoom]', '',

        './client.js will be executed on the page.',
        'Results and a screencap logged to the path ./clean_url/',
        'as 1.json and .1.png.', '',

        'Cleaning is done via regex, nonword chars are set to _.'].join('\n\t'));
    phantom.exit(1);
} else {
    address = system.args[1];

    page.viewportSize = { width: 1280, height: 720 };
    
    if (system.args.length > 1) {
        page.zoomFactor = system.args[2];
    }
    page.open(address, function open(status) {
        if (status !== 'success') {
            console.log('Unable to load the address!');
            phantom.exit(1);
        } else {
            console.log(address + ' ...');
            window.setTimeout(function start() {                
                theMagic(address);
                // be sure to eventually:
                phantom.exit();
            }, 200);
        }
    });
}

function theMagic(url) {
    safePath = './' + safe(url);
    console.log('Starting the magic: ' + safePath);

    if (!fs.exists(safePath)) {
        fs.makeDirectory(safePath);
    } else {
        console.error('Path exists: ' + safePath);
        // phantom.exit(1);  
        fs.removeTree(safePath);
    }

    page.render(safePath + '/1.png');

    if (page.injectJs('client.js')) {
        // main must be declared in client.js on window
        var output = page.evaluate(function init() { return main(); });        

         // result of the script is output
        output.original_url = url;

        fs.write(safePath + '/1.json', JSON.stringify(output), 'w');
        phantom.exit(0);
    } else {
        console.error('Script error');
        fs.removeTree(safePath);
        phantom.exit(1);  
    }
}

