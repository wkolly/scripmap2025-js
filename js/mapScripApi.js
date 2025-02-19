/*======================================================================
 * FILE:    mapScripApi.js
 * AUTHOR:  Stephen W. Liddle
 * DATE:    Winter 2025
 *
 * DESCRIPTION: Module for managing interactions with scriptures.byu.edu.
 */

/*----------------------------------------------------------------------
 *                      CONSTANTS
 */
const URL_BASE = "https://scriptures.byu.edu/mapscrip/";
const URL_BOOKS = `${URL_BASE}model/books.php`;
const URL_SCRIPTURES = `${URL_BASE}mapgetscrip2.php`;
const URL_VOLUMES = `${URL_BASE}model/volumes.php`;

/*----------------------------------------------------------------------
 *                      PUBLIC VARIABLES
 */
export let books;
export let volumes;

/*----------------------------------------------------------------------
 *                      PRIVATE FUNCTIONS
 */
const cacheBooks = function (callback) {
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

const encodedScripturesUrl = function (bookId, chapter, verses, isJst) {
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

/*----------------------------------------------------------------------
 *                      PUBLIC FUNCTIONS
 */
export const apiInit = function (callback) {
    Promise.all(
        [URL_VOLUMES, URL_BOOKS].map((url) => fetch(url).then((response) => response.json()))
    ).then(([jsonVolumes, jsonBooks]) => {
        if (jsonVolumes !== undefined && jsonBooks !== undefined) {
            volumes = jsonVolumes;
            books = jsonBooks;

            cacheBooks(callback);
        }
    });
};

export const requestChapterText = function (bookId, chapter, success, failure) {
    fetch(encodedScripturesUrl(bookId, chapter))
        .then((response) => {
            const html = response.text();

            success(html);
        })
        .catch(failure);
};

export const volumeIdIsValid = function (volumeId) {
    return volumes.map((volume) => volume.id).includes(volumeId);
};
