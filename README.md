# jupyterlab-slicex

slice


## Prerequisites

* JupyterLab
* NodeJS

## Installation

```bash
conda create -n jupyterlab-slicer jupyterlab nodejs
```

```bash
pip install .
```

```bash
jupyter labextension install jupyterlab-slicer
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

