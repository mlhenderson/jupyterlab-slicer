import {
  JupyterFrontEnd, JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  ICommandPalette, MainAreaWidget
} from '@jupyterlab/apputils';

import {
  IFileBrowserFactory
} from '@jupyterlab/filebrowser';

import Slicer from "./slicer";


function activateSlicerPlugin(app: JupyterFrontEnd, factory: IFileBrowserFactory, palette: ICommandPalette) {
  const { tracker } = factory;



  // create a Slicer Widget
  const content = new Slicer();
  const widget = new MainAreaWidget({content});
  widget.id = 'slicer-jupyterlab';
  widget.title.label = 'Slicer';
  widget.title.closable = true;

  const openSlicer: string = 'slicer:open';
  app.commands.addCommand(openSlicer, {
    label: 'HDF5 Slice Viewer',
    execute: (args) => {
      console.log("PATH: " + tracker.currentWidget.selectedItems().next().path)
      
      
      console.log("ARGS: " + JSON.stringify(args));
      if (!widget.isAttached) {
        app.shell.add(widget, 'main')
      }
      content.update();
      app.shell.activateById(widget.id);
    }
  });
  palette.addItem({command: openSlicer, category: 'UDA'});
  app.contextMenu.addItem({
    command: openSlicer,
    selector: '.jp-DirListing-item',
    // args: { path: widget.context.path }
  })
}

/**
 * Initialization data for the jupyterlab-sliced extension.
 */
const slicerExtension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-sliced',
  autoStart: true,
  requires: [IFileBrowserFactory, ICommandPalette],
  activate: activateSlicerPlugin
};

export default slicerExtension;