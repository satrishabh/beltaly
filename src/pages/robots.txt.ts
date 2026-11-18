export function GET({site}: {site:URL}){return new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL(`${import.meta.env.BASE_URL}sitemap-index.xml`,site)}\n`);}
