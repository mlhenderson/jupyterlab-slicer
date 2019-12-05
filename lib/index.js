import { ICommandPalette, MainAreaWidget } from '@jupyterlab/apputils';
import Slicer from "./slicer";
function activateSlicerPlugin(app, palette) {
    console.log('JupyterLab extension jupyterlab-sliced is activated!');
    // create a Slicer Widget
    const content = new Slicer();
    const widget = new MainAreaWidget({ content });
    widget.id = 'slicer-jupyterlab';
    widget.title.label = 'Slicer';
    widget.title.closable = true;
    const command = 'slicer:open';
    app.commands.addCommand(command, {
        label: 'Slicer-typescript',
        execute: () => {
            if (!widget.isAttached) {
                app.shell.add(widget, 'main');
            }
            content.update();
            app.shell.activateById(widget.id);
        }
    });
    palette.addItem({ command, category: 'UDA' });
}
/**
 * Initialization data for the jupyterlab-sliced extension.
 */
const extension = {
    id: 'jupyterlab-sliced',
    autoStart: true,
    requires: [ICommandPalette],
    activate: activateSlicerPlugin
};
export default extension;
