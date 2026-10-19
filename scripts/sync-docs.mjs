// Brings the docs in from a checkout of the Nodearr repository, so the site publishes the docs of
// one version of Nodearr: the user guide, the changelog and the API description.
//
//   node scripts/sync-docs.mjs [--repo PATH] [--ref TAG]
//
// --repo is the checkout, ../Nodearr/Nodearr unless NODEARR_REPO says otherwise. --ref is the tag
// or branch it is at, which links to anything outside the guide point to on GitHub. Without it,
// the tag at the checkout's HEAD, or main.
//
// The guide stays written for GitHub, where it is also read: relative links between its pages
// become links between the site's pages, and links to anything else in the repository become
// links to it on GitHub, at the same version.

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const github = 'https://github.com/Nodearr/Nodearr';

function option(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const repo = path.resolve(site, option('repo', process.env.NODEARR_REPO ?? '../Nodearr/Nodearr'));

if (!existsSync(path.join(repo, 'docs', 'user-guide'))) {
  console.error(`There is no Nodearr checkout at ${repo}. Say where it is with --repo PATH.`);
  process.exit(1);
}

function git(...args) {
  try {
    return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

const ref = option('ref', git('describe', '--tags', '--exact-match', 'HEAD') || 'main');
const commit = git('rev-parse', 'HEAD');

// Where a page of the repository is on the site, or null when the site does not have it.
function sitePath(repoPath) {
  if (repoPath === 'README.md') return '/';
  if (repoPath === 'CHANGELOG.md') return '/changelog/';
  if (repoPath === 'docs/user-guide/README.md') return '/guide/';

  const guide = repoPath.match(/^docs\/user-guide\/([^/]+)\.md$/);
  return guide ? `/guide/${guide[1]}/` : null;
}

// Every link and image in the Markdown, outside code, pointed where it works on the site.
function rewriteLinks(markdown, from) {
  const parts = markdown.split(/(```[\s\S]*?```|`[^`\n]*`)/);

  return parts
    .map((part, i) =>
      i % 2 === 1
        ? part
        : part.replace(/(!?)\]\(([^)\s]+)\)/g, (whole, image, target) => {
            if (/^([a-z]+:|#|\/)/i.test(target)) return whole;

            const [file, anchor] = target.split('#');
            const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(from), file));
            const hash = anchor ? `#${anchor}` : '';
            const onSite = image ? null : sitePath(resolved);

            if (onSite) return `${image}](${onSite}${hash})`;

            const kind = image ? 'raw' : file.endsWith('/') ? 'tree' : 'blob';
            return `${image}](${github}/${kind}/${ref}/${resolved}${hash})`;
          })
    )
    .join('');
}

// The first heading becomes the page's title, which Starlight shows itself.
function page(repoPath, extra = {}) {
  const source = readFileSync(path.join(repo, repoPath), 'utf8').replace(/\r\n/g, '\n');
  const heading = source.match(/^# (.+)\n+/m);
  const body = heading ? source.replace(heading[0], '') : source;
  const front = {
    title: heading ? heading[1].trim() : path.basename(repoPath, '.md'),
    editUrl: `${github}/edit/main/${repoPath}`,
    ...extra,
  };

  const yaml = Object.entries(front)
    .map(([key, value]) =>
      typeof value === 'object' ? `${key}:\n${Object.entries(value).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`).join('\n')}` : `${key}: ${JSON.stringify(value)}`
    )
    .join('\n');

  return `---\n${yaml}\n---\n\n${rewriteLinks(body, repoPath)}`;
}

// The guide's pages, in the order its contents page lists them.
const guideDir = path.join(repo, 'docs', 'user-guide');
const contents = readFileSync(path.join(guideDir, 'README.md'), 'utf8');
const order = [...contents.matchAll(/\]\(([\w-]+)\.md\)/g)].map((m) => m[1]);
const out = path.join(site, 'src', 'content', 'docs', 'guide');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const name of readdirSync(guideDir).filter((f) => f.endsWith('.md'))) {
  const slug = path.basename(name, '.md');
  const index = slug === 'README';
  const position = order.indexOf(slug);
  const sidebar = index ? { label: 'Contents', order: 0 } : { order: position < 0 ? 99 : position + 1 };

  writeFileSync(path.join(out, index ? 'index.md' : `${slug}.md`), page(`docs/user-guide/${name}`, { sidebar }));
}

writeFileSync(path.join(site, 'src', 'content', 'docs', 'changelog.md'), page('CHANGELOG.md'));

mkdirSync(path.join(site, 'public', 'api'), { recursive: true });
cpSync(path.join(repo, 'src', 'Nodearr.Api.V5', 'openapi.json'), path.join(site, 'public', 'api', 'openapi.json'));

writeFileSync(path.join(site, 'src', 'docs-version.json'), `${JSON.stringify({ ref, commit }, null, 2)}\n`);

console.log(`Docs from Nodearr ${ref} (${commit.slice(0, 7) || 'unknown commit'}): ${readdirSync(out).length} guide pages, the changelog and the API.`);
