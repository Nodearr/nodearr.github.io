# nodearr.github.io

The website at [nodearr.com](https://nodearr.com): a home page, downloads, and the docs of the newest Nodearr release. It is built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build), and published with GitHub Pages.

## Where the content comes from

The user guide, the changelog and the API description are not kept here. They live in [Nodearr/Nodearr](https://github.com/Nodearr/Nodearr), beside the code they describe, and change in the same pull requests. The site brings them in when it is built, from the newest published release, so it describes what people can download rather than what is on `main`.

[`scripts/sync-docs.mjs`](scripts/sync-docs.mjs) copies them in from a checkout of that repository:

| From Nodearr/Nodearr | On the site |
| --- | --- |
| `docs/user-guide/*.md` | `/guide/`, in the order the guide's contents page lists them |
| `docs/user-guide/images/` | `/guide/images/`, the guide's screenshots |
| `CHANGELOG.md` | `/changelog/` |
| `src/Nodearr.Api.V5/openapi.json` | `/api/`, rendered with [Scalar](https://scalar.com) |

The guide is still written for GitHub, where it is read too. Links between its pages become links between the site's pages. Links to anything else in the repository, such as decision records or `SECURITY.md`, become links to it on GitHub at the same release. A guide page's "Edit page" link goes to the file in Nodearr/Nodearr.

What is written here: the home page, the download page, which reads the newest release from GitHub when the site is built, and the API page's frame.

## Publishing

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and publishes the site:

- on every push to `main` here;
- when Nodearr publishes a release: its workflow sends a `nodearr-release` dispatch with the tag;
- by hand from the Actions tab, optionally for another Nodearr tag or branch.

Repository settings it needs: Settings → Pages → Source set to **GitHub Actions**, and the custom domain `nodearr.com`.

## Working on it

Node.js 22.12.0 or newer (Astro's minimum), and a checkout of Nodearr/Nodearr beside this one, at `../Nodearr/Nodearr`, or wherever `--repo` or `NODEARR_REPO` says:

```sh
npm ci
```

```sh
node scripts/sync-docs.mjs --repo ../Nodearr/Nodearr --ref main
```

```sh
npm run dev
```

The script copies the checkout's saved files, including uncommitted edits. `--ref` only sets the tag or branch in links to GitHub; it does not check out or fetch that version. For a release preview, first put the source checkout at that tag and give the same tag to `--ref`. Without it, the script uses the tag at the checkout's HEAD, or `main`. The copied files are not committed.

Keep guide links relative, with plain text labels such as `[example compose file](../../docker/docker-compose.yml)`. The link rewriter leaves code spans alone, so a label containing backticks prevents that link from being rewritten.

`npm run build` writes the site to `dist/`. Set `GITHUB_TOKEN` to read the newest release without GitHub's anonymous rate limit.

`npm audit` reports `postcss-selector-parser` below 7.1.6, through Starlight's code highlighting (expressive-code 0.44). It is slow on crafted CSS, and here it only ever reads the site's own CSS, while the site is built. It goes away when expressive-code moves to the newer parser.

## Licence

The site's own code and pages are [GPL-3.0](LICENSE), as Nodearr is. Nodearr is not affiliated with or endorsed by the Sonarr, Radarr, Lidarr, Whisparr, Prowlarr or Servarr projects.
