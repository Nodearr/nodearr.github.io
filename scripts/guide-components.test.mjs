import assert from 'node:assert/strict';
import test from 'node:test';
import { guideComponents } from './guide-components.mjs';

test('procedures keep code and nested lists inside one Steps component', () => {
  const markdown = '1. Extract the package.\n\n   ```sh\n   echo "{keep this}"\n   ```\n\n   1. A nested task.\n2. Start Nodearr.\n';
  const result = guideComponents(markdown);
  assert.deepEqual(result.components, ['Steps']);
  assert.equal(result.body, `<Steps>\n\n${markdown.trimEnd()}\n\n</Steps>\n`);
});

test('platform headings retain their anchors and subheadings stay in their tab', () => {
  const result = guideComponents('<!-- tabs:platform -->\n\n## Windows\n\nInstall.\n\n### Service\n\nOptional.\n\n## Linux\n\nRun.\n\n<!-- /tabs -->\n\n## Next\n');
  assert.deepEqual(result.components, ['TabItem', 'Tabs']);
  assert.match(result.body, /<Tabs syncKey="platform">/);
  assert.match(result.body, /<TabItem label="Windows">\n\n## Windows/);
  assert.match(result.body, /### Service\n\nOptional\.\n\n<\/TabItem>\n\n<TabItem label="Linux">/);
  assert.match(result.body, /<\/TabItem>\n<\/Tabs>\n\n## Next/);
});

test('GitHub warnings become asides and literal MDX characters remain prose', () => {
  const result = guideComponents('> [!WARNING]\n> Keep {node.key} private.\n>\n> Use `config.xml`.\n');
  assert.deepEqual(result.components, ['Aside']);
  assert.equal(result.body, '<Aside type="caution">\n\nKeep \\{node.key\\} private.\n\nUse `config.xml`.\n\n</Aside>\n');
});

test('code examples are never interpreted as component markers or procedures', () => {
  const source = '```md\n<!-- tabs:example -->\n\n1. {example}\n\n> [!WARNING]\n> example\n```\n';
  assert.deepEqual(guideComponents(source), { body: source, components: [] });
});

test('disclosures stay native HTML and placeholders stay literal', () => {
  const result = guideComponents('<details>\n<summary>Advanced setup</summary>\n\nUse <placeholder> here.\n\n</details>\n');
  assert.match(result.body, /^<details>\n<summary>/);
  assert.match(result.body, /Use &lt;placeholder> here\./);
  assert.match(result.body, /<\/details>/);
});

test('an overview list can opt out of procedural styling', () => {
  const source = '1. [Installing](/guide/installing/)\n2. [Settings](/guide/settings/)\n';
  assert.deepEqual(guideComponents(source, { steps: false }), { body: source, components: [] });
});

test('invalid tab boundaries fail the sync instead of losing instructions', () => {
  for (const source of [
    '<!-- tabs:platform -->\n\n## Windows\n',
    '<!-- /tabs -->',
    '<!-- tabs:platform -->\n\n## Windows\n\n<!-- /tabs -->',
    '<!-- tabs:platform -->\n\nContent before the first heading.',
    '<!-- tabs:platform -->\n\n## Windows\n\n<!-- tabs:nested -->',
    '<!-- tabs:platform -->\n\n### Windows\n\n## Linux\n\n<!-- /tabs -->',
  ]) assert.throws(() => guideComponents(source));
});
