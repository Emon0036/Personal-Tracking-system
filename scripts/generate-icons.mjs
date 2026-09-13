import { deflateSync } from 'node:zlib'
import { writeFile } from 'node:fs/promises'

// Generate install icons without adding a graphics dependency.
function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const name = Buffer.from(type), length = Buffer.alloc(4), checksum = Buffer.alloc(4)
  length.writeUInt32BE(data.length); checksum.writeUInt32BE(crc32(Buffer.concat([name, data])))
  return Buffer.concat([length, name, data, checksum])
}
function rounded(x, y, left, top, width, radius) {
  const dx = Math.max(left + radius - x, 0, x - (left + width - radius))
  const dy = Math.max(top + radius - y, 0, y - (top + width - radius))
  return x >= left && x < left + width && y >= top && y < top + width && dx * dx + dy * dy <= radius * radius
}
for (const size of [192, 512]) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const px = (x + 0.5) * 512 / size, py = (y + 0.5) * 512 / size
    const mark = rounded(px, py, 128, 128, 112, 24) || rounded(px, py, 272, 128, 112, 24) || rounded(px, py, 128, 272, 112, 24) || (px - 328) ** 2 + (py - 328) ** 2 <= 56 ** 2
    const offset = y * (size * 4 + 1) + 1 + x * 4
    raw.set(mark ? [128, 213, 177, 255] : [19, 44, 40, 255], offset)
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
  await writeFile(new URL(`../public/icon-${size}.png`, import.meta.url), png)
}
