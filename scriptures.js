/*======================================================================
 * FILE:    scriptures.js
 * AUTHOR:  Stephen W. Liddle
 * DATE:    Winter 2025
 *
 * DESCRIPTION: Front-end JavaScript code for the Scriptures Mapped,
 *              IS 542, Winter 2025, BYU.
 */

const Scriptures = (function () {
    // NEEDSWORK: How can we ensure that we're in strict mode?

    /*------------------------------------------------------------------
     *                      CONSTANTS
     */
    const ID_NAV_ELEMENT = "scrip-nav";
    const REQUEST_GET = "GET";
    const REQUEST_STATUS_ERROR = 400;
    const REQUEST_STATUS_OK = 200;
    const URL_BASE = "https://scriptures.byu.edu/mapscrip/";
    const URL_BOOKS = `${URL_BASE}model/books.php`;
    const URL_VOLUMES = `${URL_BASE}model/volumes.php`;

    /*------------------------------------------------------------------
     *                      PRIVATE VARIABLES
     */
    // NEEDSWORK

    /*------------------------------------------------------------------
     *                      PRIVATE METHOD DECLARATIONS
     */
    // NEEDSWORK

    /*------------------------------------------------------------------
     *                      PUBLIC METHOD DECLARATIONS
     */
    // NEEDSWORK

    /*------------------------------------------------------------------
     *                      PRIVATE METHODS
     */
    function getJSONRequest(url, successCallback) {
        const request = new XMLHttpRequest();

        function handleAjaxError() {
            console.log("There was an AJAX problem.");
        }

        function handleAjaxResponse() {
            if (request.status >= REQUEST_STATUS_OK && request.status < REQUEST_STATUS_ERROR) {
                const data = JSON.parse(request.response);

                successCallback(data);
            } else {
                handleAjaxError();
            }
        }

        request.open(REQUEST_GET, url, true);
        request.onload = handleAjaxResponse;
        request.onerror = handleAjaxError;
        request.send();
    }

    /*------------------------------------------------------------------
     *                      PUBLIC METHODS
     */
    function init() {
        let books;
        let volumes;
        let booksIsLoaded = false;
        let volumesIsLoaded = false;

        function displayVolumes() {
            const scripNav = document.getElementById(ID_NAV_ELEMENT);

            volumes.forEach((volume) => {
                const element = document.createElement("li");

                element.textContent = volume.fullName;
                scripNav.append(element);
            });

            Object.keys(books).forEach((bookKey) => {
                const element = document.createElement("li");

                element.textContent = books[bookKey].fullName;
                scripNav.append(element);
            });
        }

        getJSONRequest(URL_BOOKS, (json) => {
            books = json;
            booksIsLoaded = true;

            if (volumesIsLoaded) {
                displayVolumes();
            }
        });
        getJSONRequest(URL_VOLUMES, (json) => {
            volumes = json;
            volumesIsLoaded = true;

            if (booksIsLoaded) {
                displayVolumes();
            }
        });
    }

    return {
        init
    };
})();

// NEEDSWORK: How can we prevent callers from changing the object that we're returning?
