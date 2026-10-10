import { isOwnedByToolbar } from '../../core/dom/domScope.js';

export function cleanAlt(value) {
  if (typeof value !== 'string') throw new Error('Enter a description before applying it.');
  const text = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text || text.length > 500) throw new Error('Use a concise description of 1 to 500 characters.');
  if (/^(an? )?(image|picture|photo) of (an? )?(image|picture|photo)\.?$/i.test(text)) {
    throw new Error('Describe the image’s purpose or visible content rather than saying “image of a picture.”');
  }
  return text;
}

export function snapshotImage(image) {
  if (!image || image.tagName?.toLowerCase() !== 'img' || !image.isConnected || isOwnedByToolbar(image)) {
    throw new Error('This host-page image is no longer available. Scan again.');
  }
  return {
    image,
    src: image.getAttribute('src'),
    srcset: image.getAttribute('srcset'),
    sizes: image.getAttribute('sizes'),
    currentSrc: image.currentSrc || '',
    hasAlt: image.hasAttribute('alt'),
    alt: image.getAttribute('alt'),
  };
}

function sameImage(snapshot) {
  const { image } = snapshot;
  return image.isConnected && image.ownerDocument === document && !isOwnedByToolbar(image) &&
    image.getAttribute('src') === snapshot.src &&
    image.getAttribute('srcset') === snapshot.srcset &&
    image.getAttribute('sizes') === snapshot.sizes &&
    (!snapshot.currentSrc || !image.currentSrc || image.currentSrc === snapshot.currentSrc);
}

export function applyImageAlt(snapshot, value, { decorative = false, allowReplace = false } = {}) {
  if (!snapshot || !sameImage(snapshot)) throw new Error('The image changed or was removed. Scan it again before applying alt text.');
  const image = snapshot.image;
  if (image.hasAttribute('alt') !== snapshot.hasAlt || image.getAttribute('alt') !== snapshot.alt) {
    throw new Error('The page changed this image’s alt text. Scan again to avoid overwriting it.');
  }
  if (snapshot.hasAlt && snapshot.alt?.trim() && !allowReplace) {
    throw new Error('Existing alt text is preserved. Explicitly choose to replace it first.');
  }
  const next = decorative ? '' : cleanAlt(value);
  image.setAttribute('alt', next);
  if (image.getAttribute('alt') !== next) throw new Error('The page did not accept the alt text.');
  return { image, before: snapshot, applied: next, status: 'applied' };
}

export function undoImageAlt(edit) {
  if (!edit?.image?.isConnected) throw new Error('The edited image is no longer on the page.');
  if (!sameImage(edit.before)) throw new Error('The image source changed after the edit; undo would affect a different image.');
  if (edit.image.getAttribute('alt') !== edit.applied) {
    throw new Error('The page changed this alt text after it was applied; undo would overwrite that change.');
  }
  if (edit.before.hasAlt) edit.image.setAttribute('alt', edit.before.alt || '');
  else edit.image.removeAttribute('alt');
  if (edit.image.hasAttribute('alt') !== edit.before.hasAlt ||
      edit.image.getAttribute('alt') !== edit.before.alt) {
    throw new Error('The original alt attribute could not be restored.');
  }
  return true;
}
