// Archon Fleet şifre özeti üretir. Şifre ekrana yazılmaz, hiçbir dosyaya kaydedilmez.
//   npm run fleet:password
// Çıktıdaki iki satırı barındırma ortamının (Vercel > Settings > Environment
// Variables) değişkenlerine ekleyin. Şifreyi değiştirmek için yeniden çalıştırın.
import { randomBytes, scryptSync } from "node:crypto";

function readHidden(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      let data = "";
      stdin.setEncoding("utf8");
      stdin.on("data", (c) => (data += c));
      stdin.on("end", () => resolve(data.split(/\r?\n/)[0] ?? ""));
      return;
    }
    let value = "";
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    stdin.resume();
    const onData = (char) => {
      if (char === "\u0003") process.exit(130);
      if (char === "\r" || char === "\n" || char === "\u0004") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.off("data", onData);
        process.stdout.write("\n");
        resolve(value);
      } else if (char === "\u007f" || char === "\b") {
        value = value.slice(0, -1);
      } else {
        value += char;
      }
    };
    stdin.on("data", onData);
  });
}

const password = process.env.FLEET_NEW_PASSWORD ?? (await readHidden("Yeni Fleet şifresi (en az 10 karakter): "));
if (!password || password.length < 10) {
  console.error("Şifre en az 10 karakter olmalı.");
  process.exit(1);
}
const N = 16384;
const r = 8;
const p = 1;
const salt = randomBytes(16);
const key = scryptSync(password.normalize("NFKC"), salt, 32, { N, r, p, maxmem: 64 * 1024 * 1024 });
console.log(`\nFLEET_PASSWORD_HASH=scrypt:${N}:${r}:${p}:${salt.toString("base64url")}:${key.toString("base64url")}`);
console.log(`FLEET_SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
