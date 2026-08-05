import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const packageJsonPath = path.resolve(process.cwd(), "package.json");
const content = fs.readFileSync(packageJsonPath, "utf-8");
const pkg = JSON.parse(content);

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, "0");
const day = String(now.getDate()).padStart(2, "0");
const todayVersion = `${year}.${month}.${day}`;

if (pkg.version !== todayVersion) {
	console.log(`[pre-commit] Updating version in package.json: ${pkg.version} -> ${todayVersion}`);
	pkg.version = todayVersion;
	fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, "\t")}\n`, "utf-8");
	try {
		execSync("git add package.json", { stdio: "inherit" });
	} catch {
		// Ignore if git command fails
	}
}
