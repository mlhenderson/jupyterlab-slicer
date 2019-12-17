import {
  JupyterFrontEnd, JupyterFrontEndPlugin, ILayoutRestorer
} from '@jupyterlab/application';

import {
  MainAreaWidget, WidgetTracker
} from '@jupyterlab/apputils';

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { PathExt } from '@jupyterlab/coreutils';

import Slicer from "./slicer";

/*
function hasId(widget: MainAreaWidget<Slicer>, id: string) {
  return widget.id === id;
}
*/

function activate(app: JupyterFrontEnd, factory: IFileBrowserFactory, restorer: ILayoutRestorer) {
  console.log("activate");

  const fileTracker = factory.tracker;
  let widget: MainAreaWidget<Slicer>;

  const openSlicer: string = 'slicer:open';
  app.commands.addCommand(openSlicer, {
    label: 'Open Slice Viewer',
    iconClass: 'jp-MaterialIcon slicer-icon',
    execute: () => {

      console.log("app.commands.addCommand");

      // Get path of selected file from the file browser's tracker
      let fpath = fileTracker.currentWidget.selectedItems().next().path;
      let slicerid = `slicer-${fpath}`;

      // Find the widget if it has already been rendered
      //widget = slicerTracker.find((w: MainAreaWidget<Slicer>) => hasId(w, slicerid));
      if (!widget) {
        const content = new Slicer(fpath);
        widget = new MainAreaWidget({content});
        widget.id = slicerid;
        widget.title.label = `${PathExt.basename(fpath)}`;
        widget.title.closable = true;
        widget.title.icon = 'slicer-icon';
        slicerTracker.add(widget);
        //widget.content.update();
      }
      if (!slicerTracker.has(widget)) {
        slicerTracker.add(widget);
      }
      if (!widget.isAttached) {
          app.shell.add(widget, 'main');
      }
      widget.content.update();

      // Activate the widget
      app.shell.activateById(widget.id);
    }
  });

  // Add the command to the file browser's context menu
  app.contextMenu.addItem({
    command: openSlicer,
    selector: '.jp-DirListing-item[data-isdir="false"]',
  });

  // Track and store slicer state across page reloads
  const slicerTracker = new WidgetTracker<MainAreaWidget<Slicer>>({
    namespace: 'slicer'
  });

  /*
  // TODO: figure out why this isn't working
  if (restorer) {
    void restorer.restore(slicerTracker, {
      command: openSlicer,
      name: () => widget.title.label
    });
  }
  */
}

/**
 * Initialization data for the jupyterlab-sliced extension.
 */
const slicerExtension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-sliced',
  autoStart: true,
  requires: [IFileBrowserFactory, ILayoutRestorer],
  activate: activate
};

export default slicerExtension;