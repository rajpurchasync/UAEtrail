declare module 'heic-convert' {
  interface HeicConvertInput {
    buffer: Buffer;
    format: 'JPEG' | 'PNG';
    quality?: number;
  }

  export default function convert(input: HeicConvertInput): Promise<ArrayBuffer>;
}
