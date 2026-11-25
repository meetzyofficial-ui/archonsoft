// Testler için: Next'in uzantısız TypeScript importlarını ve "@/..." takma adını
// Node'a çözdürür. Uygulama koduna dokunmaz; yalnızca `npm run test:fleet` kullanır.
import { register } from "node:module";
register("./resolve-hook.mjs", import.meta.url);
