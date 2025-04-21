require('dotenv').config();
const https = require('https');
const fs = require('fs');
const path = require('path');
const { from, of, forkJoin } = require('rxjs');
const { map, switchMap, catchError } = require('rxjs/operators');

// Directory for typewriter sounds
const dir = path.join(__dirname, 'typewriter');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

/**
 * @typedef {Object} SoundSpec
 * @property {string} name - The base filename to save as (e.g. "key.mp3")
 * @property {string} query - The Freesound search query
 * @property {string} [description] - Human-friendly description for logging
 */

/** @type {SoundSpec[]} */
const sounds = [
  {
    name: 'keystrike.mp3',
    // Broader query for single key strike
    query: 'typewriter key OR typewriter keypress OR typewriter single key OR typewriter key sound',
    description: 'Single manual/mechanical typewriter key strike (broad search)'
  },
  {
    name: 'ding.mp3',
    query: 'typewriter bell OR typewriter bell sound OR typewriter bell ding',
    description: 'Classic typewriter bell/ding (broad search)'
  },
  {
    name: 'return.mp3',
    query: 'typewriter carriage return slide',
    description: 'Typewriter carriage return slide'
  },
  {
    name: 'ambient.mp3',
    query: 'typewriter ambient OR typewriter background OR typewriter ambience',
    description: 'Typewriter room ambient background (optional, broad search)'
  }
];

function colorize(text, color) {
  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    blue: '\x1b[34m',
    gray: '\x1b[90m'
  };
  return (colors[color] || '') + text + colors.reset;
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      } else {
        file.close(() => fs.unlink(dest, () => reject(new Error('HTTP ' + res.statusCode))));
      }
    }).on('error', err => {
      file.close(() => fs.unlink(dest, () => reject(err)));
    });
  });
}

function searchFreesound(query) {
  const apiKey = process.env.FREESOUND_API_KEY;
  if (!apiKey) throw new Error('Freesound API key not set.');
  const url = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query)}&fields=id,name,url,previews,duration,username&sort=score&token=${apiKey}&page_size=12`;
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.results || []);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

function getValidPreviews(results, max = 3) {
  const found = [];
  for (const result of results) {
    if (
      result.previews &&
      (result.previews['preview-lq-mp3'] || result.previews['preview-hq-mp3'])
    ) {
      found.push(result);
      if (found.length >= max) break;
    }
  }
  return found;
}

function ensureSound(sound) {
  const base = sound.name.replace(/\.mp3$/, '');
  const dests = [];
  return from(searchFreesound(sound.query)).pipe(
    switchMap(results => {
      if (!results.length) {
        console.error(colorize(`✗ No results found for query: "${sound.query}"`, 'red'));
        return of(null);
      }

      // Print all alternatives
      console.info(colorize(`\nAlternatives for "${sound.description || sound.query}":`, 'cyan'));
      results.forEach((result, i) => {
        const hasPreview = result.previews && (result.previews['preview-lq-mp3'] || result.previews['preview-hq-mp3']);
        const line =
          `  ${i < 3 ? colorize('[ALT]', 'green') : '      '} ID: ${result.id}, Name: "${result.name}", User: ${result.username}, Duration: ${result.duration}s, URL: ${result.url}` +
          (hasPreview ? colorize(' [preview available]', 'green') : colorize(' [no preview]', 'yellow'));
        console.info(line);
      });

      // Download up to 3 valid previews (primary + 2 alternatives)
      const valid = getValidPreviews(results, 3);
      if (!valid.length) {
        console.error(colorize(`✗ No valid MP3 preview found for "${sound.query}"`, 'red'));
        return of(null);
      }

      return forkJoin(
        valid.map((result, idx) => {
          const previewUrl = result.previews['preview-lq-mp3'] || result.previews['preview-hq-mp3'];
          const altNameMp3 = idx === 0 ? `${base}.mp3` : `${base}-alternative-${idx}.mp3`;
          const destMp3 = path.join(dir, altNameMp3);
          dests.push(destMp3);
          console.info(colorize(`→ Downloading "${result.name}" (ID: ${result.id}) as ${altNameMp3} from: ${previewUrl}`, 'blue'));
          // Download MP3
          return from(download(previewUrl, destMp3)).pipe(
            map(() => {
              console.info(colorize(`✓ Downloaded ${altNameMp3} from Freesound`, 'green'));
              // Optionally, download as .wav if you have a WAV preview (Freesound usually only provides MP3 previews)
              // If you want to convert MP3 to WAV, you would need ffmpeg or similar tool.
              return true;
            }),
            catchError(err => {
              console.error(colorize(`✗ Failed to download ${altNameMp3}: ${err.message}`, 'red'));
              return of(null);
            })
          );
        })
      );
    }),
    catchError(err => {
      console.error(colorize(`✗ Failed to process ${sound.name}: ${err.message}`, 'red'));
      return of(null);
    })
  );
}

function cleanOldMp3s() {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (file.endsWith('.mp3')) {
        fs.unlinkSync(path.join(dir, file));
        console.info(colorize(`Deleted old file: ${file}`, 'gray'));
      }
    });
  }
}

function run() {
  cleanOldMp3s();
  console.info(colorize('Starting typewriter sound download process...', 'magenta'));
  forkJoin(sounds.map(sound => ensureSound(sound))).subscribe({
    complete: () => {
      console.info(colorize('✓ All typewriter sounds are ready!', 'green'));
    }
  });
}

run();
