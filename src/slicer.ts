import * as Plotly from "plotly.js"
import { PlotlyHTMLElement, Layout, PlotData, SliderStep, Slider } from 'plotly.js';

import {
  Widget
} from '@phosphor/widgets';

import { ServerConnection } from "@jupyterlab/services";

import { 
  hdfDataRequest, 
  // hdfContentsRequest, 
  IContentsParameters 
} from './hdf';

enum Plane {
  xy,
  xz,
  yz
};

export default class Slicer extends Widget {
  private readonly graphDiv: HTMLDivElement;
  private plot: PlotlyHTMLElement;
  private serverSettings: ServerConnection.ISettings;
  // relative filepath of the dataset that is currently displayed
  private fpath: string;
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
      // sliders: [{
      //   pad: {t: 30},
      //   currentvalue: {
      //     xanchor: "right",
      //     // temp hard-coding
      //     prefix: 'z-index: ',
      //     font: {
      //       color: '#888',
      //       size: 20
      //     }
      //   },
        // steps: [{
        //   label: 'red',
        //   method: 'restyle',
        //   args: ['line.color', 'red']
        // }, {
        //   label: 'green',
        //   method: 'restyle',
        //   args: ['line.color', 'green']
        // }, {
        //   label: 'blue',
        //   method: 'restyle',
        //   args: ['line.color', 'blue']
        // }]
      // }]
    } as Layout;

  // temporary hard coding
  let fpath = 'datasets/laguna_del_maule_miller.h5';
  // end temporary

  // this.graphDiv.on('plotly_sliderchange', (sliderData: any) => {
  //   // this.updateSliceIndex(sliderData.)
  //   console.log("sliderData: " + JSON.stringify(sliderData));
  // })

  this.plotNewDataset(fpath);

  // temporary compiler fluffing
  this.updateViewingPlane(Plane.xy);
  // this.updateSliceIndex(3);
  // end temporary

  }

  /*
  * Generates the default plot-view for the given
  * file: xy-plane at index 0.
  */
  private async plotNewDataset(fpath: string) {
    this.fpath = fpath;
    const paramsX: IContentsParameters = {
      fpath: this.fpath,
      uri: "x",
    }

    const paramsY: IContentsParameters = {
      fpath: this.fpath,
      uri: "y",
    }

    const paramsZ: IContentsParameters = {
      fpath: this.fpath,
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

    const steps = await this.getSliderSteps();
    const sliders = [{
        pad: {t: 30},
        currentvalue: {
          xanchor: "right",
          // temp hard-coding
          prefix: 'z-index: ',
          font: {
            color: '#888',
            size: 20
          }
        },
        steps: steps,
     }] as Partial<Slider>[]

    this.plotLayout.sliders = sliders;

    this.plot = await Plotly.newPlot(this.graphDiv, this.data, this.plotLayout);
      // this.plot = await this.plotNewDataset(fpath);
    this.plot.on('plotly_sliderchange', (sliderData: any) => {
      this.updateSliceIndex(sliderData.slider.active);
      console.log("sliderData: " + sliderData.slider.active.toString());
    })
  }

  private async updateSliceIndex(sliceIndex: number) {
    // TODO: fix this so it uses Plotly.update

    const paramsZ: IContentsParameters = {
      fpath: this.fpath,
      uri: "model",
      select: `[:,:,${sliceIndex}]`
    }
    var z = await hdfDataRequest(paramsZ, this.serverSettings);
    var update = {
      z: [z] // The array we want to update must be wrapped in an array
    };
    Plotly.restyle(this.graphDiv, update);


  }


  private async updateViewingPlane(newPlane: Plane) {
    return 0;
  }

  private async getSliderSteps() {
    // TODO: fix this so it's calling hdfContentsRequest and NOT
    // hdfDataRequest

    // const paramsContents: IContentsParameters = {
    //   fpath: this.fpath,
    //   // temp hard-coding
    //   uri: "z"
    // }
    // // try...catch block needed here
    // const meta = await hdfContentsRequest(paramsContents, this.serverSettings);
    // const nSteps = meta.contents.shape[0];
    // let steps = [];
    // for (let i = 0; i < nSteps; i++) {
    //   let step = {
    //       value: i.toString(),
    //       label: i.toString(),
    //       method: 'skip', // might actually want skip here
    //       // args: ['line.color', 'red']
    //    } as Partial<SliderStep>
    //    steps.push(step);
    // }
    // return steps;

    const paramsContents: IContentsParameters = {
      fpath: this.fpath,
      // temp hard-coding
      uri: "z"
    }
    // try...catch block needed here
    const data = await hdfDataRequest(paramsContents, this.serverSettings);
    const nSteps = data.length;
    let steps = [];
    for (let i = 0; i < nSteps; i++) {
      let step = {
          value: i.toString(),
          label: i.toString(),
          method: 'skip', // might actually want skip here
          // args: ['line.color', 'red']
       } as Partial<SliderStep>
       steps.push(step);
    }
    return steps;

  }
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
