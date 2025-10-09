import { HtmlBasePlugin } from '@11ty/eleventy';

import { buildAssets } from './utils/build.js';
import { getAssetOutputPath } from './utils/eleventy-filters.js';

const pathPrefix = '/amr/';
// const pathPrefix = undefined;
const outputRoot = 'dist';

export default async function(eleventyConfig) {
  // Hook into Eleventy's data pipeline at an early stage of a build,
  // and build the static assets. Add the assets manifest to global data,
  // such that it can be used in templates to retrieve paths to built files.
  eleventyConfig.addGlobalData('assetsManifest', async () => {
    const assetsManifest = await buildAssets({
      pathPrefix,
      outputRoot
    });
    console.log(`[build:assets]: added assets manifest to global data`, assetsManifest);
    return assetsManifest;
  });

  eleventyConfig.addPassthroughCopy("src/assets/images");
  // Copy fonts distributed via npm
  eleventyConfig.addPassthroughCopy({
    'node_modules/@ensembl/ensembl-elements-common/fonts': 'assets/fonts',
  });

  eleventyConfig.addFilter('getAssetOutputPath', getAssetOutputPath);


  // TODO: ignore any markdown files inside of the assets directory

  eleventyConfig.addPlugin(HtmlBasePlugin);
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
