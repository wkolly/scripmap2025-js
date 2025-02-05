/*======================================================================
 * FILE:    scriptures.js
 * AUTHOR:  Stephen W. Liddle
 * DATE:    Winter 2025
 *
 * DESCRIPTION: Front-end JavaScript code for the Scriptures Mapped,
 *              IS 542, Winter 2025, BYU.
 */

const Html = (function () {
    ("use strict");

    /*------------------------------------------------------------------
     *                      PUBLIC CONSTANTS
     */
    const TAG_DIV = "div";
    const TAG_HEADER5 = "h5";
    const TAG_HYPERLINK = "a";
    const TAG_I = "i";
    const TAG_LIST_ITEM = "li";
    const TAG_UNORDERED_LIST = "ul";

    /*------------------------------------------------------------------
     *                      PUBLIC METHOD DECLARATIONS
     */
    let decodeEntities;
    let decorateNode;
    let domNode;
    let hyperlinkNode;
    let replaceNodeContent;

    /*------------------------------------------------------------------
     *                      PUBLIC METHODS
     */
    decodeEntities = function (text) {
        // Replace all &mdash; entities with the actual mdash character.
        // If we have content in the future with other HTML entities, we
        // would need to update this method.  If this gets a bit bigger,
        // I would build a dictionary with the key/value pairs desired
        // and then iterate over it, e.g. {"&mdash;": "—", "&amp;": "&"}

        return text.replace("&mdash;", "—");
    };

    decorateNode = function (node, clazz, id) {
        // Add class and/or id attributes as requested

        if (clazz) {
            for (const word of clazz.split(" ")) {
                node.classList.add(word);
            }
        }

        if (id) {
            node.id = id;
        }
    };

    domNode = function (tag, clazz, id, textContent) {
        // Build a DOM node for the given tag type.
        // Note that because "class" is a reserved word, it's conventional
        // to use the word "clazz" as an identifier in C-like languages.

        const node = document.createElement(tag);

        decorateNode(node, clazz, id);

        if (textContent) {
            node.appendChild(document.createTextNode(textContent));
        }

        return node;
    };

    hyperlinkNode = function (href, title, clazz, id) {
        // Build a hyperlink node with the given attributes

        const hyperlink = document.createElement(TAG_HYPERLINK);

        if (href) {
            hyperlink.href = href;
        }

        if (title) {
            hyperlink.title = title;
        }

        decorateNode(hyperlink, clazz, id);

        return hyperlink;
    };

    replaceNodeContent = function (node, newChild) {
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }

        node.appendChild(newChild);
    };

    return {
        decodeEntities,
        decorateNode,
        domNode,
        hyperlinkNode,
        replaceNodeContent,
        TAG_DIV,
        TAG_HEADER5,
        TAG_HYPERLINK,
        TAG_I,
        TAG_LIST_ITEM,
        TAG_UNORDERED_LIST
    };
})();

const Scriptures = (function () {
    "use strict";

    /*------------------------------------------------------------------
     *                      CONSTANTS
     */
    const CLASS_BOOKS = "books";
    const CLASS_BUTTON = "waves-effect waves-custom waves-ripple btn";
    const CLASS_VOLUME = "volume";
    const ID_NAV_ELEMENT = "scrip-nav";
    const ID_SCRIPTURES_NAVIGATION = "scripnav";
    const URL_BASE = "https://scriptures.byu.edu/mapscrip/";
    const URL_BOOKS = `${URL_BASE}model/books.php`;
    const URL_VOLUMES = `${URL_BASE}model/volumes.php`;

    /*------------------------------------------------------------------
     *                      PRIVATE VARIABLES
     */
    let books;
    let volumes;

    /*------------------------------------------------------------------
     *                      PRIVATE METHOD DECLARATIONS
     */
    let bookChapterValid;
    let buildBooksGrid;
    let buildVolumesGrid;
    let cacheBooks;
    let getJSONRequest;
    let hashParameters;
    let navigateBook;
    let navigateChapter;
    let navigateHome;
    let navigateVolume;
    let volumeIdIsValid;
    let volumeTitleNode;

    /*------------------------------------------------------------------
     *                      PUBLIC METHOD DECLARATIONS
     */
    let init;
    let onHashChanged;

    /*------------------------------------------------------------------
     *                      PRIVATE METHODS
     */
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

    getJSONRequest = async function (url, successCallback) {
        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            successCallback(data);
        } catch (error) {
            console.error(`There was an AJAX problem: ${error}.`);
        }
    };

    hashParameters = function () {
        if (location.hash !== "" && location.hash.length > 1) {
            return location.hash.slice(1).split(":");
        }

        return [];
    };

    navigateBook = function (bookId) {
        let navElement = document.getElementById("scrip-nav");

        // build grid of volumes and their books
        // replace the content of navElement with the new grid
        // configure the breadcrumbs to match

        navElement.innerHTML = `<p>Book ${bookId} view</p>`;
    };

    navigateChapter = function (bookId, chapter) {
        let navElement = document.getElementById("scrip-nav");

        // build grid of volumes and their books
        // replace the content of navElement with the new grid
        // configure the breadcrumbs to match

        navElement.innerHTML = `<p>Chapter ${chapter} of book ${bookId} view</p>`;
    };

    navigateHome = function (volumeId) {
        let navElement = document.getElementById("scrip-nav");

        const scripturesNavigationNode = Html.domNode(Html.TAG_DIV, null, ID_SCRIPTURES_NAVIGATION);

        buildVolumesGrid(scripturesNavigationNode, volumeId);
        Html.replaceNodeContent(navElement, scripturesNavigationNode);

        // configure the breadcrumbs to match
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

    /*------------------------------------------------------------------
     *                      PUBLIC METHODS
     */
    init = function () {
        let booksIsLoaded = false;
        let volumesIsLoaded = false;

        function displayVolumes() {
            const scripNav = document.getElementById(ID_NAV_ELEMENT);

            volumes.forEach((volume) => {
                const element = document.createElement("li");

                element.textContent = volume.fullName;
                scripNav.appendChild(element);

                volume.books.forEach((book) => {
                    const element = document.createElement("li");

                    element.textContent = book.fullName;
                    scripNav.appendChild(element);
                });
            });
        }

        getJSONRequest(URL_BOOKS, (json) => {
            books = json;
            booksIsLoaded = true;

            if (volumesIsLoaded) {
                cacheBooks(displayVolumes);
            }
        });
        getJSONRequest(URL_VOLUMES, (json) => {
            volumes = json;
            volumesIsLoaded = true;

            if (booksIsLoaded) {
                cacheBooks(displayVolumes);
            }
        });
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

    return {
        init,
        onHashChanged
    };
})();

Object.freeze(Scriptures);
