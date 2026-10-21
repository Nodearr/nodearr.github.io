// Share one build-time release lookup between the setup guide and the packages page.
export const releasesPage = 'https://github.com/Nodearr/Nodearr/releases';
export type Asset = { name: string; browser_download_url: string; size: number };
export type Release = { tag_name: string; name: string; html_url: string; prerelease: boolean; draft: boolean; published_at: string; assets: Asset[] };

let latest: Promise<Release | undefined> | undefined;

export function getLatestRelease() {
  return latest ??= (async () => {
    try {
      const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
      if (import.meta.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${import.meta.env.GITHUB_TOKEN}`;
      const response = await fetch('https://api.github.com/repos/Nodearr/Nodearr/releases?per_page=10', { headers });
      if (response.ok) return ((await response.json()) as Release[]).find((release) => !release.draft);
    } catch {
      // Components show a release-list fallback when the lookup fails.
    }
    return undefined;
  })();
}

export const platforms = [
  {
    name: 'Windows',
    guide: '/guide/installing/#windows',
    packages: [
      { label: 'Installer, 64-bit', match: /win-x64-installer\.exe$/, primary: true },
      { label: 'Installer, 32-bit', match: /win-x86-installer\.exe$/, primary: false },
      { label: 'ZIP, 64-bit', match: /win-x64\.zip$/, primary: false },
      { label: 'ZIP, 32-bit', match: /win-x86\.zip$/, primary: false },
    ],
    note: 'The installer puts Nodearr in Program Files and starts it in the tray when you sign in, or as a service.',
  },
  {
    name: 'Linux',
    guide: '/guide/installing/#linux',
    packages: [
      { label: 'x64', match: /linux-x64\.tar\.gz$/, primary: true },
      { label: 'ARM64', match: /linux-arm64\.tar\.gz$/, primary: false },
      { label: 'ARM, 32-bit', match: /linux-arm\.tar\.gz$/, primary: false },
      { label: 'x64, musl (Alpine)', match: /linux-musl-x64\.tar\.gz$/, primary: false },
      { label: 'ARM64, musl (Alpine)', match: /linux-musl-arm64\.tar\.gz$/, primary: false },
    ],
    note: 'Unpack the archive, open its Nodearr folder, and follow the Linux steps in the installation guide.',
  },
  {
    name: 'macOS',
    guide: '/guide/installing/#macos',
    packages: [
      { label: 'Apple silicon', match: /osx-arm64\.tar\.gz$/, primary: true },
      { label: 'Intel', match: /osx-x64\.tar\.gz$/, primary: true },
    ],
    note: 'Unpack the archive, open its Nodearr folder, and follow the macOS steps in the installation guide.',
  },
];
