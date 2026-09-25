const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const toCrc = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePng(size) {
  const width = size;
  const height = size;

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  // Scanlines
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  const bgR = 0xFB, bgG = 0xF6, bgB = 0xEE; // Cream #FBF6EE
  const brandR = 0x1F, brandG = 0x5B, brandB = 0x45; // Forest green #1F5B45
  const goldR = 0xF2, goldG = 0xB3, goldB = 0x3D; // Amber #F2B33D

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.42;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // filter type 0
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        // Inner circle
        const isLeaf = (dx > -radius * 0.4 && dy < radius * 0.3 && (dx + dy) > 0);
        if (isLeaf) {
          rawData[offset++] = brandR;
          rawData[offset++] = brandG;
          rawData[offset++] = brandB;
          rawData[offset++] = 255;
        } else if (Math.abs(dist - radius * 0.65) < width * 0.03) {
          // Gold orbit ring
          rawData[offset++] = goldR;
          rawData[offset++] = goldG;
          rawData[offset++] = goldB;
          rawData[offset++] = 255;
        } else {
          rawData[offset++] = bgR;
          rawData[offset++] = bgG;
          rawData[offset++] = bgB;
          rawData[offset++] = 255;
        }
      } else {
        // Outer bg
        rawData[offset++] = bgR;
        rawData[offset++] = bgG;
        rawData[offset++] = bgB;
        rawData[offset++] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180));
console.log('Successfully generated PWA and Apple touch icons');
