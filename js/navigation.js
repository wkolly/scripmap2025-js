/*======================================================================
 * FILE:    navigation.js
 * AUTHOR:  Stephen W. Liddle
 * DATE:    Winter 2025
 *
 * DESCRIPTION: Module for managing navigation based on hash values.
 */

/*----------------------------------------------------------------------
 *                      IMPORTS
 */
import { configureBreadcrumbs } from "./breadcrumbs.js";
import { navigateChapter } from "./chapter.js";
import {
    decodeEntities,
    decorateNode,
    domNode,
    hyperlinkNode,
    replaceNodeContent,
    TAG_DIV,
    TAG_HEADER5
} from "./html.js";
import { books, volumes, volumeIdIsValid } from "./mapScripApi.js";
import { navElement } from "./scriptures.js";

/*------------------------------------------------------------------
 *                      CONSTANTS
 */
const CLASS_BOOKS = "books";
const CLASS_BUTTON = "waves-effect waves-custom waves-ripple btn";
const CLASS_CHAPTER = "chapter";
const CLASS_VOLUME = "volume";
const ID_SCRIPTURES_NAVIGATION = "scripnav";

/*------------------------------------------------------------------
 *                      PRIVATE VARIABLES
 */

/*------------------------------------------------------------------
 *                      PRIVATE METHODS
 */
const bookChapterValid = function (bookId, chapter) {
    const book = books[bookId];

    if (book === undefined) {
        return false;
    }

    if (chapter === book.numChapters) {
        return true;
    }

    if (chapter >= 1 && chapter <= book.numChapters) {
        return Number.isInteger(chapter);
    }

    return false;
};

const buildBooksGrid = function (navigationNode, volume) {
    const gridContent = domNode(TAG_DIV, CLASS_BOOKS);

    volume.books.forEach((book) => {
        const hyperlink = hyperlinkNode(
            `#${volume.id}:${book.id}`,
            decodeEntities(book.fullName),
            CLASS_BUTTON,
            book.id
        );

        hyperlink.appendChild(document.createTextNode(decodeEntities(book.gridName)));
        gridContent.appendChild(hyperlink);
    });

    navigationNode.appendChild(gridContent);
};

const buildChaptersGrid = function (navigationNode, book) {
    const titleNode = domNode(TAG_HEADER5, null, null, book.fullName);
    const volumeNode = domNode(TAG_DIV, CLASS_VOLUME);
    const booksNode = domNode(TAG_DIV, CLASS_BOOKS);
    let chapter = 1;

    volumeNode.appendChild(titleNode);

    while (chapter <= book.numChapters) {
        const hyperlink = hyperlinkNode(`#0:${book.id}:${chapter}`);

        decorateNode(hyperlink, CLASS_BUTTON);
        hyperlink.classList.add(CLASS_CHAPTER);
        hyperlink.appendChild(document.createTextNode(chapter));

        booksNode.appendChild(hyperlink);
        chapter += 1;
    }

    navigationNode.appendChild(titleNode);
    navigationNode.appendChild(booksNode);
};

const buildVolumesGrid = function (navigationNode, volumeId) {
    volumes.forEach((volume) => {
        if (volumeId === undefined || volumeId === volume.id) {
            navigationNode.appendChild(volumeTitleNode(volume));
            buildBooksGrid(navigationNode, volume);
        }
    });
};

const hashParameters = function () {
    if (location.hash !== "" && location.hash.length > 1) {
        return location.hash.slice(1).split(":");
    }

    return [];
};

const navigateBook = function (bookId) {
    const book = books[bookId];

    if (book.numChapters <= 1) {
        navigateChapter(bookId, book.numChapters);
    } else {
        const chaptersNavigationNode = domNode(TAG_DIV, null, ID_SCRIPTURES_NAVIGATION);

        buildChaptersGrid(chaptersNavigationNode, book);
        replaceNodeContent(navElement, chaptersNavigationNode);
        configureBreadcrumbs(book.parentBookId, bookId);
    }
};

const navigateHome = function (volumeId) {
    const scripturesNavigationNode = domNode(TAG_DIV, null, ID_SCRIPTURES_NAVIGATION);

    buildVolumesGrid(scripturesNavigationNode, volumeId);
    replaceNodeContent(navElement, scripturesNavigationNode);

    configureBreadcrumbs(volumeId);
};

const volumeTitleNode = function (volume) {
    const titleNode = domNode(TAG_DIV, CLASS_VOLUME);
    const hyperlink = hyperlinkNode(`#${volume.id}`, volume.fullName);
    const headerNode = domNode(TAG_HEADER5, null, null, volume.fullName);

    hyperlink.appendChild(headerNode);
    titleNode.appendChild(hyperlink);

    return titleNode;
};

/*------------------------------------------------------------------
 *                      PUBLIC METHODS
 */
export const onHashChanged = function () {
    let [volumeId, bookId, chapter] = hashParameters();

    if (volumeId === undefined) {
        navigateHome();
    } else if (bookId === undefined) {
        volumeId = Number(volumeId);

        if (volumeIdIsValid(volumeId)) {
            navigateHome(volumeId);
        } else {
            navigateHome();
        }
    } else {
        bookId = Number(bookId);

        if (books[bookId] === undefined) {
            navigateHome();
        } else {
            if (chapter === undefined) {
                navigateBook(bookId);
            } else {
                chapter = Number(chapter);

                if (bookChapterValid(bookId, chapter)) {
                    navigateChapter(bookId, chapter);
                } else {
                    navigateHome();
                }
            }
        }
    }
};
