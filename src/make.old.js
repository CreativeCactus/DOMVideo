const fs = require('fs');
const childProcess = require('child_process');

const input = require('./1');

const fps = 3; 
const format = 'webm';

const introTime = 5; // must be at least 1 for fade in
const scrollTime = 5;
const zoomTime = 3;
const fadeTime = 2;
const outroTime = 5;

const output = input.list.map((btn, i) => {
    const fileName = `${i} How to click '${btn.safe_text}' at '${input.safe_title}' on ${input.safe_host} 2017 latest`;
    const scroll = btn.y > input.vh;
    const nparts = 4 + (scroll ? 1 : 0);

    const postScrollY = scroll ? (0 - btn.y) + (input.vh / 2) : btn.y;

    const time = introTime + (scroll ? scrollTime : 0); // + zoomTime + fadeTime + outroTime;
    let at = 0;
    // DANGER! Nested template strings. Make sure to read carefully before modifying.
    const command = [
        `HERE="${__dirname}"; `,
        'ffmpeg',
        ` -loop 1 -t ${time} -i $HERE/1.png`,
        // ` -loop 1 -t ${time} -i $HERE/../src/white.png`,
        // ` -loop 1 -t ${time} -i $HERE/../src/black.png`,

        ` -framerate ${fps} -pix_fmt yuv420p -y`,

        ' -filter_complex "',
        `[0:v]setdar=16/9,crop=${input.vw}:${input.vh}[pg0]; `,
        // '[0:v]setdar=16/9[pg1]; ',
        `[0:v]setdar=16/9,crop=${input.vw}:${input.vh}[pg2]; `
        // '[1:v]setdar=16/9[white]; '
    ];
    command.push(/* intro fade in */
       // `[pg][white]overlay=enable='between=(t,${at},${_(introTime, at += introTime)})':x=0:y=0[intro0]; `,
        `[pg0]fade=t=in:st=${introTime - 1}:d=1[intro1]; `);
    if (scroll) {
        command.push(/* scroll down */
        `[pg1:v][white:v]overlay=enable='between=(t,${at},${_(scrollTime, at += scrollTime)})':x=0:y=0+t*50[scroll]; `);
    }
    command.push(/* zoom in */
        `[pg2]zoompan=z='min(zoom+0.0015,1.5)':d=${fps * zoomTime}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'[zoom]; `
        // `[0:v][1:v]overlay=enable='between=(t,${at},${_(zoomTime, at += zoomTime)})':x=0:y=1+t*10[intro]`,
        // `[0:v][1:v]overlay=enable='between=(t,${at},3)':x=1+t*28:y=1+t*10[v0]`
    );

    command.push(
        ` [intro1]${scroll ? '[scroll]' : ''}[zoom]${0 ? '[fade][outro]' : ''}concat=n=${2 || nparts}:v=1:a=0,format=yuv420p[cv]; `,
        // ` [cv]scale=${input.vw}:${input.vh}:flags=gauss:interl=0[v]`,
        ` [cv]crop=${input.vw}:${input.vh}[v]`,
        `" -map "[v]" "./${fileName}.${format}"` // -s "${input.vw}x${input.vh}"
    );
        
    return command.join('\\\n\r');
});

console.log(output.join('\n\r\n\r'));
process.exit(1);

// print to .sh
const builder = `${__dirname}/build.sh`;

fs.writeFileSync(builder, output.join('\n'));
// run it
const child = childProcess.spawn(builder);

child.stdout.on('data', (data) => {
    console.log(`out: ${data}`);
});

child.stderr.on('data', (data) => {
    console.error(`err: ${data}`);
});

child.on('close', (code) => {
    console.log(`exited with code ${code}`);
    fs.unlinkSync(builder);
});

// Simple hack to run expressions in the 2nd+ arg of this func call.
function _(arg) { return arg; }
