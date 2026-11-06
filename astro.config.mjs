import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://nodearr.com',
  // Short addresses that Nodearr itself links to. What the project receives from a node is written
  // in the user guide, in the Nodearr repository, so it changes in the same pull request as the
  // code that sends it (ADR 0024).
  redirects: {
    '/privacy': '/guide/privacy-and-security/#what-anyone-else-sees',
  },
  integrations: [
    starlight({
      title: 'Nodearr',
      description: "Get media from your friends' libraries, through the Arr apps you already run.",
      logo: { src: './src/assets/logo.svg' },
      components: { SiteTitle: './src/components/SiteTitle.astro' },
      favicon: '/favicon.svg',
      head: [{ tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } }],
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Nodearr/Nodearr' }],

      // The site's own pages are edited here. The guide's pages say where they come from, in the
      // Nodearr repository (scripts/sync-docs.mjs).
      editLink: { baseUrl: 'https://github.com/Nodearr/nodearr.github.io/edit/main/' },
      lastUpdated: false,
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        { label: 'Start here', items: [
          { label: 'Getting started', link: '/getting-started/' },
          { label: 'Installing', link: '/guide/installing/' },
          { label: 'Connecting your apps', link: '/guide/connecting-apps/' },
        ] },
        { label: 'Using Nodearr', items: [
          { label: 'Friends and sharing', link: '/guide/friends-and-sharing/' },
          { label: 'Finding and fetching', link: '/guide/finding-and-fetching/' },
        ] },
        { label: 'Reference', items: [
          { label: 'Troubleshooting', link: '/guide/troubleshooting/' },
          { label: 'Settings', link: '/guide/settings/' },
          { label: 'Backups', link: '/guide/backups/' },
          { label: 'Updating', link: '/guide/updating/' },
          { label: 'Privacy and security', link: '/guide/privacy-and-security/' },
          { label: 'Guide overview', link: '/guide/' },
          { label: 'API', link: '/api/', attrs: { target: '_self' } },
        ] },
        { label: 'Releases', items: [
          { label: 'Packages and downloads', link: '/download/' },
          { label: 'Changelog', link: '/changelog/' },
        ] },
      ],
    }),
  ],
});
