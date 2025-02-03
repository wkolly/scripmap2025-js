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
    let getJSONRequest;

    /*------------------------------------------------------------------
     *                      PUBLIC METHOD DECLARATIONS
     */
    let init;

    /*------------------------------------------------------------------
     *                      PRIVATE METHODS
     */
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
    };

    return {
        init
    };
})();

Object.freeze(Scriptures);
