// npm install 때 git이 .githooks 폴더의 커밋 전 검사를 쓰도록 설정하는 스크립트(git 저장소가 아니면 건너뛴다)
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

if (!existsSync(".git")) {
  console.log("git 저장소가 아니라서 커밋 전 검사 설정을 건너뛰어요.");
} else {
  try {
    execFileSync("git", ["config", "core.hooksPath", ".githooks"], { stdio: "inherit" });
    console.log("커밋 전 사진 검사를 켰어요. (git config core.hooksPath .githooks)");
  } catch {
    console.warn("커밋 전 검사 설정에 실패했어요. git config core.hooksPath .githooks를 직접 실행해주세요.");
  }
}
