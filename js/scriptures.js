/*======================================================================
 * FILE:    scriptures.js
 * AUTHOR:  Stephen W. Liddle
 * DATE:    Winter 2025
 *
 * DESCRIPTION: Front-end JavaScript code for the Scriptures Mapped,
 *              IS 542, Winter 2025, BYU.
 */

/*----------------------------------------------------------------------
 *                      IMPORTS
 */
import { mapInit, showLocation } from "./mapHelper.js";
import { apiInit } from "./mapScripApi.js";
import { onHashChanged } from "./navigation.js";

/*------------------------------------------------------------------
 *                      CONSTANTS
 */
const ID_NAV_ELEMENT = "nav-root";

/*------------------------------------------------------------------
 *                      PRIVATE VARIABLES
 */
export let navElement;

/*------------------------------------------------------------------
 *                      PUBLIC METHODS
 */
export const init = function (callback) {
    apiInit(callback);
    mapInit();

    // look up all the DOM elements we want to manipulate
    navElement = document.getElementById(ID_NAV_ELEMENT);
};

export { onHashChanged };

export const panAndZoom = function (lat, lng, viewAltitude) {
    showLocation(lat, lng, viewAltitude);
};
