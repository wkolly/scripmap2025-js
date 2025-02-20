/*======================================================================
 * FILE:    mapHelper.js
 * AUTHOR:  Stephen W. Liddle
 * DATE:    Winter 2025
 *
 * DESCRIPTION: Module for managing Google Maps API.
 */

/*----------------------------------------------------------------------
 *                      CONSTANTS
 */
import { GOOGLE_MAPS_API_KEY } from "./config.js";
import {
    DARK_MAP_BACKGROUND,
    DARK_MAP_ID,
    DARK_MAP_STYLE,
    LIGHT_MAP_BACKGROUND,
    LIGHT_MAP_ID,
    LIGHT_MAP_STYLE
} from "./constants.js";
import { domNode, TAG_DIV } from "./html.js";

/*----------------------------------------------------------------------
 *                      CONSTANTS
 */
const CLASS_GEOPLACE_MARKER = "geoplace-marker";
const CLASS_LABEL = "label";
const CLASS_PIN = "pin";
const LAT_LON_PARSER = /\((.*),'(.*)',(.*),(.*),(.*),'(.*)'\)/;
const VIEW_ALTITUDE_DEFAULT = 5000;
const VIEW_ALTITUDE_CONVERSION_RATIO = 591657550.5;
const VIEW_ALTITUDE_ZOOM_ADJUST = -2;
const ZOOM_RATIO = 450;

/*----------------------------------------------------------------------
 *                      PRIVATE VARIABLES
 */
let mapMarkers = [];

/*----------------------------------------------------------------------
 *                      PRIVATE FUNCTIONS
 */
const boundsForCurrentMarkers = function () {
    const bounds = new google.maps.LatLngBounds();

    mapMarkers.forEach((marker) => {
        bounds.extend(marker.position);
    });

    return bounds;
};

const clearMapMarkers = function () {
    mapMarkers.forEach((marker) => {
        marker.setMap(null);
    });

    mapMarkers = [];
};

const createMap = async function (Map, zoom, center, mapTypeId, isDark) {
    window.map = new Map(document.getElementById("map"), {
        zoom,
        center,
        mapId: isDark ? DARK_MAP_ID : LIGHT_MAP_ID,
        mapTypeId,
        mapTypeControl: true,
        mapTypeControlOptions: {
            position: google.maps.ControlPosition.RIGHT_TOP
        },
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        }
        // backgroundColor: isDark ? DARK_MAP_BACKGROUND : LIGHT_MAP_BACKGROUND,
        // styles: isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE
    });

    window.mapIsLoaded = true;
};

const createMapMarkers = function (geoplaces) {
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

const extractGeoplaces = function () {
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

const firstAltitude = function (geoplaces) {
    // Return the first viewAltitude we can find in the dictionary

    const keys = Object.keys(geoplaces);

    if (keys.length > 0) {
        return geoplaces[keys[0]].viewAltitude;
    }
};

const mergePlacename = function (geoplace, name) {
    if (!geoplace.placename.includes(name)) {
        geoplace.placename += `, ${name}`;
    }
};

const placenameWithFlag = function (name, flag) {
    let placename = name;

    if (typeof flag === "string" && flag.length > 0) {
        placename += ` ${flag}`;
    }

    return placename;
};

const updateMarkers = function (geoplaces) {
    if (!window.mapIsLoaded) {
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

const zoomLevelForAltitude = function (viewAltitude) {
    let zoomLevel = viewAltitude / ZOOM_RATIO;

    if (viewAltitude !== VIEW_ALTITUDE_DEFAULT) {
        zoomLevel =
            Math.log2(VIEW_ALTITUDE_CONVERSION_RATIO / viewAltitude) + VIEW_ALTITUDE_ZOOM_ADJUST;
    }

    return zoomLevel;
};

const zoomMapToFitMarkers = function (viewAltitude) {
    if (mapMarkers.length > 0) {
        if (mapMarkers.length === 1 && viewAltitude) {
            const marker = mapMarkers[0];

            zoomToOneMarker(marker, viewAltitude);
        } else {
            zoomToFitMarkerBounds();
        }
    }
};

const zoomToFitMarkerBounds = function () {
    const bounds = boundsForCurrentMarkers();

    map.panTo(bounds.getCenter());
    map.fitBounds(bounds);
};

const zoomToOneMarker = function (marker, viewAltitude) {
    panAndZoom(marker.position.lat, marker.position.lng, viewAltitude);
};

/*----------------------------------------------------------------------
 *                      PUBLIC FUNCTIONS
 */
export const mapInit = async function () {
    ((g) => {
        var h,
            a,
            k,
            p = "The Google Maps JavaScript API",
            c = "google",
            l = "importLibrary",
            q = "__ib__",
            m = document,
            b = window;
        b = b[c] || (b[c] = {});
        var d = b.maps || (b.maps = {}),
            r = new Set(),
            e = new URLSearchParams(),
            u = () =>
                h ||
                (h = new Promise(async (f, n) => {
                    await (a = m.createElement("script"));
                    e.set("libraries", [...r] + "");
                    for (k in g)
                        e.set(
                            k.replace(/[A-Z]/g, (t) => "_" + t[0].toLowerCase()),
                            g[k]
                        );
                    e.set("callback", c + ".maps." + q);
                    a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
                    d[q] = f;
                    a.onerror = () => (h = n(Error(p + " could not load.")));
                    a.nonce = m.querySelector("script[nonce]")?.nonce || "";
                    m.head.append(a);
                }));
        d[l]
            ? console.warn(p + " only loads once. Ignoring:", g)
            : (d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)));
    })({
        key: GOOGLE_MAPS_API_KEY,
        v: "quarterly"
    });

    const { Map } = await google.maps.importLibrary("maps");

    await google.maps.importLibrary("marker");

    let isDark = false;

    if (typeof window.matchMedia === "function") {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            isDark = true;
        }

        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
            createMap(Map, window.map.zoom, window.map.center, window.map.mapTypeId, event.matches);
        });
    }

    createMap(Map, 8, { lat: 31.778407, lng: 35.234725 }, "terrain", isDark);
};

export const showLocation = function (lat, lng, viewAltitude) {
    map.panTo({ lat, lng });
    map.setZoom(zoomLevelForAltitude(viewAltitude));
};

export const setupMarkers = function () {
    updateMarkers(extractGeoplaces());
};
