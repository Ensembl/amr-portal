import { HtmlBasePlugin } from '@11ty/eleventy';
import EleventyVitePlugin from '@11ty/eleventy-plugin-vite';

import { buildAssets } from './utils/build.js';
import { getAssetOutputPath } from './utils/eleventy-filters.js';

// https://www.aleksandrhovhannisyan.com/notes/cache-busting-assets-in-eleventy/
// https://github.com/AleksandrHovhannisyan/aleksandrhovhannisyan.com/blob/master/packages/web/.eleventy.js

// const pathPrefix = '/amr/';
const pathPrefix = undefined;
const outputRoot = 'dist';

export default async function(eleventyConfig) {
  // console.log('HERE', 'eleventyConfig.directories.input', eleventyConfig.directories.input)

  // Global data
  eleventyConfig.addGlobalData('assetsManifest', async () => {
    const assetsManifest = await buildAssets({
      pathPrefix,
      outputRoot
    });
    console.log(`[build:assets]: added assets manifest to global data`, assetsManifest);
    return assetsManifest;
  });

  // eleventyConfig.addPassthroughCopy('src/assets');
  eleventyConfig.addPassthroughCopy("src/assets/css");
  eleventyConfig.addPassthroughCopy("src/assets/images");
  // Copy fonts distributed via npm
  eleventyConfig.addPassthroughCopy({
    'node_modules/@ensembl/ensembl-elements-common/fonts': 'assets/fonts',
  });

  eleventyConfig.addFilter('getAssetOutputPath', getAssetOutputPath);

  // eleventyConfig.addPassthroughCopy({
  //   'src/assets': 'amr/assets'
  // });





  eleventyConfig.addPlugin(HtmlBasePlugin);
  // eleventyConfig.addPlugin(EleventyVitePlugin, {
    // viteOptions: {
    //   base: '/amr/',
    // }
  // });
};


export const config = {
  dir: {
    input: 'src',
    output: outputRoot
  },
  templateFormats: ['html', 'njk', 'md', '11ty.js'],
  markdownTemplateEngine: 'njk',
	htmlTemplateEngine: 'njk',
  pathPrefix
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