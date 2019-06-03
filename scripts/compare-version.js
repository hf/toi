/**
 * compare-version.js <path-to-package.json> <version>
 *
 * Exits with 0 if version in package.json > version.
 * Exits with 1 if version in package.json <= version.
 */

const fs = require("fs");

function version(value) {
  return value.split(".")
      .map(v => parseInt(v))
      .reduce((a, i) => a * 1000 + i, 0);
}

const PATH = process.argv[2];
const COMPARE = version(process.argv[3]);

const pkg = JSON.parse(fs.readFileSync(PATH, "utf-8"));
const packageVersion = version(pkg.version);

if (packageVersion > COMPARE) {
  process.exit(0);
}

console.error("Package version is not greater than NPM version.");

process.exit(1);
