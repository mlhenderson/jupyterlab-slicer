// import * as Plotly from "plotly.js"
import { Layout, PlotData, newPlot } from 'plotly.js';

import {
  Widget
} from '@phosphor/widgets';

import { ServerConnection } from "@jupyterlab/services";

import { hdfDataRequest, IContentsParameters } from './hdf';

enum Plane {
  xy,
  xz,
  yz
};

export default class Slicer extends Widget {
  private readonly graphDiv: HTMLDivElement;
  private serverSettings: ServerConnection.ISettings;
  // private fpath: string;
  // private uri: string;
  private data: PlotData[];
  private dataX: number[];
  private dataY: number[];
  private dataZ: number[][];
  private plotLayout: Layout;
  

  constructor() {
    super();

    this.graphDiv = document.createElement('div');
    this.node.appendChild(this.graphDiv);

    this.serverSettings = ServerConnection.makeSettings();

    this.plotLayout = {
      width: 700,
      height: 700,
      xaxis: { title: 'x' },
      yaxis: { title: 'y' },
      sliders: [{
        pad: {t: 30},
        currentvalue: {
          xanchor: "right",
          prefix: 'z-index: ',
          font: {
            color: '#888',
            size: 20
          }
        },
        steps: [{
          label: 'red',
          method: 'restyle',
          args: ['line.color', 'red']
        }, {
          label: 'green',
          method: 'restyle',
          args: ['line.color', 'green']
        }, {
          label: 'blue',
          method: 'restyle',
          args: ['line.color', 'blue']
        }]
      }]
    } as Layout;

  // temporary hard coding
  let fpath = 'datasets/laguna_del_maule_miller.h5';
  // end temporary

  this.plotNewDataset(fpath);

  // temporary compiler fluffing
  this.updateViewingPlane(Plane.xy);
  this.updateSliceIndex(3);
  // end temporary

  }

  /*
  * Generates the default plot-view for the given
  * file: xy-plane at index 0.
  */
  private async plotNewDataset(fpath: string) {
    const paramsX: IContentsParameters = {
      fpath: fpath,
      uri: "x",
    }

    const paramsY: IContentsParameters = {
      fpath: fpath,
      uri: "y",
    }

    const paramsZ: IContentsParameters = {
      fpath: fpath,
      uri: "model",
      select: "[:,:,0]"
    }

    // need a try...catch block here
    this.dataX = await hdfDataRequest(paramsX, this.serverSettings);
    this.dataY = await hdfDataRequest(paramsY, this.serverSettings);
    this.dataZ = await hdfDataRequest(paramsZ, this.serverSettings);

    this.data = [{
      z: this.dataZ,
      x: this.dataX,
      y: this.dataY,
      type: 'heatmap'
    } as PlotData];

    newPlot(this.graphDiv, this.data, this.plotLayout);
  }

  private async updateSliceIndex(sliceIndex: number) {
    return 0;
  }


  private async updateViewingPlane(newPlane: Plane) {
    return 0;
  }

  // private async getSteps
}

  // private async getSliceData(plane: "xy" | "xz" | "yz", sliceIndex: number) {
  //   const paramsX: IContentsParameters = {
  //     fpath: this.fpath,
  //     uri: "x",
  //   }

  //   const paramsY: IContentsParameters = {
  //     fpath: this.fpath,
  //     uri: "y",
  //   }

  //   const paramsZ: IContentsParameters = {
  //     fpath: this.fpath,
  //     uri: "model",
  //     select: `[:,:,${sliceIndex.toString()}]`
  //   }

  //   this.dataX = await hdfDataRequest(paramsX, this.serverSettings);
  //   this.dataY = await hdfDataRequest(paramsY, this.serverSettings);
  //   this.dataZ = await hdfDataRequest(paramsZ, this.serverSettings);

  //   // var dataX;
  //   // var data

  //   // hdfDataRequest(paramsX, this.serverSettings).then(data => {
  //   //   this.dataX = data;
  //   // });
  //   // hdfDataRequest(paramsY, this.serverSettings).then(data => {
  //   //   this.dataY = data;
  //   // });
  //   // hdfDataRequest(paramsZ, this.serverSettings).then(data => {
  //   //   this.data = data;
  //   //   newPlot(this.graphDiv, this.data, this.plotLayout);
  //   // });

  //   // console.log("Data z: " + this.dataZ.toString());

  //   // this.data = [{
  //   //   z: this.dataZ,
  //   //   x: this.dataX,
  //   //   y: this.dataY,
  //   //   type: 'heatmap'
  //   // } as PlotData];
  //   this.dataX = await hdfDataRequest(paramsX, this.serverSettings);
  //   this.dataY = await hdfDataRequest(paramsY, this.serverSettings);
  //   this.dataZ = await hdfDataRequest(paramsZ, this.serverSettings);

  //   this.data = [{
  //   z: this.dataZ,
  //   x: this.dataX,
  //   y: this.dataY,
  //   type: 'heatmap'
  // } as PlotData];

  // // update plot here

  //   // hdfDataRequest(paramsX, this.serverSettings).then(data => {
  //   //   this.dataX = data;
  //   //   hdfDataRequest(paramsY, this.serverSettings).then(data => {
  //   //    this.dataY = data;
  //   //     hdfDataRequest(paramsZ, this.serverSettings).then(data => {
  //   //       // this.dataZ = data.map((arr: any) => arr.flat());
  //   //       this.dataZ = data;
  //   //       this.data = [{
  //   //       z: this.dataZ,
  //   //       x: this.dataX,
  //   //       y: this.dataY,
  //   //       type: 'heatmap'
  //   //     } as PlotData];
  //   //     //   var plotD = [{
  //   //     //     z: [[[1], [20], [30], [50], [1]], [[20], [1], [60], [80], [30]], [[30], [60], [1], [-10], [20]]],
  //   //     //     x: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  //   //     //     y: ['Morning', 'Afternoon', 'Evening'],
  //   //     //     type: 'heatmap'
  //   //     // } as PlotData];
  //   //     console.log("data: " + JSON.stringify(this.data));
  //   //     newPlot(this.graphDiv, this.data, this.plotLayout);
  //   // });
  //   // });
  //   // });


  // }
