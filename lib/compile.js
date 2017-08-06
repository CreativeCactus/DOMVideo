const fs = require('fs');
const childProcess = require('child_process');

const festival = require('festival');
const scribble = require('scribbletune');

const safe = require('../lib/safe');

module.exports = async function compile(unsafe_url) {
    const url = safe(unsafe_url);
    const input = require(`../${url}/1`); // Sorry :P

    const format = 'webm';

    const currentYear = (new Date()).getFullYear();

    for (let i = 0; i < input.list.length; i++) {
        const btn = input.list[i];
        const title = `How to click '${btn.safe_text}' at '${input.safe_title}' on ${input.safe_host}`;

        const fileName = `${i} ${title} ${currentYear} latest`;
        const fullFileName = `${fileName}.${format}`;

        const HERE = __dirname;
        const FPS = 10;
        const DUR = 10;
        const Frms = FPS * DUR;


        const XMID = 1280 / 2;
        const YMID = 720 / 2;

        const VH = 720; // VIEWPORT HEIGHT
        const TH = input.y; // TOTAL PAGE HEIGHT
        const VHF = VH / TH;  // FACTOR

        const FADE = { PRE: 3, LEN: 2 };
        FADE.TOTAL = FADE.PRE + FADE.LEN;
        const CURSOR_START = {
            X: `w*1.5+${XMID}`,
            Y: `(h*2)+${YMID}`
        };
        const ZOOM = { LEN: DUR - FADE.TOTAL, FADE: 2, OUTRO: 2 };
        const CURSOR_ZOOM = {
            X: `w*1.5+(W/2)+t*min(W*(0.56875-0.5), t*W*(0.56875-0.5)/(${FPS}*0.8))`,
            Y: `(h*2)+${YMID}+min(H*0.99917+${VHF * 2}, t*H*(0.99917+${VHF * 2})/(${FPS}*0.8))`
        };
        const CROP_ZOOM = {
            X: `(iw/2)+min(iw*0.56875-(iw/2), (t*iw*0.56875-(iw/2))/(${FPS}*0.8))`,
            Y: `min(ih*0.99917+${VHF * 1.5}, t*ih*(0.99917+${VHF * 1.5})/(${FPS}*0.8))`
        };
        const THX = { LEN: 4, OUTRO: 0 };
        THX.TOTAL = THX.LEN + THX.OUTRO;

        const command = [
            `HERE="${__dirname}"; \\`,
            `ffmpeg -framerate ${FPS} -loop 1 -i ${HERE}/1.png -loop 1 -i ${HERE}/../src/ptr.png -i ${HERE}/../tts.mp3 -i ${HERE}/../song.wav -y -filter_complex " \\`,
            '[1:v] scale=width=iw/10:height=ih/10, split=2 [ptr1][ptr2]; \\',
            ' \\'];
        command.push(
            `[0:v][ptr1] overlay=x='${CURSOR_START.X}':y='${CURSOR_START.Y}' [cursor_intro]; \\`,
            `[cursor_intro] crop=x=0:y=0:w=1280:h=720, setsar=sar=1, fade=t=in:st=${FADE.PRE}:d=${FADE.LEN}, trim=duration=${FADE.TOTAL} [pg_intro]; \\`,
            ' \\'
        );
        command.push(
            `[0:v][ptr2] overlay=x='${CURSOR_ZOOM.X}':     y='${CURSOR_ZOOM.Y}' [cursor_zoom]; \\`,
            `[cursor_zoom] crop=x='${CROP_ZOOM.X}': y='${CROP_ZOOM.Y}':w=1280:h=720, \\`,
            'setsar=sar=1 [pg_zoom]; \\',
            ' \\'
        );
        command.push(
            '[pg_zoom] fifo, \\',
            `    zoompan=enable='gte(t,${FADE.TOTAL})':z='min(zoom+0.015,1.8)':x='iw/2':y='ih/2':d=${ZOOM.LEN * Frms}:s=1280x720, \\`,
            `    trim=duration=${ZOOM.LEN}, crop=1280:720, fade=t=out:st=${ZOOM.LEN - (ZOOM.FADE + ZOOM.OUTRO)}:d=${ZOOM.FADE} [zoom]; \\`,
            ' \\',
            `[pg_intro][zoom] concat=n=2:v=1, trim=duration=${DUR} [v]; \\`,
            ' \\'
        );
        command.push(
            `[v] drawtext= fontfile=${HERE}/../src/FreeSansBold.ttf: \\`,
                    'text=\'Thanks for watching!\': x=(w-text_w)/2: y=h-20*t: fontsize=30: \\',
                    `enable='between=(t,${DUR - THX.TOTAL},${DUR - THX.OUTRO})'[tv]; \\`,
            ' \\',
            '[2:a][3:a] amix [audio] \\',
            ' \\'
        );

        command.push(
            `" -map "[tv]" -map "[audio]" -framerate ${FPS} \\`,
            `"./${fileName}.${format}"`
        );
    
        // TTS AND SOUND

        festival.toSpeech(`Welcome to my youtube channel. ${title}`, 'tts.mp3', a => console.log('Encoded speech', a));

        const scale = scribble.mode('c', 'major', '4');
        const clip = scribble.clip({
            notes: Array(...Array(16)).map(v => scale[~~(Math.random() * scale.length)]),
            pattern: 'x_'.repeat(16)
        });
        scribble.midi(clip, 'song.mid');
        console.log('Encoded midi');
        
        const child = childProcess.spawn('timidity', ['song.mid', '-Ow', '-o song.wav']);

        child.stdout.on('data', (data) => { console.log(`out: ${data}`); });
        child.stderr.on('data', (data) => { console.error(`err: ${data}`); });
        await Promise((a, r) => {
            child.on('close', (code) => {
                console.log(`Converted midi to wav : ${code}`);
                if (code) {
                    console.error(`TIMIDITY QUIT WITH CODE ${code}`);
                    r(code);
                }
                ffmpeg(fullFileName, command, a, r);
            });
        }).catch((e) => {
            console.error('Giving up due to child process error.');
            process.exit(1);
        });
    }

    console.log('Miraculously finished!');
};

// Simple hack to run expressions in the 2nd+ arg of this func call.
function _(arg) { return arg; }

function ffmpeg(file, command, cb, err) {
    console.log('RUNNING:\n\r', command.join('\\\n\r'));

    // run it
    const child = childProcess.spawn(command);

    child.stdout.on('data', (data) => { console.log(`out: ${data}`); });
    child.stderr.on('data', (data) => { console.error(`err: ${data}`); });

    child.on('close', (code) => {
        console.log(`exited with code ${code}`);
        if (code) {
            console.error(`FFMPEG QUIT WITH CODE ${code}`);
            (err || process.exit)(1);
        }
        console.log('Finished file:');
        cb();
    });
}
