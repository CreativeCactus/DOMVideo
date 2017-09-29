const fs = require('fs');
const childProcess = require('child_process');

const festival = require('festival');
const scribble = require('scribbletune');

const safe = require('../lib/safe');

module.exports = async function compile(unsafe_url) {
    const url = safe(unsafe_url);
    const input = require(`../${url}/1`); // Sorry :P

    const format = 'avi';

    const currentYear = (new Date()).getFullYear();

    const FPS = 10;
    const DUR = 12;
    const Frms = FPS * DUR;

    const HERE = __dirname;

    const XMID = 1280 / 2;
    const YMID = 720 / 2;

    const VH = 720; // VIEWPORT HEIGHT
    const TH = input.y; // TOTAL PAGE HEIGHT
    const VHF = VH / TH;  // FACTOR

    const VW = 1280; // VIEWPORT WIDTH
    const TW = input.y; // TOTAL PAGE WIDTH
    const VWF = VH / TH;  // FACTOR

    for (let i = 0; i < input.list.length; i++) {
        const btn = input.list[i];
        const title = `How to click '${btn.safe_text}' at '${input.safe_title}' on ${input.safe_host}`;
        const narrate = `How to click '${btn.safe_text}' , at '${input.safe_title}' on ${input.safer_host}`;

        const fileName = `${i} ${title} ${currentYear} latest`;
        const fullFileName = `${fileName}.${format}`;

        // STAGE ONE
        const INTRO = { PRE: 3, LEN: 2 };
        INTRO.TOTAL = INTRO.PRE + INTRO.LEN;
        const CURSOR_START = {
            // 
            x: `(w*1.0)+${XMID}`,
            y: `(h*1.0)+${YMID}`,
            // for cursor_zoom, zoompan
            ix: `(iw*1.0)+${XMID}`,
            iy: `(ih*1.0)+${YMID}`,
            // 
            X: `(w*1.0)+${XMID}`,
            Y: `(h*1.0)+${YMID}`
        };

        // STAGE TWO
        const ZOOM = {FADE: 2, OUTRO: 2};
        ZOOM.POST=ZOOM.FADE+ZOOM.OUTRO
        ZOOM.LEN =DUR - ( ZOOM.POST )
        ZOOM.TOTAL = ZOOM.LEN + ZOOM.POST
        const TARGET = {
            Text:btn.safe_text,
            XF:btn.x/input.x,
            YF:btn.y/input.y
        }

        const CURSOR_ZOOM = {
            
            // X: `${CURSOR_START.X}+if( lt( abs( st( W*(${TARGET.XF}-${CURSOR_START.X}) ,1) ), abs( st( t*W*(${TARGET.XF}-${CURSOR_START.X})/(${ZOOM.LEN*FPS}*0.8) ,0) ) ), ld(0), ld(1) )`,
            // used in zoompan
            x:`${CURSOR_START.ix}+iw*(${TARGET.XF}-0.5)`,
            y:`${CURSOR_START.iy}+ih*(${TARGET.YF}-0.5)`,
            // used to set cursor
            X:`${CURSOR_START.X}+W*(${TARGET.XF}-0.5)*min(t/${ZOOM.LEN}, 1)`,
            Y:`${CURSOR_START.Y}+H*(${TARGET.YF}-0.5)*min(t/${ZOOM.LEN}, 1)`

            //X: `${CURSOR_START.X}+min(W*${TARGET.XF}-${CURSOR_START.X}, t*W*${TARGET.XF}-${CURSOR_START.X}/(${ZOOM.LEN*FPS}*0.8))`,
            //Y: `${CURSOR_START.Y}+min(H*${TARGET.YF}-${CURSOR_START.Y}, t*H*${TARGET.YF}-${CURSOR_START.Y}/(${ZOOM.LEN*FPS}*0.8))`
        };
        const CROP_ZOOM = {
            x: `${XMID}+(iw*${TARGET.XF}-${XMID})*      min(t/${ZOOM.LEN},1)`,
            y: `${YMID}+(ih*${TARGET.YF}-${VHF * 0.5})* min(t/${ZOOM.LEN},1)`,
            X: `${XMID}+(iw*${TARGET.XF}-${XMID})*      min(t/${ZOOM.LEN},1)`,
            Y: `${YMID}+(ih*${TARGET.YF}-${VHF * 0.5})* min(t/${ZOOM.LEN},1)`
        };



        console.log('_______________'.repeat(10))
        console.dir(TARGET)
        console.dir(CURSOR_START)
        console.dir(CURSOR_ZOOM)
        console.dir(CROP_ZOOM)
        console.dir(btn)
        console.dir({ZOOM, FPS})

/*
FFMPEG
*/

        const command = [
            'ffmpeg',
            '-framerate', `${FPS}`,
            '-loop', '1', '-i', `${HERE}/../${url}/1.png`,
            '-loop', '1', '-i', `${HERE}/../src/ptr.png`,
            '-i', `${HERE}/../${url}/tts.mp3`,
            '-i', `${HERE}/../${url}/song.wav`,
            '-y',
            '-pixel_format', 'yuv420p',
            '-b:v', '1000k',
            '-filter_complex'
        ];
            
        const filter = [
            '[1:v] scale=width=iw/10:height=ih/10, split=2 [ptr1][ptr2];',
            ''];
        filter.push(
            `[0:v][ptr1] overlay=x='${CURSOR_START.x}':y='${CURSOR_START.y}' [cursor_intro];`,
            `[cursor_intro] crop=x=0:y=0:w=1280:h=720, setsar=sar=1, fade=t=in:st=${INTRO.PRE}:d=${INTRO.LEN}, trim=duration=${INTRO.TOTAL} [pg_intro];`
        );
        filter.push(
            `[0:v][ptr2] overlay=x='${CURSOR_ZOOM.X}':     y='${CURSOR_ZOOM.Y}' [cursor_zoom];`,
            `[cursor_zoom] crop=x='${CROP_ZOOM.X}': y='${CROP_ZOOM.Y}':w=1280:h=720,`,
            'setsar=sar=1 [pg_zoom];'
        );
        filter.push(
            '[pg_zoom] fifo,',
            `    zoompan=enable='gte(t,0*${INTRO.TOTAL})':z='min(zoom+0.005,3)':x='${CURSOR_ZOOM.x}':y='${CURSOR_ZOOM.y}':d=${ZOOM.LEN * FPS}:s=1280x720,`,
            `    trim=duration=${ZOOM.TOTAL}, crop=1280:720, fade=t=out:st=${ZOOM.LEN - (ZOOM.POST)}:d=${ZOOM.FADE} [zoom];`//////////// this is perfect as is -----------------------------
        );
        filter.push(            
            `[pg_intro][zoom] concat=n=2:v=1, trim=duration=${DUR} [v];`
        );
        filter.push(
            `[v] drawtext= fontfile='${HERE}/../src/FreeSansBold.ttf':`,
                    'text=\'Thanks for watching!\': x=(w-text_w)/2: y=h-20*t: fontsize=30:',
                    `enable='between=(t,${DUR - ZOOM.POST},${ZOOM.POST})'[tv];`
        );
        filter.push(
            '[3:a] asplit=3, concat=n=3:v=0:a=1 [music];',
            '[2:a][music] amix [audio]',
        );

        command.push(
            filter.join(' '),
            '-map', '[tv]',
            '-map', '[audio]',
            '-framerate', `${FPS}`,
            '-shortest',
            '-t', `${DUR}`,
            //'-c:v', 'libvpx-vp9',
            `${HERE}/../${url}/${fileName}.${format}`
        );
        
        fs.writeFileSync('log', command.join('\n\r'));

        /*
         .d8b.  db    db d8888b. d888888b  .d88b.  
        d8' `8b 88    88 88  `8D   `88'   .8P  Y8. 
        88ooo88 88    88 88   88    88    88    88 
        88~~~88 88    88 88   88    88    88    88 
        88   88 88b  d88 88  .8D   .88.   `8b  d8' 
        YP   YP ~Y8888P' Y8888D' Y888888P  `Y88P'
        */

        festival.toSpeech(`Welcome to my you tube channel. ${narrate} . Subscribe for more great tips!`, `${HERE}/../${url}/tts.mp3`, (...arg) => console.log('Encoded speech:',...arg));

        const scale = scribble.mode('c', 'major', '4');
        const clip = scribble.clip({
            notes: Array(...Array(16)).map(v => scale[~~(Math.random() * scale.length)]),
            pattern: 'x_'.repeat(16)
        });
        scribble.midi(clip, `${HERE}/../${url}/song.mid`);
        console.log('Encoded midi');
        
        const timidity = spawn('timidity', [`${HERE}/../${url}/song.mid`, '-Ow', '-o', `${HERE}/../${url}/song.wav`]);

/*
COMPILE
*/

        await (new Promise((a, r) => {
            timidity.on('close', (code) => {
                console.log(`Converted midi to wav : ${code}`);
                if (code) {
                    console.error(`TIMIDITY QUIT WITH CODE ${code}`);
                    r(code);
                    console.error('Giving up due to child process error.');
                    process.exit(1);
                }
                setTimeout(()=>{
                    ffmpeg(fullFileName, command, a, r);
                },1000);
                console.log('Waiting to call ffmpeg...');
            });
        }));
    }

    console.log('Miraculously finished!');
};

/*
HELPERS
*/

// Simple hack to run expressions in the 2nd+ arg of this func call.
function _(arg) { return arg; }

function ffmpeg(file, command, cb, err) {
    console.log('RUNNING:\n\r', command.join('\\\n\r'));

    // run it
    const ffmpeg = spawn(command[0], command.slice(1));
    
    ffmpeg.on('close', (code) => {
        console.log(`exited with code ${code}`);
        if (code) {
            console.error(`FFMPEG QUIT WITH CODE ${code}`);
            (err || process.exit)(1);
        }
        console.log('Finished file:');
        cb();
    });
}


function spawn(cmd, args) {
    const child = childProcess.spawn(cmd, args);

    child.stdout.on('data', (data) => { console.log(`${cmd}:out: ${data}`); });
    child.stderr.on('data', (data) => { console.error(`${cmd}:err: ${data}`); });
    return child;
}
