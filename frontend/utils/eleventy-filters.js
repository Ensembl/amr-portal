import path from 'path';

/**
 * NOTE: eleventy filters should have a `this` that can be bound to different contexts,
 * because that is how they can get access to Eleventy data.
 * Therefore, they should not be arrow functions.
 */

export function getAssetOutputPath(inputPath) {
  if (inputPath.startsWith('http')) {
    return inputPath;
  }

  const { assetsManifest } = this.ctx;
  const assetOutputPath = assetsManifest[inputPath];

  let outputDir = this.ctx.eleventy.directories.output;
  outputDir = path.normalize(outputDir); // remove the leading './' in the output directory path


  const pathWithoutRootDir = path.relative(path.normalize(outputDir), path.normalize(assetOutputPath));


  // // Strip a trailing slash, if present, from the output directory
  // if (outputDir.endsWith(path.sep)) {
  //   outputDir = outputDir.slice(0, -1);
  // }
  

  // console.log('this eleventy', this.eleventy);
  // console.log('context', this.ctx);
  
  // FIXME
  // return assetsManifest[inputPath].replace(outputDir, '');


  console.log({
    inputPath,
    outputDir,
    pathWithoutRootDir
  });

  // prepend a leading slash
  return `/${pathWithoutRootDir}`;
}