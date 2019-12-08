import * as Plotly from "plotly.js";
import { Widget } from '@phosphor/widgets';
import { ServerConnection } from "@jupyterlab/services";
import { hdfDataRequest } from './hdf';
var Dimension;
(function (Dimension) {
    Dimension["x"] = "x";
    Dimension["y"] = "y";
    Dimension["z"] = "z";
})(Dimension || (Dimension = {}));
;
;
;
const TARGET_DATASET_NAME = 'model';
export default class Slicer extends Widget {
    constructor() {
        super();
        this.layoutBase = {
            width: 700,
            height: 600,
            // Dropdown buttons
            updatemenus: [{
                    y: 0.8,
                    yanchor: 'bottom',
                    pad: { r: 60 },
                    buttons: [{
                            method: 'restyle',
                            args: ['normalAxis', Dimension.z],
                            label: 'z'
                        }, {
                            method: 'restyle',
                            args: ['normalAxis', Dimension.y],
                            label: 'y'
                        }, {
                            method: 'restyle',
                            args: ['normalAxis', Dimension.x],
                            label: 'x'
                        }]
                }]
        };
        this.graphDiv = document.createElement('div');
        this.graphDiv.classList.add("graphDiv");
        this.node.appendChild(this.graphDiv);
        this.serverSettings = ServerConnection.makeSettings();
        // temporary hard coding
        const fpath = 'test_datasets/laguna_del_maule_miller.h5';
        // end temporary
        this.plotNewDataset(fpath);
    }
    /*
    * Generates the default plot-view for the given
    * file: xy-plane at index 0.
    */
    async plotNewDataset(fpath) {
        this.fpath = fpath;
        // Initialize defaults
        this.horizontalAxis = Dimension.x;
        this.verticalAxis = Dimension.y;
        this.normalAxis = Dimension.z;
        this.sliceIndex = 0;
        let data = await this.getPlotData();
        const plotData = [{
                z: data.slice,
                x: data.axis.horizontal,
                y: data.axis.vertical,
                type: 'heatmap',
                colorscale: 'Viridis'
            }];
        const layoutUpdate = this.layoutUpdate(data);
        const plotLayout = Object.assign({}, this.layoutBase, layoutUpdate);
        this.plot = await Plotly.newPlot(this.graphDiv, plotData, plotLayout, { displaylogo: false });
        // Define behavior for sliderchange event
        this.plot.on('plotly_sliderchange', (data) => {
            this.updateSliceIndex(data.slider.active);
        });
        // Define behavior for dropdown change event
        this.plot.on('plotly_restyle', (data) => {
            const normalAxis = data[0].normalAxis;
            if (normalAxis !== undefined) {
                this.updateNormalAxis(normalAxis);
            }
        });
    }
    async updateSliceIndex(sliceIndex) {
        this.sliceIndex = sliceIndex;
        const sliceData = await this.getSliceData();
        const update = {
            z: [sliceData] // The data array we want to update must be wrapped in an outer array
        };
        const layoutUpdate = {
            title: `${this.normalAxis} = ${this.normalAxisData[this.sliceIndex]}`
        };
        Plotly.update(this.graphDiv, update, layoutUpdate);
    }
    async updateNormalAxis(normalAxis) {
        this.normalAxis = normalAxis;
        this.sliceIndex = 0;
        // Display yz plane
        if (normalAxis === Dimension.x) {
            this.horizontalAxis = Dimension.y;
            this.verticalAxis = Dimension.z;
        }
        // Display xz plane
        else if (normalAxis === Dimension.y) {
            this.horizontalAxis = Dimension.x;
            this.verticalAxis = Dimension.z;
        }
        // Display xy plane
        else {
            this.horizontalAxis = Dimension.x;
            this.verticalAxis = Dimension.y;
        }
        const data = await this.getPlotData();
        const dataUpdate = {
            z: [data.slice],
            x: [data.axis.horizontal],
            y: [data.axis.vertical]
        };
        const layoutUpdate = this.layoutUpdate(data);
        Plotly.update(this.graphDiv, dataUpdate, layoutUpdate);
    }
    async getPlotData() {
        const axisData = await this.getAxisData();
        const sliceData = await this.getSliceData();
        return {
            axis: axisData,
            slice: sliceData
        };
    }
    async getAxisData() {
        const hParams = {
            fpath: this.fpath,
            uri: this.horizontalAxis,
        };
        const vParams = {
            fpath: this.fpath,
            uri: this.verticalAxis,
        };
        const nParams = {
            fpath: this.fpath,
            uri: this.normalAxis,
        };
        const horizontalAxisData = await hdfDataRequest(hParams, this.serverSettings);
        const verticalAxisData = await hdfDataRequest(vParams, this.serverSettings);
        const normalAxisData = await hdfDataRequest(nParams, this.serverSettings);
        // Save the normalAxisData so its value can be displayed above the plot
        this.normalAxisData = normalAxisData;
        return {
            horizontal: horizontalAxisData,
            vertical: verticalAxisData,
            normal: normalAxisData
        };
    }
    async getSliceData() {
        const params = {
            fpath: this.fpath,
            uri: TARGET_DATASET_NAME,
            select: this.selectString(this.sliceIndex)
        };
        return hdfDataRequest(params, this.serverSettings).then(sliceData => {
            if (this.normalAxis === Dimension.z) {
                return sliceData;
            }
            // Need to transpose data if slicing through x or y dimensions
            return this.transpose(sliceData);
        });
    }
    layoutUpdate(data) {
        const sliders = this.sliders(data);
        return {
            title: `${this.normalAxis} = ${this.normalAxisData[this.sliceIndex]}`,
            xaxis: { title: `${this.horizontalAxis}`, automargin: true },
            yaxis: { title: `${this.verticalAxis}`, automargin: true },
            sliders: sliders,
        };
    }
    sliders(data) {
        const nSteps = data.axis.normal.length;
        let steps = [];
        for (let i = 0; i < nSteps; i++) {
            let step = {
                value: i.toString(),
                label: i.toString(),
                method: 'skip',
            };
            steps.push(step);
        }
        const sliders = [{
                pad: { t: 60 },
                currentvalue: {
                    visible: false,
                    xanchor: 'right',
                    prefix: `${this.normalAxis} = `,
                    font: {
                        color: '#888',
                        size: 20
                    }
                },
                steps: steps,
            }];
        return sliders;
    }
    selectString(sliceIndex) {
        if (this.normalAxis === Dimension.x) {
            return `[${sliceIndex},:,:]`;
        }
        if (this.normalAxis === Dimension.y) {
            return `[:,${sliceIndex},:]`;
        }
        return `[:,:,${sliceIndex}]`;
    }
    transpose(data) {
        return data[0].map((_, i) => data.map((row) => row[i]));
    }
}
