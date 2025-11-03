import { JSDOM } from 'jsdom';

/**
 * REFERENCES:
 * - Example of html transform using jsdom: https://www.garrettbland.com/projects/eleventy-image-plugins
 * - Example of html transform using cheerio: https://www.martingunnarsson.com/posts/eleventy-customizing-external-links/
 */

export async function documentationTocTransform(content) {
  // TODO: decide how to pick pages on which to apply this transform

  if (this.page.inputPath.endsWith('.md')) {
    const dom = new JSDOM(content);
    const document = dom.window.document;
    const mainSection = document.querySelector('main');

    // get the target element 
    const tocContainer = mainSection?.querySelector('.table-of-contents .links');

    if (
      !mainSection ||
      !tocContainer
    ) {
      // abort mission
      return content;
    }

    // NOTE: would be nice to exclude the h1
    const headings = mainSection.querySelectorAll('h1, h2');
    const seenHeadingsMap = new Map();

    headings.forEach((heading) => {
      const tocElement = createTOCElement({ heading, document, seenHeadingsMap });
      tocContainer.appendChild(tocElement);
    });


    return dom.serialize();
  }

  return content; // no changes made.
};

const createTOCElement = ({
  document,
  heading,
  seenHeadingsMap
}) => {
  const headingText = heading.textContent;
  let headingId;

  if (seenHeadingsMap.get(headingText)) {
    const seenCount = seenHeadingsMap.get(headingText);
    const newCount = seenCount + 1;
    headingId = createHeadingId({ text: headingText, newCount });
    seenHeadingsMap.set(headingText, newCount);
  } else {
    headingId = createHeadingId({ text: headingText });
    seenHeadingsMap.set(headingText, 1);
  }
  heading.setAttribute('id', headingId);

  const tocElement = document.createElement('li');
  const innerHtml = `
    <a href="#${headingId}">${headingText}</a>
  `;
  tocElement.insertAdjacentHTML('beforeend', innerHtml);
  return tocElement;
}

const createHeadingId = ({ text, count }) => {
  let id = text.replaceAll(' ', '-');
  if (count) {
    id = `${id}-${count}`;
  }
  return id;
}