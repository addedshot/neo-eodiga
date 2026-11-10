// 사진 파일에 위치정보가 들어갈 수 있는 메타데이터(EXIF, XMP, IPTC)가 남아 있는지 알려주는 함수
import sharp from "sharp";

export const PHOTO_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".tif", ".tiff"];
// 설치된 sharp는 HEIC를 읽지 못해서 따로 막는다.
export const HEIC_EXTENSIONS = [".heic", ".heif"];

export async function findMetadata(file: string): Promise<string[]> {
  const { exif, xmp, iptc } = await sharp(file).metadata();
  return [exif && "EXIF", xmp && "XMP", iptc && "IPTC"].filter((name): name is string => Boolean(name));
}
