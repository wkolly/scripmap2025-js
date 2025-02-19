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
    DARK_MAP_STYLE,
    LIGHT_MAP_BACKGROUND,
    LIGHT_MAP_STYLE
} from "./constants.js";

/*----------------------------------------------------------------------
 *                      CONSTANTS
 */

/*----------------------------------------------------------------------
 *                      PRIVATE FUNCTIONS
 */
const createMap = async function (Map, zoom, center, mapTypeId, isDark) {
    window.map = new Map(document.getElementById("map"), {
        zoom,
        center,
        mapId: "SCRIPTURES_MAPPED",
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
        },
        backgroundColor: isDark ? DARK_MAP_BACKGROUND : LIGHT_MAP_BACKGROUND,
        styles: isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE
    });

    window.mapIsLoaded = true;
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
