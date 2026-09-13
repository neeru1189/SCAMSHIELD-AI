import jsQR from "jsqr";
import { Jimp } from "jimp";

export async function decodeQrFromImage(imageBuffer: Buffer) {
  const image = await Jimp.read(imageBuffer);
  const { data, width, height } = image.bitmap;
  const uintData = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
  const decoded = jsQR(uintData, width, height);

  return decoded?.data ?? null;
}
