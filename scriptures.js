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
    const ID_NAV_ELEMENT = "scrip-nav";
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
    let cacheBooks;
    let getJSONRequest;
    let hashParameters;
    let navigateBook;
    let navigateHome;
    let navigateVolume;
    let volumeIdIsValid;

    /*------------------------------------------------------------------
     *                      PUBLIC METHOD DECLARATIONS
     */
    let init;
    let onHashChanged;

    /*------------------------------------------------------------------
     *                      PRIVATE METHODS
     */
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

    navigateHome = function () {
        let navElement = document.getElementById("scrip-nav");

        // build grid of volumes and their books
        // replace the content of navElement with the new grid
        // configure the breadcrumbs to match

        navElement.innerHTML = "<p>Home view</p>";
    };

    navigateVolume = function (volumeId) {
        let navElement = document.getElementById("scrip-nav");

        // build grid of volumes and their books
        // replace the content of navElement with the new grid
        // configure the breadcrumbs to match

        navElement.innerHTML = `<p>Volume ${volumeId} view</p>`;
    };

    volumeIdIsValid = function (volumeId) {
        return volumes.map((volume) => volume.id).includes(volumeId);
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
                navigateVolume(volumeId);
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
