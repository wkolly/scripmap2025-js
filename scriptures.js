const Scriptures = (function () {
    const REQUEST_GET = "GET";
    const REQUEST_STATUS_ERROR = 400;
    const REQUEST_STATUS_OK = 200;
    const URL_BASE = "https://scriptures.byu.edu/mapscrip/";
    const URL_BOOKS = `${URL_BASE}model/books.php`;
    const URL_VOLUMES = `${URL_BASE}model/volumes.php`;

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

    function init() {
        let books;
        let volumes;

        getJSONRequest(URL_BOOKS, (json) => {
            books = json;
            console.log(books);
        });
        getJSONRequest(URL_VOLUMES, (json) => {
            volumes = json;
            console.log(volumes);
        });
    }

    return {
        init
    };
})();
