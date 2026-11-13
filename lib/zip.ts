import zlib from 'zlib';

export interface ZipFileEntry {
  name: string;
  data: Buffer;
}

/**
 * Utilitário zero-dependency para criação de arquivos .ZIP padrão em Node.js
 */
export function createZipBuffer(entries: ZipFileEntry[]): Buffer {
  const localHeaders: Buffer[] = [];
  const centralHeaders: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const filenameBuf = Buffer.from(entry.name, 'utf8');
    const uncompressedData = entry.data;
    const uncompressedSize = uncompressedData.length;

    // Calcular CRC32
    const crc = crc32(uncompressedData);

    // Comprimir dados usando deflateRaw
    const compressedData = zlib.deflateRawSync(uncompressedData);
    const compressedSize = compressedData.length;

    // Local file header (30 bytes)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // Local file header signature
    localHeader.writeUInt16LE(20, 4);         // Version needed to extract (2.0)
    localHeader.writeUInt16LE(0x0800, 6);     // General purpose bit flag (UTF-8 filename)
    localHeader.writeUInt16LE(8, 8);          // Compression method (8 = Deflate)
    localHeader.writeUInt16LE(0, 10);         // Last mod file time
    localHeader.writeUInt16LE(0, 12);         // Last mod file date
    localHeader.writeUInt32LE(crc, 14);       // CRC-32
    localHeader.writeUInt32LE(compressedSize, 18);   // Compressed size
    localHeader.writeUInt32LE(uncompressedSize, 22); // Uncompressed size
    localHeader.writeUInt16LE(filenameBuf.length, 26); // Filename length
    localHeader.writeUInt16LE(0, 28);         // Extra field length

    const fullLocal = Buffer.concat([localHeader, filenameBuf, compressedData]);
    localHeaders.push(fullLocal);

    // Central directory file header (46 bytes)
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // Central file header signature
    centralHeader.writeUInt16LE(20, 4);         // Version made by
    centralHeader.writeUInt16LE(20, 6);         // Version needed to extract
    centralHeader.writeUInt16LE(0x0800, 8);     // General purpose bit flag
    centralHeader.writeUInt16LE(8, 10);         // Compression method
    centralHeader.writeUInt16LE(0, 12);         // Last mod file time
    centralHeader.writeUInt16LE(0, 14);         // Last mod file date
    centralHeader.writeUInt32LE(crc, 16);       // CRC-32
    centralHeader.writeUInt32LE(compressedSize, 20);   // Compressed size
    centralHeader.writeUInt32LE(uncompressedSize, 24); // Uncompressed size
    centralHeader.writeUInt16LE(filenameBuf.length, 28); // Filename length
    centralHeader.writeUInt16LE(0, 30);         // Extra field length
    centralHeader.writeUInt16LE(0, 32);         // File comment length
    centralHeader.writeUInt16LE(0, 34);         // Disk number start
    centralHeader.writeUInt16LE(0, 36);         // Internal file attributes
    centralHeader.writeUInt32LE(0, 38);         // External file attributes
    centralHeader.writeUInt32LE(offset, 42);    // Relative offset of local header

    const fullCentral = Buffer.concat([centralHeader, filenameBuf]);
    centralHeaders.push(fullCentral);

    offset += fullLocal.length;
  }

  const centralDirOffset = offset;
  const centralDirSize = centralHeaders.reduce((sum, b) => sum + b.length, 0);

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);          // End of central dir signature
  eocd.writeUInt16LE(0, 4);                   // Number of this disk
  eocd.writeUInt16LE(0, 6);                   // Disk where central directory starts
  eocd.writeUInt16LE(entries.length, 8);      // Number of central directory records on this disk
  eocd.writeUInt16LE(entries.length, 10);     // Total number of central directory records
  eocd.writeUInt32LE(centralDirSize, 12);     // Size of central directory
  eocd.writeUInt32LE(centralDirOffset, 16);   // Offset of start of central directory
  eocd.writeUInt16LE(0, 20);                  // ZIP file comment length

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}

// Implementação rápida de CRC-32 padrão
const crcTable: Uint32Array = (() => {
  let c: number;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}
