import EleventyVitePlugin from '@11ty/eleventy-plugin-vite';

export default async function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy('src/assets');

  // Copy fonts distributed via npm
  eleventyConfig.addPassthroughCopy({
    'node_modules/@ensembl/ensembl-elements-common/fonts': 'assets/fonts',
  });

  eleventyConfig.addPlugin(EleventyVitePlugin);

  // eleventyConfig.on('eleventy.after', async (params) => {
  //   console.log('params', params);
  // })
};


export const config = {
  dir: {
    input: 'src'
  },
  templateFormats: ['html', 'njk', 'md', '11ty.js'],
  markdownTemplateEngine: 'njk',
	htmlTemplateEngine: 'njk'
};
