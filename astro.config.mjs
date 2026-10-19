import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://nodearr.com',
  integrations: [
    starlight({
      title: 'Nodearr',
      description: "Get media from your friends' libraries, through the Arr apps you already run.",
      logo: { src: './src/assets/logo.svg' },
      favicon: '/favicon.svg',
      head: [{ tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } }],
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Nodearr/Nodearr' }],

      // The site's own pages are edited here. The guide's pages say where they come from, in the
      // Nodearr repository (scripts/sync-docs.mjs).
      editLink: { baseUrl: 'https://github.com/Nodearr/nodearr.github.io/edit/main/' },
      lastUpdated: false,
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        { label: 'Download', link: '/download/' },
        { label: 'User guide', items: [{ autogenerate: { directory: 'guide' } }] },
        { label: 'API', link: '/api/', attrs: { target: '_self' } },
        { label: 'Changelog', link: '/changelog/' },
      ],
    }),
  ],
});
