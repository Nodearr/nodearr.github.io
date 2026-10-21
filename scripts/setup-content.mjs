// Reuse procedures from the selected Nodearr checkout in the first-run guide.
// Section selection uses Markdown's syntax tree so headings inside code are ignored.
import { fromMarkdown } from 'mdast-util-from-markdown';

const text = (node) => node.value ?? (node.children ?? []).map(text).join('');

export function section(source, heading, { optional = false } = {}) {
  const nodes = fromMarkdown(source).children;
  const start = nodes.findIndex((node) => node.type === 'heading' && text(node) === heading);
  if (start < 0) {
    if (optional) return undefined;
    throw new Error(`The setup guide requires the section: ${heading}`);
  }
  const end = nodes.slice(start + 1).find((node) => node.type === 'heading' && node.depth <= nodes[start].depth);
  const body = source.slice(nodes[start].position.end.offset, end?.position.start.offset).trim();
  // A platform's section can end with its enclosing tab group's closing marker.
  let tabs = 0;
  return body.replace(/^<!--\s*(tabs:[\w-]+|\/tabs)\s*-->$/gm, (marker, action) => {
    if (action !== '/tabs') { tabs++; return marker; }
    if (!tabs) return '';
    tabs--;
    return marker;
  }).trim();
}

export function excerpt(source, name) {
  const nodes = fromMarkdown(source).children;
  const start = nodes.findIndex((node) => node.type === 'html' && node.value === `<!-- setup:${name} -->`);
  if (start < 0) return undefined;
  const end = nodes.findIndex((node, index) => index > start && node.type === 'html' && node.value === `<!-- /setup:${name} -->`);
  if (end < 0) throw new Error(`Unclosed setup excerpt: ${name}`);
  return source.slice(nodes[start].position.end.offset, nodes[end].position.start.offset).trim();
}

export function nodearrCompose(source) {
  const service = source.match(/^  nodearr:\n[\s\S]*?(?=^  [\w-]+:|$(?![\s\S]))/m)?.[0];
  if (!service) throw new Error('The example Compose file must contain a nodearr service.');
  return 'services:\n' + service.split('\n').filter((line) => line.trim() && !line.trimStart().startsWith('#')).join('\n');
}

export function setupContent({ installing, apps, friends, fetching, compose }) {
  const chunks = {};
  for (const platform of ['Windows', 'Linux', 'macOS', 'Docker']) {
    chunks[platform] = { from: 'installing.md', body: section(installing, platform) };
  }

  // Published 0.2.4 predates the inline Compose example. Render the Nodearr service from
  // that same checkout's example, retaining its original networking and folder guidance.
  if (!/```ya?ml\n/.test(chunks.Docker.body)) {
    chunks.Docker.body += '\n\nSave this as `docker-compose.yml`, replacing the example paths and user/group IDs as described here:\n\n```yaml\n' + nodearrCompose(compose) + '\n```\n\nFrom its folder, start Nodearr:\n\n```sh\ndocker compose up -d nodearr\n```';
    chunks.Docker.body += '\n\nOn Docker Desktop, or for bridge networking, remove `network_mode: host` and add these ports under the Nodearr service. Forward UDP 6633 on the router to this machine:\n\n```yaml\nports:\n  - "6633:6633/tcp"\n  - "6633:6633/udp"\n```';
  }

  let signIn = excerpt(installing, 'sign-in');
  if (!signIn) {
    const first = section(installing, 'The first start');
    const list = fromMarkdown(first).children.find((node) => node.type === 'list');
    if (!list?.children.length) throw new Error('The first-start section must include sign-in steps.');
    signIn = first.slice(0, list.children[0].position.end.offset);
  }
  chunks.SignIn = { from: 'installing.md', body: signIn };
  // These short fallbacks cover the published guide before it had reusable first-run tasks.
  chunks.Name = { from: 'installing.md', body: excerpt(installing, 'name') ?? 'On **Home**, under **Choose your name**, enter a name your friends will recognize and select **Use this name**. You can change it later under **Settings > Node**, in **Name**.' };

  chunks.Connection = { from: 'connecting-apps.md', body: section(apps, 'What to fill in') + '\n\n### Server addresses\n\n' + section(apps, 'When the apps are in Docker') + '\n\n### Add the connection\n\n' + section(apps, 'Adding an app') };
  chunks.Folders = { from: 'connecting-apps.md', body: section(apps, 'The two folders that have to line up') };
  chunks.CreateInvite = { from: 'friends-and-sharing.md', body: section(friends, 'Inviting a friend') };
  chunks.UseInvite = { from: 'friends-and-sharing.md', body: section(friends, "Using a friend's invite") };
  chunks.Verify = { from: 'finding-and-fetching.md', body: section(fetching, 'Try your first transfer', { optional: true }) ?? `Both nodes must be running, and your friend must share a file you want.

1. In Nodearr, go to **Nodes > Trusted Nodes** and select **Check connection** for your friend. **Direct** means files can move. If it stays **Relay only**, see [Relay only](troubleshooting.md#relay-only).
2. On **Catalog > Peer Catalog**, select **Sync Peer Catalogs** and find a shared file. If the catalog is empty, ask your friend to check their sharing choices on **Catalog > Sharing**.
3. In your Arr app, add the title if needed and run an interactive search. Choose an acceptable result from the **Nodearr** indexer. If the app rejects it, read the reason in the search results.
4. In Nodearr, open **Activity > Transfers** and wait for **Completed**. Your Arr app imports the verified file at its next check, usually within a minute.
5. Check the title in your Arr app to confirm import. If import failed, check the app's queue and Nodearr's **System > Status** for a folder-access warning.

> [!NOTE]
> Sharing does not immediately download files. Nodearr's indexer has RSS disabled by default; your Arr apps find shared files when they search.` };
  return chunks;
}
