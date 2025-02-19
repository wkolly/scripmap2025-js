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
import { configureBreadcrumbs } from "./breadcrumbs.js";
import {
    decodeEntities,
    decorateNode,
    domNode,
    hyperlinkNode,
    replaceNodeContent,
    TAG_DIV,
    TAG_HEADER5,
    TAG_I
} from "./html.js";
import { books, volumes, apiInit, requestChapterText, volumeIdIsValid } from "./mapScripApi.js";

/*------------------------------------------------------------------
 *                      CONSTANTS
 */
const CLASS_BOOKS = "books";
const CLASS_BUTTON = "waves-effect waves-custom waves-ripple btn";
const CLASS_CHAPTER = "chapter";
const CLASS_GEOPLACE_MARKER = "geoplace-marker";
const CLASS_ICON = "material-icons";
const CLASS_LABEL = "label";
const CLASS_NAV_HEADING = "navheading";
const CLASS_NEXT_PREV = "nextprev";
const CLASS_PIN = "pin";
const CLASS_VOLUME = "volume";
const ICON_NEXT = "skip_next";
const ICON_PREVIOUS = "skip_previous";
const ID_NAV_ELEMENT = "nav-root";
const ID_SCRIPTURES_NAVIGATION = "scripnav";
const LAT_LON_PARSER = /\((.*),'(.*)',(.*),(.*),(.*),'(.*)'\)/;
const VIEW_ALTITUDE_DEFAULT = 5000;
const VIEW_ALTITUDE_CONVERSION_RATIO = 591657550.5;
const VIEW_ALTITUDE_ZOOM_ADJUST = -2;
const ZOOM_RATIO = 450;

/*------------------------------------------------------------------
 *                      PRIVATE VARIABLES
 */
let mapMarkers = [];
let navElement;
let requestedBookId;
let requestedChapter;

/*------------------------------------------------------------------
 *                      PRIVATE METHOD DECLARATIONS
 */
let bookChapterValid;
let boundsForCurrentMarkers;
let buildBooksGrid;
let buildChaptersGrid;
let buildVolumesGrid;
let chapterNavigationNode;
let clearMapMarkers;
let createMapMarkers;
let extractGeoplaces;
let firstAltitude;
let getScripturesFailure;
let getScripturesSuccess;
let hashParameters;
let injectNextPrevious;
let mergePlacename;
let navigateBook;
let navigateChapter;
let navigateHome;
let nextChapter;
let nextPreviousNode;
let placenameWithFlag;
let previousChapter;
let titleForBookChapter;
let updateMarkers;
let volumeTitleNode;
let zoomLevelForAltitude;
let zoomMapToFitMarkers;
let zoomToFitMarkerBounds;
let zoomToOneMarker;

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

boundsForCurrentMarkers = function () {
    const bounds = new google.maps.LatLngBounds();

    mapMarkers.forEach((marker) => {
        bounds.extend(marker.position);
    });

    return bounds;
};

