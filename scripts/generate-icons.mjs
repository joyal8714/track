import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makePngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPng(width, height, drawFn) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // deflate
  ihdr.writeUInt8(0, 11); // no filter
  ihdr.writeUInt8(0, 12); // no interlace

  const ihdrChunk = makePngChunk('IHDR', ihdr);

  // Raw image data: scanlines with filter byte 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makePngChunk('IDAT', compressed);
  const iendChunk = makePngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function drawDisciplineIcon(x, y, w, h) {
  // Center coordinates normalized (-1 to 1)
  const nx = (x / w) * 2 - 1;
  const ny = (y / h) * 2 - 1;
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Background: Dark zinc radial vignette (#09090b to #18181b)
  let r = 9 + Math.round((1 - Math.min(dist, 1)) * 12);
  let g = 9 + Math.round((1 - Math.min(dist, 1)) * 12);
  let b = 11 + Math.round((1 - Math.min(dist, 1)) * 14);
  let a = 255;

  // Shield shape:
  // x in [-0.55, 0.55], y in [-0.65, 0.7]
  const inShieldX = Math.abs(nx) <= 0.55;
  const inShieldTop = ny >= -0.65 && ny <= 0.1 && inShieldX;
  const shieldVBottom = 0.7 - Math.abs(nx) * 1.1;
  const inShieldBottom = ny > 0.1 && ny <= shieldVBottom && inShieldX;

  const inShield = inShieldTop || inShieldBottom;

  if (inShield) {
    // Shield glow / emerald gradient (#059669 to #10b981)
    const factor = (ny + 0.65) / 1.35;
    r = Math.round(5 + factor * 11);
    g = Math.round(150 + factor * 35);
    b = Math.round(105 + factor * 24);

    // Inner book / chevron symbol in white/gold
    // Check if within center book motif
    const isBookSpine = Math.abs(nx) <= 0.05 && ny >= -0.35 && ny <= 0.35;
    const isLeftPage = nx >= -0.32 && nx <= -0.06 && ny >= -0.28 && ny <= 0.28;
    const isRightPage = nx >= 0.06 && nx <= 0.32 && ny >= -0.28 && ny <= 0.28;

    if (isBookSpine) {
      r = 250;
      g = 250;
      b = 250;
    } else if (isLeftPage || isRightPage) {
      // White page with soft tint
      r = 240;
      g = 253;
      b = 244;
    }
  }

  return [r, g, b, a];
}

const iconsDir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Generating PWA icons...');

const icon192 = createPng(192, 192, drawDisciplineIcon);
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), icon192);

const icon512 = createPng(512, 512, drawDisciplineIcon);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), icon512);
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512.png'), icon512);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), icon192);

// Also write a rich SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="108" fill="#09090b"/>
  <path d="M256 64L384 128V248C384 336 328 416 256 448C184 416 128 336 128 248V128L256 64Z" fill="url(#grad)" stroke="#34d399" stroke-width="12" stroke-linejoin="round"/>
  <path d="M256 160V352M200 200H240M200 240H240M200 280H240M272 200H312M272 240H312M272 280H312" stroke="#ffffff" stroke-width="12" stroke-linecap="round"/>
  <defs>
    <linearGradient id="grad" x1="256" y1="64" x2="256" y2="448" gradientUnits="userSpaceOnUse">
      <stop stop-color="#059669"/>
      <stop offset="1" stop-color="#064e3b"/>
    </linearGradient>
  </defs>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent);

console.log('PWA icons successfully generated in public/icons/');
