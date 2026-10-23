# nodearr.github.io

The website at [nodearr.com](https://nodearr.com): an introduction, a Getting started guide, packages and downloads, and the docs of the newest Nodearr release. It is built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build), and published with GitHub Pages.

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

What is written here: the home page, the structure of Getting started, the packages page and the API page's frame. Getting started embeds installation, connection and pairing procedures from the same released guide, with direct release downloads in the platform tabs. Readers can complete their first transfer without navigating between documentation pages. The packages page and setup guide share one build-time release lookup.

The API frame is an Astro page at [`src/pages/api/index.astro`](src/pages/api/index.astro), so `/api/` works in development and in the published site. Its generated OpenAPI document remains at `/api/openapi.json`.

The header, home-page title and API header use the repository's two-color wordmark: neutral `Node` and teal `arr`. [`wordmark.css`](src/styles/wordmark.css) uses the colors from Nodearr's `Logo/banner-dark.svg` and `banner-light.svg`; keep those banners as the reference for branding. Ordinary product names in prose and page metadata remain plain text.

## Publishing

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and publishes the site:

- on every push to `main` here;
- when Nodearr publishes a release: its workflow sends a `nodearr-release` dispatch with the tag;
- by hand from the Actions tab, optionally for another Nodearr tag or branch. The name may hold only letters, digits, `.`, `_`, `-` and `/`; anything else stops the run.

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

The sync also writes ignored MDX components under `src/generated/setup/`. Getting started imports those components, so run sync before starting the site or building it after a fresh checkout.

`--ref` sets the version used in GitHub links and metadata; it does not fetch or check out that version. For a release preview, check out the release tag in the Nodearr repository first, then pass the same tag to `--ref`. Without `--ref`, the script uses an exact tag on the checkout's HEAD, or `main` if there is none.

Keep guide links relative. A link's text may be plain or code, as in ``[`docker-compose.yml`](../../docker/docker-compose.yml)``; code outside a link, and code blocks, are left alone.

After syncing, `npm run build` writes a production site to `dist/`. Set `GITHUB_TOKEN` to avoid GitHub's anonymous rate limit when the build fetches release information.

For prose, UI labels and links, follow the [Nodearr contribution guide](https://github.com/Nodearr/Nodearr/blob/main/CONTRIBUTING.md#writing), which adopts the [Google developer documentation style guide](https://developers.google.com/style/highlights).

## Writing with Starlight

Use [Starlight's components](https://starlight.astro.build/components/using-components/) to make the reader's next action clear:

- [Tabs](https://starlight.astro.build/components/tabs/) for alternatives, such as operating systems or Arr apps. Keep shared requirements outside the tabs; give each tab all the context its reader needs.
- [Steps](https://starlight.astro.build/components/steps/) for ordered procedures. Use tables or bullets for states and independent choices.
- [Asides](https://starlight.astro.build/components/asides/) for a prerequisite, caution or useful note beside the action it affects.
- [Link cards](https://starlight.astro.build/components/link-cards/) for a short set of next steps. Use ordinary links within a procedure.
- Native `<details>` and `<summary>` for optional instructions, such as installing a service manually. Keep required setup visible.

Site-owned `.mdx` pages import components directly. The shared guide stays ordinary Markdown so it also works on GitHub. During sync, [`guide-components.mjs`](scripts/guide-components.mjs) wraps top-level ordered lists in Steps (except the contents page) and converts GitHub alerts to Asides. Code blocks and nested lists are preserved. Use Markdown bullets for a list that is not a procedure.

Getting started is a complete first-run procedure. Put required instructions and short explanations on the page; reserve links for advanced alternatives, errors and next steps. [`setup-content.mjs`](scripts/setup-content.mjs) selects procedures by their source headings. For a shorter reusable passage, surround it with `<!-- setup:name -->` and `<!-- /setup:name -->`. The comments stay invisible on GitHub. Update the shared source instead of copying its instructions into the site template. The sync includes compatibility handling for the published 0.2.4 guide, before those excerpts existed.

To group alternative sections into tabs, add these invisible comments around headings at the same level:

```md
<!-- tabs:platform -->

### Windows

Windows instructions.

### Linux

Linux instructions.

<!-- /tabs -->
```

The group name becomes the tabs' `syncKey`. Reuse `platform` and the exact labels `Windows`, `Linux`, `macOS`, `Docker` for installation choices across pages. Use a different key for unrelated choices. Headings remain in each tab so existing anchors continue to work. [`TabAnchors.astro`](src/components/TabAnchors.astro) selects the right tab when a reader follows a heading link, including from search.

Run `npm test`, sync, then `npm run build` after changing the conversion. Preview the tabs, keyboard navigation, saved selections and links into inactive tabs. Also build against the latest release checkout: the conversion supports older guide files without tab markers, and the release-selection workflow is unchanged.

`npm audit` reports `postcss-selector-parser` below 7.1.6, through Starlight's code highlighting (expressive-code 0.44). It is slow on crafted CSS, and here it only ever reads the site's own CSS, while the site is built. It goes away when expressive-code moves to the newer parser.

## Licence

The site's own code and pages are [GPL-3.0](LICENSE), as Nodearr is. Nodearr is not affiliated with or endorsed by the [Sonarr](https://sonarr.tv/), [Radarr](https://radarr.video/), [Lidarr](https://lidarr.audio/), [Whisparr](https://whisparr.com/), [Prowlarr](https://prowlarr.com/) or [Servarr](https://wiki.servarr.com/) projects.
