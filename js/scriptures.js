/*======================================================================
 * FILE:    scriptures.js
 * AUTHOR:  Stephen W. Liddle
 * DATE:    Winter 2025
 *
 * DESCRIPTION: Front-end JavaScript code for the Scriptures Mapped,
 *              IS 542, Winter 2025, BYU.
 */

const Scriptures = (function () {
    "use strict";

    /*------------------------------------------------------------------
     *                      CONSTANTS
     */
    const CLASS_BOOKS = "books";
    const CLASS_BUTTON = "waves-effect waves-custom waves-ripple btn";
    const CLASS_CHAPTER = "chapter";
    const CLASS_VOLUME = "volume";
    const HOME_BREADCRUMB = "The Scriptures";
    const ID_CRUMBS = "crumbs";
    const ID_CRUMBS_COMPLEMENT = "crumbs-complement";
    const ID_NAV_ELEMENT = "nav-root";
    const ID_SCRIPTURES_NAVIGATION = "scripnav";
    const SKIP_JSON_PARSE = true;
    const URL_BASE = "https://scriptures.byu.edu/mapscrip/";
    const URL_BOOKS = `${URL_BASE}model/books.php`;
    const URL_SCRIPTURES = `${URL_BASE}mapgetscrip2.php`;
    const URL_VOLUMES = `${URL_BASE}model/volumes.php`;
    const VIEW_ALTITUDE_DEFAULT = 5000;
    const VIEW_ALTITUDE_CONVERSION_RATIO = 591657550.5;
    const VIEW_ALTITUDE_ZOOM_ADJUST = -2;
    const ZOOM_RATIO = 450;

    /*------------------------------------------------------------------
     *                      PRIVATE VARIABLES
     */
    let books;
    let crumbsElement;
    let crumbsComplementElement;
    let navElement;
    let requestedBookId;
    let requestedChapter;
    let volumes;

    /*------------------------------------------------------------------
     *                      PRIVATE METHOD DECLARATIONS
     */
    let ajax;
    let bookChapterValid;
    let breadcrumbsNode;
    let buildBooksGrid;
    let buildChaptersGrid;
    let buildVolumesGrid;
    let cacheBooks;
    let configureBreadcrumbs;
    let encodedScripturesUrl;
    let getScripturesFailure;
    let getScripturesSuccess;
    let hashParameters;
    let navigateBook;
    let navigateChapter;
    let navigateHome;
    let navigateVolume;
    let volumeIdIsValid;
    let volumeTitleNode;
    let zoomLevelForAltitude;

    /*------------------------------------------------------------------
     *                      PUBLIC METHOD DECLARATIONS
     */
    let init;
    let onHashChanged;
    let panAndZoom;

    /*------------------------------------------------------------------
     *                      PRIVATE METHODS
     */
    ajax = async function (url, successCallback, failureCallback, skipJsonParse) {
        try {
            const response = await fetch(url);
            let data;

            if (!response.ok) {
                throw new Error(`HTTP error, status: ${response.status}`);
            }

            if (skipJsonParse) {
                data = await response.text();
            } else {
                data = await response.json();
            }

            if (typeof successCallback === "function") {
                successCallback(data);
            }
        } catch (error) {
            if (typeof failureCallback === "function") {
                failureCallback(request);
            }
        }
    };

    bookChapterValid = function (bookId, chapter) {
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

    breadcrumbsNode = function (textContent, href) {
        const listItem = Html.domNode(Html.TAG_LIST_ITEM);
        const textNode = document.createTextNode(textContent);

        if (href === undefined) {
            listItem.appendChild(textNode);
        } else {
            const hyperlink = Html.hyperlinkNode(href);

            hyperlink.appendChild(textNode);
            listItem.appendChild(hyperlink);
        }

        return listItem;
    };

    buildBooksGrid = function (navigationNode, volume) {
        const gridContent = Html.domNode(Html.TAG_DIV, CLASS_BOOKS);

        volume.books.forEach((book) => {
            const hyperlink = Html.hyperlinkNode(
                `#${volume.id}:${book.id}`,
                Html.decodeEntities(book.fullName),
                CLASS_BUTTON,
                book.id
            );

            hyperlink.appendChild(document.createTextNode(Html.decodeEntities(book.gridName)));
            gridContent.appendChild(hyperlink);
        });

        navigationNode.appendChild(gridContent);
    };

    buildChaptersGrid = function (navigationNode, book) {
        const titleNode = Html.domNode(Html.TAG_HEADER5, null, null, book.fullName);
        const volumeNode = Html.domNode(Html.TAG_DIV, CLASS_VOLUME);
        const booksNode = Html.domNode(Html.TAG_DIV, CLASS_BOOKS);
        let chapter = 1;

        volumeNode.appendChild(titleNode);

        while (chapter <= book.numChapters) {
            const hyperlink = Html.hyperlinkNode(`#0:${book.id}:${chapter}`);

            Html.decorateNode(hyperlink, CLASS_BUTTON);
            hyperlink.classList.add(CLASS_CHAPTER);
            hyperlink.appendChild(document.createTextNode(chapter));

            booksNode.appendChild(hyperlink);
            chapter += 1;
        }

        navigationNode.appendChild(titleNode);
        navigationNode.appendChild(booksNode);
    };

    buildVolumesGrid = function (navigationNode, volumeId) {
        volumes.forEach((volume) => {
            if (volumeId === undefined || volumeId === volume.id) {
                navigationNode.appendChild(volumeTitleNode(volume));
                buildBooksGrid(navigationNode, volume);
            }
        });
    };

    cacheBooks = function (callback) {
        // We have both volumes and books from the server, so here we
        // build an array of books for each volume so it's easy to get
        // the books when we have a volume object.  This is helpful,
        // for example, when building the navigation grid of books for
        // a given volume.

        volumes.forEach(function (volume) {
            let volumeBooks = [];
            let bookId = volume.minBookId;

            while (bookId <= volume.maxBookId) {
                volumeBooks.push(books[bookId]);
                bookId += 1;
            }

            volume.books = volumeBooks;
        });

        Object.freeze(books);
        Object.freeze(volumes);

        if (typeof callback === "function") {
            callback();
        }
    };

    configureBreadcrumbs = function (volumeId, bookId, chapter) {
        const crumbs = Html.domNode(Html.TAG_UNORDERED_LIST);

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

        Html.replaceNodeContent(crumbsElement, crumbs);
        Html.replaceNodeContent(crumbsComplementElement, crumbs.cloneNode(true));
    };

    encodedScripturesUrl = function (bookId, chapter, verses, isJst) {
        if (bookId !== undefined && chapter !== undefined) {
            let options = "";

            if (verses !== undefined) {
                options += verses;
            }

            if (isJst !== undefined) {
                options += "&jst=JST";
            }

            return `${URL_SCRIPTURES}?book=${bookId}&chap=${chapter}&verses${options}`;
        }
    };

    getScripturesFailure = function () {
        Html.replaceNodeContent(
            navElement,
            document.createTextNode("Unable to retrieve chapter contents.")
        );
    };

    getScripturesSuccess = function (chapterHtml) {
        navElement.innerHTML = chapterHtml;
        configureBreadcrumbs(0, requestedBookId, requestedChapter);
        // NEEDSWORK: update pins on the map
    };

    hashParameters = function () {
        if (location.hash !== "" && location.hash.length > 1) {
            return location.hash.slice(1).split(":");
        }

        return [];
    };

    navigateBook = function (bookId) {
        const book = books[bookId];

        if (book.numChapters <= 1) {
            navigateChapter(bookId, book.numChapters);
        } else {
            const chaptersNavigationNode = Html.domNode(
                Html.TAG_DIV,
                null,
                ID_SCRIPTURES_NAVIGATION
            );

            buildChaptersGrid(chaptersNavigationNode, book);
            Html.replaceNodeContent(navElement, chaptersNavigationNode);
            configureBreadcrumbs(book.parentBookId, bookId);
        }
    };

    navigateChapter = function (bookId, chapter) {
        requestedBookId = bookId;
        requestedChapter = chapter;

        ajax(
            encodedScripturesUrl(bookId, chapter),
            getScripturesSuccess,
            getScripturesFailure,
            SKIP_JSON_PARSE
        );
    };

    navigateHome = function (volumeId) {
        const scripturesNavigationNode = Html.domNode(Html.TAG_DIV, null, ID_SCRIPTURES_NAVIGATION);

        buildVolumesGrid(scripturesNavigationNode, volumeId);
        Html.replaceNodeContent(navElement, scripturesNavigationNode);

        configureBreadcrumbs(volumeId);
    };

    volumeIdIsValid = function (volumeId) {
        return volumes.map((volume) => volume.id).includes(volumeId);
    };

    volumeTitleNode = function (volume) {
        const titleNode = Html.domNode(Html.TAG_DIV, CLASS_VOLUME);
        const hyperlink = Html.hyperlinkNode(`#${volume.id}`, volume.fullName);
        const headerNode = Html.domNode(Html.TAG_HEADER5, null, null, volume.fullName);

        hyperlink.appendChild(headerNode);
        titleNode.appendChild(hyperlink);

        return titleNode;
    };

    zoomLevelForAltitude = function (viewAltitude) {
        let zoomLevel = viewAltitude / ZOOM_RATIO;

        if (viewAltitude !== VIEW_ALTITUDE_DEFAULT) {
            zoomLevel =
                Math.log2(VIEW_ALTITUDE_CONVERSION_RATIO / viewAltitude) +
                VIEW_ALTITUDE_ZOOM_ADJUST;
        }

        return zoomLevel;
    };

    /*------------------------------------------------------------------
     *                      PUBLIC METHODS
     */
    init = function (callback) {
        let booksIsLoaded = false;
        let volumesIsLoaded = false;

        ajax(URL_BOOKS, (json) => {
            books = json;
            booksIsLoaded = true;

            if (volumesIsLoaded) {
                cacheBooks(callback);
            }
        });

        ajax(URL_VOLUMES, (json) => {
            volumes = json;
            volumesIsLoaded = true;

            if (booksIsLoaded) {
                cacheBooks(callback);
            }
        });

        // look up all the DOM elements we want to manipulate
        crumbsElement = document.getElementById(ID_CRUMBS);
        crumbsComplementElement = document.getElementById(ID_CRUMBS_COMPLEMENT);
        navElement = document.getElementById(ID_NAV_ELEMENT);
    };

    onHashChanged = function () {
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

    panAndZoom = function (lat, lng, viewAltitude) {
        map.panTo({ lat, lng });
        map.setZoom(zoomLevelForAltitude(viewAltitude));
    };

    return {
        init,
        onHashChanged,
        panAndZoom
    };
})();

Object.freeze(Scriptures);
