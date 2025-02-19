/*======================================================================
 * FILE:    breadcrumbs.js
 * AUTHOR:  Stephen W. Liddle
 * DATE:    Winter 2025
 *
 * DESCRIPTION: Module for managing breadcrumb navigation.
 */

/*----------------------------------------------------------------------
 *                      CONSTANTS
 */
import {
    domNode,
    hyperlinkNode,
    replaceNodeContent,
    TAG_LIST_ITEM,
    TAG_UNORDERED_LIST
} from "./html.js";
import { books, volumes } from "./mapScripApi.js";

/*----------------------------------------------------------------------
 *                      CONSTANTS
 */
const HOME_BREADCRUMB = "The Scriptures";
const ID_CRUMBS = "crumbs";
const ID_CRUMBS_COMPLEMENT = "crumbs-complement";

/*----------------------------------------------------------------------
 *                      PRIVATE VARIABLES
 */
let crumbsElement;
let crumbsComplementElement;

/*----------------------------------------------------------------------
 *                      PRIVATE FUNCTIONS
 */
const breadcrumbsNode = function (textContent, href) {
    const listItem = domNode(TAG_LIST_ITEM);
    const textNode = document.createTextNode(textContent);

    if (href === undefined) {
        listItem.appendChild(textNode);
    } else {
        const hyperlink = hyperlinkNode(href);

        hyperlink.appendChild(textNode);
        listItem.appendChild(hyperlink);
    }

    return listItem;
};

/*----------------------------------------------------------------------
 *                      PUBLIC FUNCTIONS
 */
export const configureBreadcrumbs = function (volumeId, bookId, chapter) {
    const crumbs = domNode(TAG_UNORDERED_LIST);

    if (volumeId === undefined) {
        crumbs.appendChild(breadcrumbsNode(HOME_BREADCRUMB));
    } else {
        crumbs.appendChild(breadcrumbsNode(HOME_BREADCRUMB, "#"));

        if (bookId === undefined) {
            crumbs.appendChild(breadcrumbsNode(volumes[volumeId - 1].backName));
        } else {
            const book = books[bookId];
            const volume = volumes[book.parentBookId - 1];

            crumbs.appendChild(breadcrumbsNode(volume.backName, `#${volume.id}`));

            if (chapter === undefined) {
                crumbs.appendChild(breadcrumbsNode(book.backName));
            } else {
                crumbs.appendChild(breadcrumbsNode(book.backName, `#${volume.id}:${bookId}`));

                if (book.numChapters > 0) {
                    crumbs.appendChild(breadcrumbsNode(chapter));
                }
            }
        }
    }

    // NEEDSWORK: figure out a better way to handle DOM tree interactions
    if (crumbsElement === undefined) {
        crumbsElement = document.getElementById(ID_CRUMBS);
        crumbsComplementElement = document.getElementById(ID_CRUMBS_COMPLEMENT);
    }

    replaceNodeContent(crumbsElement, crumbs);
    replaceNodeContent(crumbsComplementElement, crumbs.cloneNode(true));
};
