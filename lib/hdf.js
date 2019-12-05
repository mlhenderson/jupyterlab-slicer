// Module for making requests to the backend HDF server extension
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { URLExt } from "@jupyterlab/coreutils";
import { ServerConnection } from "@jupyterlab/services";
/**
 * Send a parameterized request to the `hdf/contents` api, and
 * return the result.
 */
export function hdfContentsRequest(parameters, settings) {
    // allow the query parameters to be optional
    const { fpath } = parameters, rest = __rest(parameters, ["fpath"]);
    const fullUrl = URLExt.join(settings.baseUrl, "hdf", "contents", fpath).split("?")[0] +
        URLExt.objectToQueryString(Object.assign({}, rest));
    return ServerConnection.makeRequest(fullUrl, {}, settings).then(response => {
        if (response.status !== 200) {
            return response.text().then(data => {
                throw new ServerConnection.ResponseError(response, data);
            });
        }
        return response.json();
    });
}
/**
 * Send a parameterized request to the `hdf/data` api, and
 * return the result.
 */
export function hdfDataRequest(parameters, settings) {
    // require the uri query parameter, select is optional
    const { fpath, uri } = parameters, select = __rest(parameters, ["fpath", "uri"]);
    const fullUrl = URLExt.join(settings.baseUrl, "hdf", "data", fpath).split("?")[0] +
        URLExt.objectToQueryString(Object.assign({ uri }, select));
    return ServerConnection.makeRequest(fullUrl, {}, settings).then(response => {
        if (response.status !== 200) {
            return response.text().then(data => {
                throw new ServerConnection.ResponseError(response, data);
            });
        }
        return response.json();
    });
}
