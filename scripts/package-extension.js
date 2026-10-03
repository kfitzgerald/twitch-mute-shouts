#!/usr/bin/env node
/**
 * Packages the extension into zip files ready for store submission.
 *
 * Output:
 *   dist/twitch-mute-shouts-chrome.zip   – Chrome Web Store
 *   dist/twitch-mute-shouts-firefox.zip  – Firefox Add-ons (AMO)
 *
 * The only difference between the two packages is that the Firefox zip retains
 * the `browser_specific_settings` key (required by AMO), which Chrome ignores
 * anyway — so both browsers can actually load the same zip.  We produce two
 * separate files so you have explicit artifacts for each store upload.
 */

const fs   = require('node:fs');
const path = require('node:path');

const ROOT    = path.join(__dirname, '..');
const DIST    = path.join(ROOT, 'dist');

// Files that go into the extension package
const EXTENSION_FILES = [
  'manifest.json',
  'content.css',
  'shush.png',
];

// ─── Minimal ZIP writer (no external deps) ───────────────────────────────────

function dosDateTime(date) {
  const d = date || new Date();
  const dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  return { dosDate, dosTime };
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })();
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function writeUInt16LE(n) {
  const b = Buffer.alloc(2); b.writeUInt16LE(n, 0); return b;
}
function writeUInt32LE(n) {
  const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0, 0); return b;
}

function buildZip(entries) {
  // entries: [{ name: string, data: Buffer }]
  const localHeaders = [];
  const centralDirs  = [];
  let offset = 0;
  const { dosDate, dosTime } = dosDateTime();

  for (const { name, data } of entries) {
    const nameBytes = Buffer.from(name, 'utf8');
    const crc = crc32(data);

    // Local file header (method 0 = stored)
    const local = Buffer.concat([
      Buffer.from([0x50, 0x4B, 0x03, 0x04]), // signature
      writeUInt16LE(20),          // version needed
      writeUInt16LE(0),           // flags
      writeUInt16LE(0),           // compression: stored
      writeUInt16LE(dosTime),
      writeUInt16LE(dosDate),
      writeUInt32LE(crc),
      writeUInt32LE(data.length), // compressed size
      writeUInt32LE(data.length), // uncompressed size
      writeUInt16LE(nameBytes.length),
      writeUInt16LE(0),           // extra field length
      nameBytes,
      data,
    ]);

    // Central directory entry
    const central = Buffer.concat([
      Buffer.from([0x50, 0x4B, 0x01, 0x02]), // signature
      writeUInt16LE(20),          // version made by
      writeUInt16LE(20),          // version needed
      writeUInt16LE(0),           // flags
      writeUInt16LE(0),           // compression: stored
      writeUInt16LE(dosTime),
      writeUInt16LE(dosDate),
      writeUInt32LE(crc),
      writeUInt32LE(data.length),
      writeUInt32LE(data.length),
      writeUInt16LE(nameBytes.length),
      writeUInt16LE(0),           // extra
      writeUInt16LE(0),           // comment
      writeUInt16LE(0),           // disk start
      writeUInt16LE(0),           // internal attr
      writeUInt32LE(0),           // external attr
      writeUInt32LE(offset),      // local header offset
      nameBytes,
    ]);

    localHeaders.push(local);
    centralDirs.push(central);
    offset += local.length;
  }

  const centralDirBuf = Buffer.concat(centralDirs);
  const eocd = Buffer.concat([
    Buffer.from([0x50, 0x4B, 0x05, 0x06]), // end of central dir signature
    writeUInt16LE(0),                        // disk number
    writeUInt16LE(0),                        // disk with central dir
    writeUInt16LE(entries.length),
    writeUInt16LE(entries.length),
    writeUInt32LE(centralDirBuf.length),
    writeUInt32LE(offset),
    writeUInt16LE(0),                        // comment length
  ]);

  return Buffer.concat([...localHeaders, centralDirBuf, eocd]);
}

// ─── Main ────────────────────────────────────────────────────────────────────

function checkIcons() {
  const missing = EXTENSION_FILES.filter(f => {
    try { fs.accessSync(path.join(ROOT, f)); return false; } catch { return true; }
  });
  if (missing.length) {
    console.error('Missing files (ensure shush.png exists and re-run `npm run build`):\n  ' + missing.join('\n  '));
    process.exit(1);
  }
}

function loadEntries() {
  return EXTENSION_FILES.map(f => ({
    name: f,
    data: fs.readFileSync(path.join(ROOT, f)),
  }));
}

checkIcons();
fs.mkdirSync(DIST, { recursive: true });

const entries = loadEntries();

// Both zips use the same manifest (Chrome ignores browser_specific_settings).
for (const browser of ['chrome', 'firefox']) {
  const outPath = path.join(DIST, `twitch-mute-shouts-${browser}.zip`);
  const zip = buildZip(entries);
  fs.writeFileSync(outPath, zip);
  console.log(`✓ dist/twitch-mute-shouts-${browser}.zip  (${(zip.length / 1024).toFixed(1)} KB)`);
}

console.log('\nPackaging complete.');
