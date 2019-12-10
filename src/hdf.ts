// Module for making requests to the backend HDF server extension

import { URLExt } from "@jupyterlab/coreutils";

import { ServerConnection } from "@jupyterlab/services";

/**
 * Send a parameterized request to the `hdf/contents` api, and
 * return the result.
 */
export function hdfContentsRequest(
  parameters: RequestParameters,
  settings: ServerConnection.ISettings
): Promise<any> {
  // allow the query parameters to be optional
  const { fpath, ...rest } = parameters;

  const fullUrl =
    URLExt.join(settings.baseUrl, "hdf", "contents", fpath).split("?")[0] +
    URLExt.objectToQueryString({ ...rest });

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
export function hdfDataRequest(
  parameters: RequestParameters,
  settings: ServerConnection.ISettings
): Promise<any> {
  // require the uri query parameter, select is optional
  const { fpath, uri, ...select } = parameters;

  const fullUrl =
    URLExt.join(settings.baseUrl, "hdf", "data", fpath).split("?")[0] +
    URLExt.objectToQueryString({ uri, ...select });

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
 * The parameters that make up the input of an hdf contents request.
 */
export interface RequestParameters {
  /**
   * Path on disk to an HDF5 file.
   */
  fpath: string;

  /**
   * Path within an HDF5 file to a specific group or dataset.
   */
  uri: string;

  /**
   * String representing an array of slices which determine a
   * hyperslab selection of an n-dimensional HDF5 dataset.
   * Syntax and semantics matches that of h5py's Dataset indexing.
   * E.g, ?select=[0:3, 1:5, :, 9]
   * See jupyterlab_hdf/util.py for full details.
   */
  select?: string;
}


