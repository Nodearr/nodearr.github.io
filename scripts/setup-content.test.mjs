import assert from 'node:assert/strict';
import test from 'node:test';
import { excerpt, nodearrCompose, section, setupContent } from './setup-content.mjs';

test('section selection ignores headings in code and preserves subordinate content', () => {
  const source = '# Guide\n\n## Install\n\nUse this:\n\n```md\n## Fake\n```\n\n### Details\n\nKeep this.\n\n## Next\n\nOther task.';
  assert.equal(section(source, 'Install'), 'Use this:\n\n```md\n## Fake\n```\n\n### Details\n\nKeep this.');
  assert.throws(() => section(source, 'Missing'));
});

test('a selected platform drops only its enclosing closing tab marker', () => {
  const source = '<!-- tabs:platform -->\n\n### Windows\n\nInstall.\n\n### Docker\n\nRun.\n\n<!-- /tabs -->\n\n## Next\n';
  assert.equal(section(source, 'Docker'), 'Run.');
  const network = '## Network\n\n<!-- tabs:network -->\n\n### Host\n\nA.\n\n### Bridge\n\nB.\n\n<!-- /tabs -->\n';
  assert.match(section(network, 'Network'), /<!-- \/tabs -->$/);
});

test('named excerpts reuse exactly the source content and reject missing boundaries', () => {
  const source = '# Guide\n\n<!-- setup:name -->\n\nChoose your name.\n\n<!-- /setup:name -->\n\nOther instructions.';
  assert.equal(excerpt(source, 'name'), 'Choose your name.');
  assert.equal(excerpt(source, 'missing'), undefined);
  assert.throws(() => excerpt(source.replace('<!-- /setup:name -->', ''), 'name'));
  assert.equal(excerpt('```md\n<!-- setup:name -->\n```', 'name'), undefined);
});

test('legacy Compose extraction includes Nodearr alone with its actual mounts and network', () => {
  const compose = 'services:\n  nodearr:\n    # A comment\n    image: nodearr\n    volumes:\n      - ./downloads:/downloads\n    network_mode: host\n\n  sonarr:\n    image: sonarr\n';
  assert.equal(nodearrCompose(compose), 'services:\n  nodearr:\n    image: nodearr\n    volumes:\n      - ./downloads:/downloads\n    network_mode: host');
  assert.throws(() => nodearrCompose('services:\n  sonarr:\n    image: sonarr'));
});

function sources() {
  return {
    installing: '# Installing\n\n## Windows\n\nWindows source.\n\n## Linux\n\nLinux source.\n\n## macOS\n\nMac source.\n\n## Docker\n\nDocker source.\n\n## The first start\n\nOpen Nodearr.\n\n1. Sign in.\n2. Complete Home.\n',
    apps: '# Apps\n\n## Adding an app\n\nTest, then Save.\n\n## What to fill in\n\nApplication Server and API Key.\n\n## When the apps are in Docker\n\nUse the host gateway.\n\n## The two folders that have to line up\n\nMatch downloads and libraries.\n',
    friends: "# Friends\n\n## Inviting a friend\n\nCreate Invite.\n\n## Using a friend's invite\n\nRedeem Invite.\n",
    fetching: '# Finding and fetching\n\n## What your friends have\n\nOffers.\n',
    compose: 'services:\n  nodearr:\n    image: nodearr\n  sonarr:\n    image: sonarr\n',
  };
}

test('the published guide supplies complete inline procedures without modern excerpt markers', () => {
  const chunks = setupContent(sources());
  assert.match(chunks.Docker.body, /```yaml\nservices:\n  nodearr:/);
  assert.match(chunks.Docker.body, /docker compose up -d nodearr/);
  assert.match(chunks.Docker.body, /6633\/udp/);
  assert.doesNotMatch(chunks.Docker.body, /image: sonarr/);
  assert.equal(chunks.SignIn.body, 'Open Nodearr.\n\n1. Sign in.');
  assert.match(chunks.Connection.body, /API Key/);
  assert.match(chunks.Connection.body, /host gateway/);
  assert.match(chunks.Verify.body, /Check connection/);
  assert.match(chunks.Verify.body, /confirm import/);
});

test('canonical excerpt and task updates appear in the setup page without another authored copy', () => {
  const source = sources();
  source.installing += '\n<!-- setup:name -->\n\nNew canonical name procedure.\n\n<!-- /setup:name -->\n';
  source.fetching += '\n## Try your first transfer\n\nNew canonical verification.\n';
  let chunks = setupContent(source);
  assert.equal(chunks.Name.body, 'New canonical name procedure.');
  assert.equal(chunks.Verify.body, 'New canonical verification.');
  source.installing = source.installing.replace('Windows source.', 'Updated Windows source.');
  chunks = setupContent(source);
  assert.equal(chunks.Windows.body, 'Updated Windows source.');
});
