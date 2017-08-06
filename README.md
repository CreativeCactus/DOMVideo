# DOM Video

A running joke that a sufficiently complex AI might pursue instrumental convergence to the point of creating billions of meaningless tutorials for the human underclass.

Rather than implementing such an AI, this package seeks to emulate that behaviour by the following:

- Visit a webpage (phantomJS)

- Take a screenshot (rasterize.js)

- Generate some random music (scribbletune js, timidity)

- Generate TTS narration (festival js)

- Compile it all into a video with some text (ffmpeg)

## Usage

#### Ensure dependencies are present

`apt-get install timidity festival`

`npm i`

### A. Run main and brace your CPU

`node main.js`

### B. Manually generate a single video

#### Determine phantomJS path

`node
	const phantomjs = require('phantomjs-prebuilt');
	phantomjs.path
`

or 

```
`which phantom`
```

#### Call the modified rasterize.js

`/full/path/phantom ./lib/rasterize.js [optional url]`

#### Inspect the newly created directory, and `1.json` therein

The following is default. If you provided a URL in the previous step, this will be different.

`ls -la ./https_ffmpeg_org_ffmpeg_filters_html`

If you have `jq` installed (`apt-get install jq`): `cat ./1.json | jq '.'`

#### Edit `1.json` to include as few entries as you would like to generate.

`nano 1.json` (I just don't have time to learn vim ;_; )

The `.list` array should contain the number of elements you want to generate videos for.

You can confirm this if you please: `cat 1.json | js '.list | length'`

#### Finally, compile video:

`node
	// Substitute this URL if you provided any earlier.
	const compile = require('./lib/compile')('https://ffmpeg.org/ffmpeg-filters.html')
`

#### Wait patiently

...

#### Check for .webm(s) in the directory we created earlier.

`ls -la ./https_ffmpeg_org_ffmpeg_filters_html`

Done!