buildBooksGrid = function (navigationNode, volume) {
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

buildChaptersGrid = function (navigationNode, book) {
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

buildVolumesGrid = function (navigationNode, volumeId) {
    volumes.forEach((volume) => {
        if (volumeId === undefined || volumeId === volume.id) {
            navigationNode.appendChild(volumeTitleNode(volume));
            buildBooksGrid(navigationNode, volume);
        }
    });
};

chapterNavigationNode = function (parameters, icon) {
    // Build a node for next/previous chapter navigation

    const [bookId, chapter, title] = parameters;
    const node = hyperlinkNode(`#0:${bookId}:${chapter}`, title);

    node.appendChild(domNode(TAG_I, CLASS_ICON, null, icon));

    return node;
};

clearMapMarkers = function () {
    mapMarkers.forEach((marker) => {
        marker.setMap(null);
    });

    mapMarkers = [];
};

createMapMarkers = function (geoplaces) {
    Object.values(geoplaces).forEach((geoplace) => {
        const markerContent = domNode(TAG_DIV, CLASS_GEOPLACE_MARKER);

        markerContent.appendChild(domNode(TAG_DIV, CLASS_PIN));
        markerContent.appendChild(domNode(TAG_DIV, CLASS_LABEL, null, geoplace.placename));

        const marker = new google.maps.marker.AdvancedMarkerElement({
            map: map,
            position: { lat: geoplace.latitude, lng: geoplace.longitude },
            title: geoplace.placename,
            content: markerContent
        });

        mapMarkers.push(marker);
    });
};

extractGeoplaces = function () {
    const uniqueGeoplaces = {};
    const placeLinks = document.querySelectorAll("a[onclick^='showLocation('");

    placeLinks.forEach((placeLink) => {
        const matches = LAT_LON_PARSER.exec(placeLink.getAttribute("onclick"));

        if (matches) {
            const [_, __, name, latitude, longitude, viewAltitude, flag] = matches;

            let placename = placenameWithFlag(name, flag);

            const key = `${latitude}|${longitude}`;
            const value = {
                latitude: Number(latitude),
                longitude: Number(longitude),
                placename,
                viewAltitude: Number(viewAltitude)
            };

            if (uniqueGeoplaces[key] !== undefined) {
                mergePlacename(uniqueGeoplaces[key], name);
            } else {
                uniqueGeoplaces[key] = value;
            }
        }
    });

    return uniqueGeoplaces;
};

firstAltitude = function (geoplaces) {
    // Return the first viewAltitude we can find in the dictionary

    const keys = Object.keys(geoplaces);

    if (keys.length > 0) {
        return geoplaces[keys[0]].viewAltitude;
    }
};

getScripturesFailure = function () {
    replaceNodeContent(navElement, document.createTextNode("Unable to retrieve chapter contents."));
};

getScripturesSuccess = async function (chapterHtml) {
    navElement.innerHTML = await chapterHtml;

    injectNextPrevious();
    configureBreadcrumbs(0, requestedBookId, requestedChapter);
    updateMarkers(extractGeoplaces());
};

hashParameters = function () {
    if (location.hash !== "" && location.hash.length > 1) {
        return location.hash.slice(1).split(":");
    }

    return [];
};

injectNextPrevious = function () {
    // Find next/previous chapter information and add buttons to
    // any "navheading" elements for next/previous chapter navigation

    const previousParameters = previousChapter(requestedBookId, requestedChapter);
    const nextParameters = nextChapter(requestedBookId, requestedChapter);
    const navheadingNodes = Array.from(document.getElementsByClassName(CLASS_NAV_HEADING));

    navheadingNodes.forEach((element) => {
        element.appendChild(nextPreviousNode(previousParameters, nextParameters));
    });
};

mergePlacename = function (geoplace, name) {
    if (!geoplace.placename.includes(name)) {
        geoplace.placename += `, ${name}`;
    }
};

navigateBook = function (bookId) {
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

navigateChapter = function (bookId, chapter) {
    requestedBookId = bookId;
    requestedChapter = chapter;

    requestChapterText(bookId, chapter, getScripturesSuccess, getScripturesFailure);
};

navigateHome = function (volumeId) {
    const scripturesNavigationNode = domNode(TAG_DIV, null, ID_SCRIPTURES_NAVIGATION);

    buildVolumesGrid(scripturesNavigationNode, volumeId);
    replaceNodeContent(navElement, scripturesNavigationNode);

    configureBreadcrumbs(volumeId);
};

nextChapter = function (bookId, chapter) {
    let book = books[bookId];

    if (book !== undefined) {
        if (chapter < book.numChapters) {
            // This is the easy case: just add one to the current chapter
            return [bookId, chapter + 1, titleForBookChapter(book, chapter + 1)];
        }

        let nextBook = books[bookId + 1];

        if (next !== undefined) {
            // "Next" is first chapter of next book
            let nextChapterValue = 0;

            if (nextBook.numChapters > 0) {
                nextChapterValue = 1;
            }

            return [nextBook.id, nextChapterValue, titleForBookChapter(nextBook, nextChapterValue)];
        }
    }

    // There is no next chapter
    return [];
};

nextPreviousNode = function (previousParameters, nextParameters) {
    const nextPreviousNode = domNode(TAG_DIV, CLASS_NEXT_PREV);

    if (Array.isArray(previousParameters) && previousParameters.length > 0) {
        nextPreviousNode.appendChild(chapterNavigationNode(previousParameters, ICON_PREVIOUS));
    }

    if (Array.isArray(nextParameters) && nextParameters.length > 0) {
        nextPreviousNode.appendChild(chapterNavigationNode(nextParameters, ICON_NEXT));
    }

    return nextPreviousNode;
};

placenameWithFlag = function (name, flag) {
    let placename = name;

    if (typeof flag === "string" && flag.length > 0) {
        placename += ` ${flag}`;
    }

    return placename;
};

previousChapter = function (bookId, chapter) {
    let book = books[bookId];

    if (chapter > 1) {
        return [bookId, chapter - 1, titleForBookChapter(book, chapter - 1)];
    }

    let previousBook = books[bookId - 1];

    if (previousBook !== undefined) {
        // "Previous" is last chapter of previous book
        return [
            previousBook.id,
            previousBook.numChapters,
            titleForBookChapter(previousBook, previousBook.numChapters)
        ];
    }

    // There is no previous chapter
    return [];
};

titleForBookChapter = function (book, chapter) {
    if (book !== undefined) {
        if (chapter > 0) {
            return `${book.tocName} ${chapter}`;
        }

        return book.tocName;
    }
};

updateMarkers = function (geoplaces) {
    if (!mapIsLoaded) {
        // Call this function again in half a second
        window.setTimeout(() => {
            updateMarkers(geoplaces);
        }, 500);

        return;
    }

    clearMapMarkers();
    createMapMarkers(geoplaces);
    zoomMapToFitMarkers(firstAltitude(geoplaces));
};

volumeTitleNode = function (volume) {
    const titleNode = domNode(TAG_DIV, CLASS_VOLUME);
    const hyperlink = hyperlinkNode(`#${volume.id}`, volume.fullName);
    const headerNode = domNode(TAG_HEADER5, null, null, volume.fullName);

    hyperlink.appendChild(headerNode);
    titleNode.appendChild(hyperlink);

    return titleNode;
};

zoomLevelForAltitude = function (viewAltitude) {
    let zoomLevel = viewAltitude / ZOOM_RATIO;

    if (viewAltitude !== VIEW_ALTITUDE_DEFAULT) {
        zoomLevel =
            Math.log2(VIEW_ALTITUDE_CONVERSION_RATIO / viewAltitude) + VIEW_ALTITUDE_ZOOM_ADJUST;
    }

    return zoomLevel;
};

zoomMapToFitMarkers = function (viewAltitude) {
    if (mapMarkers.length > 0) {
        if (mapMarkers.length === 1 && viewAltitude) {
            const marker = mapMarkers[0];

            zoomToOneMarker(marker, viewAltitude);
        } else {
            zoomToFitMarkerBounds();
        }
    }
};

zoomToFitMarkerBounds = function () {
    const bounds = boundsForCurrentMarkers();

    map.panTo(bounds.getCenter());
    map.fitBounds(bounds);
};

zoomToOneMarker = function (marker, viewAltitude) {
    panAndZoom(marker.position.lat, marker.position.lng, viewAltitude);
};

/*------------------------------------------------------------------
 *                      PUBLIC METHODS
 */
export const init = function (callback) {
    apiInit(callback);

    // look up all the DOM elements we want to manipulate
    navElement = document.getElementById(ID_NAV_ELEMENT);
};

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

export const panAndZoom = function (lat, lng, viewAltitude) {
    map.panTo({ lat, lng });
    map.setZoom(zoomLevelForAltitude(viewAltitude));
};
