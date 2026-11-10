// 저장소 밖 원본 폴더의 사진에서 위치정보 등 메타데이터를 지운 사본을 public/images/reviews/<slug>/에 만드는 스크립트
// 사용법: npm run strip-exif -- <slug>   (원본 폴더는 .env.local의 PHOTO_SOURCE_DIR, 원본은 <원본 폴더>/<slug>/ 안에 둔다)
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { findMetadata, HEIC_EXTENSIONS } from "./photo-metadata.ts";

const MAX_SIZE = 1600; // 긴 변
const QUALITY = 82;
const INPUT_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function fail(message: string): never {
  console.error(`사진 사본을 만들지 못했어요. ${message}`);
  process.exit(1);
}

const slug = process.argv[2];
if (!slug || !SLUG_PATTERN.test(slug)) {
  fail("후기 slug를 인자로 넘겨주세요. 예: npm run strip-exif -- gwangalli-night");
}
const sourceRoot = process.env.PHOTO_SOURCE_DIR;
if (!sourceRoot) fail(".env.local에 PHOTO_SOURCE_DIR=원본 사진 폴더 경로를 적어주세요. 예: PHOTO_SOURCE_DIR=D:\\neo-eodiga-photos");
const sourceDir = path.join(sourceRoot, slug);
if (!existsSync(sourceDir)) fail(`원본 폴더가 없어요. (${sourceDir})`);

const files = readdirSync(sourceDir).filter((name) => statSync(path.join(sourceDir, name)).isFile());
const heic = files.filter((name) => HEIC_EXTENSIONS.includes(path.extname(name).toLowerCase()));
if (heic.length > 0) {
  fail(
    `HEIC 사진은 처리할 수 없어요. JPG로 바꿔서 넣어주세요. 아이폰은 설정 > 카메라 > 포맷 > 높은 호환성을 고르면 JPG로 찍혀요. (${heic.join(", ")})`,
  );
}
const photos = files.filter((name) => INPUT_EXTENSIONS.includes(path.extname(name).toLowerCase()));
const skipped = files.filter((name) => !photos.includes(name));
if (photos.length === 0) fail(`처리할 사진(${INPUT_EXTENSIONS.join(", ")})이 없어요. (${sourceDir})`);

// 사본 이름은 소문자, 밑줄은 하이픈, 확장자는 .jpg다. 영문 소문자·숫자·하이픈만 남지 않으면 멈춘다.
const outputs = photos.map((name) => ({ name, out: `${path.parse(name).name.toLowerCase().replace(/_/g, "-")}.jpg` }));
const badNames = outputs.filter(({ out }) => !SLUG_PATTERN.test(out.slice(0, -".jpg".length)));
if (badNames.length > 0) {
  fail(`파일 이름은 영문, 숫자, 하이픈, 밑줄만 써주세요. (${badNames.map((o) => o.name).join(", ")})`);
}
const duplicated = outputs.filter((o, i) => outputs.findIndex((p) => p.out === o.out) !== i);
if (duplicated.length > 0) fail(`사본 이름이 겹쳐요. (${duplicated.map((o) => o.name).join(", ")})`);

const outDir = path.join(process.cwd(), "public", "images", "reviews", slug);
mkdirSync(outDir, { recursive: true });

for (const { name, out } of outputs) {
  const outPath = path.join(outDir, out);
  // rotate()로 회전 정보를 화소에 반영한다. 메타데이터를 따로 지정하지 않으면 출력에서 EXIF, XMP, IPTC가 빠진다.
  const info = await sharp(path.join(sourceDir, name))
    .rotate()
    .resize({ width: MAX_SIZE, height: MAX_SIZE, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" }) // 투명한 PNG를 JPEG로 바꿀 때 흰 바탕을 쓴다
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(outPath);
  const left = await findMetadata(outPath);
  if (left.length > 0) fail(`사본에 메타데이터(${left.join(", ")})가 남았어요. (${outPath})`);
  console.log(`${name} → public/images/reviews/${slug}/${out} (${info.width}×${info.height}, ${Math.round(info.size / 1024)}KB)`);
}

if (skipped.length > 0) console.log(`사진이 아니라서 건너뛴 파일: ${skipped.join(", ")}`);
console.log(`위치정보를 지운 사본 ${outputs.length}장을 만들었어요.`);
