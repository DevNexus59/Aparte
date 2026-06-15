#!/usr/bin/env node
// Bump automatique de expo.version (app.json) en respectant le semver
// (major.minor.patch) selon les commits "apps/app/**" depuis le dernier tag
// "app-vX.Y.Z" :
//   - "feat|feat!|BREAKING CHANGE"      -> major si "!" ou "BREAKING CHANGE",
//                                          sinon minor
//   - tout le reste (fix, chore, etc.) -> patch
// Ne fait rien si aucun commit pertinent n'a été trouvé depuis le dernier tag.
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const appJsonPath = path.resolve(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const currentVersion = appJson.expo.version;

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

let lastTag = '';
try {
  lastTag = sh('git describe --tags --match "app-v*" --abbrev=0');
} catch {
  // Pas de tag encore : on prend tout l'historique pour ce path.
}

const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
const subjects = sh(`git log ${range} --pretty=format:%s -- apps/app`)
  .split('\n')
  .filter(Boolean);

function setOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  }
}

if (subjects.length === 0) {
  console.log('Aucun commit pertinent depuis', lastTag || 'le début', '- pas de bump.');
  setOutput('bumped', 'false');
  setOutput('version', currentVersion);
  process.exit(0);
}

let bump = 'patch';
for (const subject of subjects) {
  if (/^feat(\(.+\))?!:/.test(subject) || /BREAKING CHANGE/.test(subject)) {
    bump = 'major';
    break;
  }
  if (/^feat(\(.+\))?:/.test(subject) && bump !== 'major') {
    bump = 'minor';
  }
}

const [major, minor, patch] = currentVersion.split('.').map(Number);
let newVersion;
if (bump === 'major') {
  newVersion = `${major + 1}.0.0`;
} else if (bump === 'minor') {
  newVersion = `${major}.${minor + 1}.0`;
} else {
  newVersion = `${major}.${minor}.${patch + 1}`;
}

appJson.expo.version = newVersion;
fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`);

console.log(`expo.version: ${currentVersion} -> ${newVersion} (${bump})`);
setOutput('bumped', 'true');
setOutput('version', newVersion);
