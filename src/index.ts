import {
  JupyterFrontEnd, JupyterFrontEndPlugin, ILayoutRestorer
} from '@jupyterlab/application';

import {
  MainAreaWidget, WidgetTracker
} from '@jupyterlab/apputils';

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { PathExt } from '@jupyterlab/coreutils';

import Slicer from "./slicer";


function hasId(widget: MainAreaWidget<Slicer>, id: string) {
  return widget.id === id;
}

function activateSlicerPlugin(app: JupyterFrontEnd, factory: IFileBrowserFactory, restorer: ILayoutRestorer) {
  const fileTracker = factory.tracker;
  let widget: MainAreaWidget<Slicer>;

  const openSlicer: string = 'slicer:open';
  app.commands.addCommand(openSlicer, {
    label: 'Open Slice Viewer',
    iconClass: 'jp-MaterialIcon slicer-icon',
    execute: () => {
      // Get path of selected file from the file browser's tracker
      let fpath = fileTracker.currentWidget.selectedItems().next().path;
      let id = `slicer-${fpath}`;

      // Find the widget if it has already been rendered
      widget = slicerTracker.find((w: MainAreaWidget<Slicer>) => hasId(w, id))
      if (!widget) {
        const content = new Slicer(fpath);
        widget = new MainAreaWidget({content})
        widget.id = id;
        widget.title.label = `${PathExt.basename(fpath)}`;
        widget.title.closable = true;
        slicerTracker.add(widget);
        widget.content.update();
      }
      if (!widget.isAttached) {
          app.shell.add(widget, 'main');
        }
      app.shell.activateById(widget.id);
    }
  });

  // Add the command to the file browser's context menu
  app.contextMenu.addItem({
    command: openSlicer,
    selector: '.jp-DirListing-item',
  });

  // Track and store slicer state across page reloads
  let slicerTracker = new WidgetTracker<MainAreaWidget<Slicer>>({
    namespace: 'slicer'
  });
  // TODO: figure out why this isn't working
  // restorer.restore(slicerTracker, {
  //   command: openSlicer,
  //   name: () => 'slicer'
  // });
}

/**
 * Initialization data for the jupyterlab-sliced extension.
 */
const slicerExtension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-sliced',
  autoStart: true,
  requires: [IFileBrowserFactory, ILayoutRestorer],
  activate: activateSlicerPlugin
};

export default slicerExtension;