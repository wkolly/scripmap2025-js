const Scriptures = (function () {
    const REQUEST_GET = "GET";
    const URL_BASE = "https://scriptures.byu.edu/mapscrip/";
    const URL_BOOKS = `${URL_BASE}model/books.php`;
    const URL_VOLUMES = `${URL_BASE}model/volumes.php`;

    function loadBooks() {
        let request = new XMLHttpRequest();

        function handleAjaxError() {
            console.log("There was an AJAX problem.");
        }

        function handleAjaxResponse() {
            console.log("Request received.");
        }

        request.open(REQUEST_GET, URL_BOOKS, true);
        request.onload = handleAjaxResponse;
        request.onerror = handleAjaxError;
        request.send();
    }

    return {
        loadBooks
    };
})();
