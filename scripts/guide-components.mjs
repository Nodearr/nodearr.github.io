// Keep the guide readable on GitHub, then add Starlight components to the site's copy.
// Parse Markdown before editing it so code examples, nested lists and quoted text stay intact.
import { fromMarkdown } from 'mdast-util-from-markdown';

const asideTypes = { NOTE: 'note', TIP: 'tip', IMPORTANT: 'note', WARNING: 'caution', CAUTION: 'danger' };

export function guideComponents(markdown, { steps = true } = {}) {
  const components = new Set();

  function render(source) {
    const tree = fromMarkdown(source);
    const edits = [];
    const replace = (node, value) => edits.push([node.position.start.offset, node.position.end.offset, value]);
    const insert = (offset, value) => edits.push([offset, offset, value]);
    let tabs;

    function visit(node) {
      if (node.type === 'text') {
        const original = source.slice(node.position.start.offset, node.position.end.offset);
        // MDX treats braces as JavaScript. Preserve literal prose, including escaped braces.
        const escaped = original.replace(/(?<!\\)[{}]/g, '\\$&');
        if (escaped !== original) replace(node, escaped);
      } else if (node.type === 'html') {
        if (/^<!--/.test(node.value)) return;
        // The guide uses native disclosure elements for optional instructions. Other raw tags
        // (for example an unformatted <placeholder>) must remain text rather than MDX elements.
        if (!/^<\/?(?:details|summary)(?:\s|>)/.test(node.value)) {
          replace(node, node.value.replaceAll('<', '&lt;').replaceAll('{', '&#123;').replaceAll('}', '&#125;'));
        }
      }
      for (const child of node.children ?? []) visit(child);
    }

    for (const node of tree.children) {
      const marker = node.type === 'html' && node.value.match(/^<!--\s*(tabs:([\w-]+)|\/tabs)\s*-->$/);
      if (marker) {
        if (marker[2]) {
          if (tabs) throw new Error('Tab groups cannot be nested.');
          tabs = { count: 0, depth: undefined };
          components.add('Tabs');
          components.add('TabItem');
          replace(node, `<Tabs syncKey=${JSON.stringify(marker[2])}>`);
        } else {
          if (!tabs || tabs.count < 2) throw new Error('A tab group needs at least two headings.');
          replace(node, '</TabItem>\n</Tabs>');
          tabs = undefined;
        }
        continue;
      }

      if (tabs && node.type === 'heading' && (!tabs.depth || node.depth <= tabs.depth)) {
        tabs.depth ??= node.depth;
        if (node.depth !== tabs.depth) throw new Error('All tab headings must have the same depth.');
        const label = source.slice(node.position.start.offset, node.position.end.offset).replace(/^#+\s+/, '');
        insert(node.position.start.offset, `${tabs.count++ ? '</TabItem>\n\n' : ''}<TabItem label=${JSON.stringify(label)}>\n\n`);
        // Keep the heading and its existing anchor: old links and search results still work.
      } else if (tabs && !tabs.count) {
        throw new Error('Start a tab group with a heading.');
      }

      if (node.type === 'blockquote') {
        const raw = source.slice(node.position.start.offset, node.position.end.offset);
        const alert = raw.match(/^> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\n/);
        if (alert) {
          components.add('Aside');
          const body = raw.slice(alert[0].length).replace(/^> ?/gm, '');
          replace(node, `<Aside type="${asideTypes[alert[1]]}">\n\n${render(body)}\n\n</Aside>`);
          continue;
        }
      }

      if (steps && node.type === 'list' && node.ordered) {
        components.add('Steps');
        insert(node.position.start.offset, '<Steps>\n\n');
        insert(node.position.end.offset, '\n\n</Steps>');
      }
      if (node.type === 'html' && /^<!--/.test(node.value)) {
        replace(node, '');
      } else {
        visit(node);
      }
    }

    if (tabs) throw new Error('A tab group is missing <!-- /tabs -->.');
    // Apply from right to left. Stable ordering puts a wrapper before an edit at its start.
    edits.sort((a, b) => b[0] - a[0] || b[1] - a[1]);
    for (const [start, end, value] of edits) source = source.slice(0, start) + value + source.slice(end);
    return source;
  }

  const body = render(markdown);
  return { body, components: [...components].sort() };
}
