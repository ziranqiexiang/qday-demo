import { generatePrivateKey } from "viem/accounts";
import { readFileSync, writeFileSync } from "node:fs";
const env = readFileSync(".env", "utf8");
writeFileSync(".env", env.replace(/^PRIVATE_KEY=.*$/m, `PRIVATE_KEY=${generatePrivateKey()}`));
console.log("New private key saved in .env");
