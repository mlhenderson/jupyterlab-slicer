# jupyterlab-slicer

Temporary install instructions


## Prerequisites

* JupyterLab
* NodeJS

## Installation
Navigate to the repo directory, and execute the following commands for a demo
install. 

Install the HDF5 server extension
```bash
pip install .
```

Install the JupyterLab Slicer extension
```bash
jupyter labextension install .
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

