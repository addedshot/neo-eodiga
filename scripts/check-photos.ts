// public/images 아래 사진에 위치정보 등 메타데이터가 남아 있으면 실패하는 검사(빌드 전과 커밋 전에 돌린다)
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { findMetadata, HEIC_EXTENSIONS, PHOTO_EXTENSIONS } from "./photo-metadata.ts";

const root = path.join(process.cwd(), "public", "images");

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

const files = existsSync(root) ? listFiles(root) : [];
const problems: string[] = [];
let photoCount = 0;

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  const shown = path.relative(process.cwd(), file).split(path.sep).join("/");
  if (HEIC_EXTENSIONS.includes(ext)) {
    problems.push(`${shown}: HEIC 사진은 쓸 수 없어요.`);
  } else if (PHOTO_EXTENSIONS.includes(ext)) {
    photoCount += 1;
    const left = await findMetadata(file);
    if (left.length > 0) problems.push(`${shown}: 메타데이터(${left.join(", ")})가 남아 있어요.`);
  }
}

if (problems.length > 0) {
  console.error(`사진 검사에서 문제 ${problems.length}개를 찾았어요. 위치정보가 공개될 수 있어요.\n- ${problems.join("\n- ")}`);
  console.error("원본은 저장소 밖 폴더에 두고 npm run strip-exif -- <slug>로 사본을 다시 만들어주세요.");
  process.exit(1);
}
console.log(`사진 검사를 통과했어요. 사진 ${photoCount}장.`);
