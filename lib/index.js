import { ILayoutRestorer } from '@jupyterlab/application';
import { MainAreaWidget, WidgetTracker } from '@jupyterlab/apputils';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { PathExt } from '@jupyterlab/coreutils';
import Slicer from "./slicer";
function hasId(widget, id) {
    return widget.id === id;
}
function activate(app, factory, restorer) {
    console.log("activate");
    const fileTracker = factory.tracker;
    let widget;
    const openSlicer = 'slicer:open';
    app.commands.addCommand(openSlicer, {
        label: 'Open Slice Viewer',
        iconClass: 'jp-MaterialIcon slicer-icon',
        execute: () => {
            console.log("app.commands.addCommand");
            // Get path of selected file from the file browser's tracker
            let fpath = fileTracker.currentWidget.selectedItems().next().path;
            let slicerid = `slicer-${fpath}`;
            // Find the widget if it has already been rendered
            widget = slicerTracker.find((w) => hasId(w, slicerid));
            if (!widget) {
                const content = new Slicer(fpath);
                widget = new MainAreaWidget({ content });
                widget.id = slicerid;
                widget.title.label = `${PathExt.basename(fpath)}`;
                widget.title.closable = true;
                widget.title.icon = 'slicer-icon';
                slicerTracker.add(widget);
                //widget.content.update();
            }
            else {
                return;
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
    const slicerTracker = new WidgetTracker({
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
const slicerExtension = {
    id: 'jupyterlab-sliced',
    autoStart: true,
    requires: [IFileBrowserFactory, ILayoutRestorer],
    activate: activate
};
export default slicerExtension;
