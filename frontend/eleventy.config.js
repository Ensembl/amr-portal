import { HtmlBasePlugin } from '@11ty/eleventy';
import EleventyVitePlugin from '@11ty/eleventy-plugin-vite';

export default async function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy('src/assets');

  // Copy fonts distributed via npm
  eleventyConfig.addPassthroughCopy({
    'node_modules/@ensembl/ensembl-elements-common/fonts': 'assets/fonts',
  });



  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPlugin(EleventyVitePlugin, {
    // viteOptions: {
    //   base: '/amr',
    // }
  });
};


export const config = {
  dir: {
    input: 'src'
  },
  templateFormats: ['html', 'njk', 'md', '11ty.js'],
  markdownTemplateEngine: 'njk',
	htmlTemplateEngine: 'njk',
  pathPrefix: '/amr/'
};










/**

JUNK

  // eleventyConfig.setServerOptions({
	// 	onRequest: {
	// 		'/api/*': function(req) {
  //       console.log('GOT HERE!', 'HEADERS?', req.prototype);
  //       const serverBaseUrl = 'http://localhost:8000';
  //       const pathname = req.url.pathname.replace('/api', '');

  //       const serverUrl = new URL(pathname, serverBaseUrl);

  //       const fetchOptions = {
  //         method: req.method,
  //         headers: req.headers
  //       };

  //       if (req.method && !['GET', 'HEAD'].includes(req.method)) {
  //         console.log('I AM HERE', 'REQ METHOD:', req);
  //         fetchOptions.body = req;
  //       }

	// 			return fetch(serverUrl, fetchOptions);
	// 		}
	// 	}
	// });

  // eleventyConfig.on('eleventy.after', async (params) => {
  //   console.log('params', params);
  // })

 */