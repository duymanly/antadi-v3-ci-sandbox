import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Public-only invariants. These checks MUST NOT fetch any private repository,
// access a secret or use actual hotel, employee or commercial records.
const workflow=readFileSync(
  new URL('../.github/workflows/manual-public-smoke.yml',import.meta.url),'utf8'
);
const fixture=readFileSync(new URL('../src/fixture.mjs',import.meta.url),'utf8');
const packageJson=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));

test('public job runs only for main push of test files or manual dispatch',()=>{
  assert.match(workflow,/^on:\s*\n\s+workflow_dispatch:\s*\n\s+push:/m);
  assert.match(workflow,/branches:\s*\n\s+- main/);
  for(const value of ["src/**","tests/**","package.json"])
    assert.ok(workflow.includes(value));
  assert.doesNotMatch(workflow,/^\s+(?:pull_request|pull_request_target|schedule|repository_dispatch|workflow_run):/m);
});

test('public runner cannot checkout another repository or use credentials',()=>{
  assert.match(workflow,/permissions:\s*\n\s+contents: read/);
  assert.match(workflow,/persist-credentials: false/);
  assert.match(workflow,/github\.repository == 'duymanly\/antadi-v3-ci-sandbox'/);
  assert.doesNotMatch(workflow,/^\s+repository:\s*\S+/m);
  assert.doesNotMatch(workflow,/\$\{\{\s*secrets\./);
  assert.doesNotMatch(workflow,/\b(?:git clone|curl|wget|wrangler deploy|wrangler preview)\b/i);
  assert.doesNotMatch(workflow,/\b(?:workflow_call|id-token: write|contents: write)\b/i);
});

test('CI has bounded runtime and refuses automatic deployment',()=>{
  assert.match(workflow,/timeout-minutes: 12/);
  assert.match(workflow,/cancel-in-progress: true/);
  assert.doesNotMatch(workflow,/\b(?:npm publish|gh release|wrangler versions upload|wrangler deploy)\b/i);
});

test('fixture and dependency graph remain synthetic and standalone',()=>{
  assert.match(fixture,/fictional-001/);
  assert.match(fixture,/Example City/);
  assert.match(fixture,/:memory:/);
  assert.doesNotMatch(fixture,/https?:\/\//i);
  assert.equal(Object.keys(packageJson.devDependencies).sort().join(','),'jose,playwright');
  assert.equal(packageJson.private,true);
});
