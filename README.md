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

In the site's GitHub repository, go to **Settings > Pages**, set **Source** to **GitHub Actions** and configure the custom domain as `nodearr.com`.

## Working on it

You need [Node.js](https://nodejs.org/) 22.12.0 or newer and a local checkout of Nodearr/Nodearr. The examples assume that checkout is at `../Nodearr/Nodearr`; use `--repo PATH` or `NODEARR_REPO` for another location.

From this site's repository root, install dependencies:

```sh
npm ci
```

Copy the guide and API description from the Nodearr checkout:

```sh
node scripts/sync-docs.mjs --repo ../Nodearr/Nodearr --ref main
```

Start the local development site:

```sh
npm run dev
```

Run the sync command after changing guide files in the Nodearr checkout, then reload the development site. The script copies saved files, including uncommitted edits. Generated copies are not committed here.

`--ref` sets the version used in GitHub links and metadata; it does not fetch or check out that version. For a release preview, check out the release tag in the Nodearr repository first, then pass the same tag to `--ref`. Without `--ref`, the script uses an exact tag on the checkout's HEAD, or `main` if there is none.

Keep guide links relative. A link's text may be plain or code, as in ``[`docker-compose.yml`](../../docker/docker-compose.yml)``; code outside a link, and code blocks, are left alone.

After syncing, `npm run build` writes a production site to `dist/`. Set `GITHUB_TOKEN` to avoid GitHub's anonymous rate limit when the build fetches release information.

For prose, UI labels and links, follow the [Nodearr contribution guide](https://github.com/Nodearr/Nodearr/blob/main/CONTRIBUTING.md#writing), which adopts the [Google developer documentation style guide](https://developers.google.com/style/highlights).

`npm audit` reports `postcss-selector-parser` below 7.1.6, through Starlight's code highlighting (expressive-code 0.44). It is slow on crafted CSS, and here it only ever reads the site's own CSS, while the site is built. It goes away when expressive-code moves to the newer parser.

## Licence

The site's own code and pages are [GPL-3.0](LICENSE), as Nodearr is. Nodearr is not affiliated with or endorsed by the [Sonarr](https://sonarr.tv/), [Radarr](https://radarr.video/), [Lidarr](https://lidarr.audio/), [Whisparr](https://whisparr.com/), [Prowlarr](https://prowlarr.com/) or [Servarr](https://wiki.servarr.com/) projects.
