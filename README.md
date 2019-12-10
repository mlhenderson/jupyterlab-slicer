# jupyterlab-slicer
A JupyterLab plugin for rendering 2-dimensional orthographic views of 3-dimensional data. Currently, the plugin requires HDF5 files with the following datasets in the root (i.e, `/`) group:
* `x`, x-axis data
* `y`, y-axis data
* `z`, z-axis data
* `model`, the target data
The 3D target data can be explored using a dropdown menu to select the normal axis, and a slider to select the current slice index. 

## Prerequisites

* JupyterLab
* NodeJS

## Installation
Navigate to the repo directory, and execute the following commands:

Install the HDF5 server extension
```bash
pip install .
```

Install the JupyterLab Slicer extension
```bash
jupyter labextension install .
```

If you are running Notebook 5.2 or earlier, enable the server extension explicitly by running
```bash
jupyter serverextension enable --py --sys-prefix jupyterlab_hdf
```

## Development

For a development install (requires npm version 4 or later), do the following in the repository directory:

```bash
jlpm install
jlpm run build
jupyter labextension link .
```

To rebuild the package and the JupyterLab app:

```bash
jlpm run build
jupyter lab build
```

