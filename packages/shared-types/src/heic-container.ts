const HEIC_FTYP_BRANDS = /^(heic|heix|hevc|hevx|mif1|msf1)/;

/** Detect ISO BMFF HEIC/HEIF from the first bytes (client File slice or server Buffer). */
export const sniffHeicContainerBytes = (header: Uint8Array): boolean => {
  const limit = Math.min(header.length, 64);
  for (let i = 0; i <= limit - 8; i++) {
    if (header[i] !== 0x66 || header[i + 1] !== 0x74 || header[i + 2] !== 0x79 || header[i + 3] !== 0x70) {
      continue;
    }
    if (i + 8 > header.length) continue;
    const brand = String.fromCharCode(header[i + 4]!, header[i + 5]!, header[i + 6]!, header[i + 7]!);
    if (HEIC_FTYP_BRANDS.test(brand)) return true;
  }
  return false;
};

export const sniffHeicContainerBuffer = (input: ArrayBuffer | Uint8Array): boolean => {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  return sniffHeicContainerBytes(bytes);
};
