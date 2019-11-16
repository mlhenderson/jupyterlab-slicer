import * as Plotly from "plotly.js"
// import * as JSON5 from "json5"

import {
  Widget
} from '@phosphor/widgets';

import { ServerConnection } from "@jupyterlab/services";

import { 
  PlotlyHTMLElement,
  Layout, 
  PlotData, 
  SliderStep, 
  Slider 
} from 'plotly.js';

import { 
  hdfDataRequest, 
  hdfContentsRequest, 
  IContentsParameters 
} from './hdf';

enum Dimension {
  x = 'x',
  y = 'y',
  z = 'z'
};

export default class Slicer extends Widget {
  private readonly graphDiv: HTMLDivElement;
  private plot: PlotlyHTMLElement;
  private serverSettings: ServerConnection.ISettings;
  // relative filepath of the dataset that is currently displayed
  private fpath: string;
  // private uri: string;
  private hAxis: Dimension;
  private vAxis: Dimension;
  // private sliceAxis: Dimension;
  private sliceAxis: Dimension;
  private sliceIndex: number;
  // private data: PlotData[];
  // private plotLayout: Layout;
  

  constructor() {
    super();

    this.graphDiv = document.createElement('div');
    this.node.appendChild(this.graphDiv);

    this.serverSettings = ServerConnection.makeSettings();

    // this.plotLayout = {
    //   width: 700,
    //   height: 700,
    //   xaxis: { title: 'x' },
    //   yaxis: { title: 'y' },
    // } as Layout;

    // temporary hard coding
    const fpath = 'datasets/laguna_del_maule_miller.h5';
    // end temporary

    this.plotNewDataset(fpath);
    }

  /*
  * Generates the default plot-view for the given
  * file: xy-plane at index 0.
  */
  private async plotNewDataset(fpath: string) {
    this.fpath = fpath;
    // Initialize defaults
    this.hAxis = Dimension.x;
    this.vAxis = Dimension.y;
    this.sliceAxis = Dimension.z;
    this.sliceIndex = 0;

    let data = await this.getPlotData();
    const plotData = [{
      z: data.sliceData,
      x: data.hData,
      y: data.vData,
      type: 'heatmap',
      colorscale: 'Viridis'
    } as PlotData];

    const steps = await this.getSliderSteps();
    // Slice index slider
    const sliders = [{
        pad: {t: 30},
        currentvalue: {
          xanchor: "right",
          prefix: `${this.sliceAxis}-index: `,
          font: {
            color: '#888',
            size: 20
          }
        },
        steps: steps,
     }] as Partial<Slider>[]

    // Dropdown buttons
    const updatemenus = [{
        y: 0.8,
        yanchor: 'top',
        buttons: [{
            method: 'restyle',
            args: ['sliceAxis', Dimension.z],
            label: 'xy'
        }, {
            method: 'restyle',
            args: ['sliceAxis', Dimension.y],
            label: 'xz'
        }, {
            method: 'restyle',
            args: ['sliceAxis', Dimension.x],
            label: 'yz'
        }]
    }];

    const plotLayout = {
      width: 700,
      height: 700,
      xaxis: { title: 'x' },
      yaxis: { title: 'y' },
      // sliders: sliders,
      // updatemenus: updatemenus
    } as Layout;

    plotLayout.sliders = sliders;
    plotLayout.updatemenus = updatemenus;

    // this.plotLayout.sliders = sliders;
    // this.plotLayout.updatemenus = updatemenus;

    this.plot = await Plotly.newPlot(this.graphDiv, plotData, plotLayout);

    // Define behavior for sliderchange event
    this.plot.on('plotly_sliderchange', (data: any) => {
      this.updateSliceIndex(data.slider.active);
    });

    // Define behavior for dropdown change event
    this.plot.on('plotly_restyle', (data: any) => {
      const sliceAxis = data[0].sliceAxis;
      if (sliceAxis !== undefined) {
        this.updatesliceAxisension(sliceAxis);
      }
    });
  }

  private async updateSliceIndex(sliceIndex: number) {
    this.sliceIndex = sliceIndex;
    // const dataParams: IContentsParameters = {
    //   fpath: this.fpath,
    //   uri: "model",
    //   select: this.selectString(sliceIndex)
    // }
    const sliceData = await this.getSliceData();
    const update = {
      z: [sliceData] // The data array we want to update must be wrapped in an outer array
    };
    Plotly.restyle(this.graphDiv, update);
  }

  private async updatesliceAxisension(sliceAxis: Dimension) {
    this.sliceAxis = sliceAxis;
    // this.sliceIndex = 0;
    // Display yz plane
    if (sliceAxis === Dimension.x) {
      this.hAxis = Dimension.y;
      this.vAxis = Dimension.z;
    }
    // Display xz plane
    else if (sliceAxis === Dimension.y) {
      this.hAxis = Dimension.x;
      this.vAxis = Dimension.z;
    }
    // Display xy plane
    else {
      this.hAxis = Dimension.x;
      this.vAxis = Dimension.y;
    }
    // this.data = await this.getPlotData();
    // this.plotLayout.sliders[0].steps = await this.getSliderSteps();
    let data = await this.getPlotData();
    let steps = await this.getSliderSteps();

    const dataUpdate = {
      z: [data.sliceData],
      x: [data.hData],
      y: [data.vData]
    }
    const layoutUpdate = {
      sliders: [{
        steps: steps
      }]
    }
    Plotly.update(this.graphDiv, dataUpdate, layoutUpdate);
  }

  private async getPlotData(): Promise<any> {
    console.log("ENTERED GETDATA");
    const hParams: IContentsParameters = {
      fpath: this.fpath,
      uri: this.hAxis,
    }

    const vParams: IContentsParameters = {
      fpath: this.fpath,
      uri: this.vAxis,
    }

    // need a try...catch block here
    const hData = await hdfDataRequest(hParams, this.serverSettings);
    const vData = await hdfDataRequest(vParams, this.serverSettings);
    const sliceData = await this.getSliceData();

    // Need to transpose data if slicing through x or y dimensions

    const data = {
      hData: hData,
      vData: vData,
      sliceData: sliceData
    };
    return data;
  }

  private async getAxisData(): Promise<object> {
    const hParams: IContentsParameters = {
      fpath: this.fpath,
      uri: this.hAxis,
    }

    const vParams: IContentsParameters = {
      fpath: this.fpath,
      uri: this.vAxis,
    }

    const sliceParams: IContentsParameters = {
      fpath: this.fpath,
      uri: this.sliceAxis,
    }

    const hAxisData = await hdfDataRequest(hParams, this.serverSettings);
    const vAxisData = await hdfDataRequest(vParams, this.serverSettings);
    const sliceAxisData = await hdfDataRequest(sliceParams, this.serverSettings);
  }



  private async getSliceData(): Promise<number[][]> {
    const dataParams: IContentsParameters = {
      fpath: this.fpath,
      uri: "model",
      select: this.selectString(this.sliceIndex)
    }
    return hdfDataRequest(dataParams, this.serverSettings).then(sliceData => {
      if (this.sliceAxis === Dimension.z) {
        return sliceData;
      }
      // Need to transpose data if slicing through x or y dimensions
      return this.transpose(sliceData);
    })
  }

  private async getSliderSteps() {
    const paramsContents: IContentsParameters = {
      fpath: this.fpath,
      // temp hard-coding
      uri: this.sliceAxis
    }
    // try...catch block needed here
    const meta = await hdfContentsRequest(paramsContents, this.serverSettings);
    const nSteps = meta.content.shape[0];
    let steps = [];
    for (let i = 0; i < nSteps; i++) {
      let step = {
          value: i.toString(),
          label: i.toString(),
          method: 'skip',
       } as Partial<SliderStep>
       steps.push(step);
    }
    return steps;
  }

  private selectString(sliceIndex: number): string {
    if (this.sliceAxis === Dimension.x) {
      return `[${sliceIndex},:,:]`;
    }
    if (this.sliceAxis === Dimension.y) {
      return `[:,${sliceIndex},:]`;
    }
    return `[:,:,${sliceIndex}]`;    
  }

  // private transpose(data: number[][]) {

  // }

private transpose = (m: any) => m[0].map((x: any,i: any) => m.map((x: any) => x[i]))
  // private sliders(): Partial<Slider>[] {
  //   return undefined;
  // }
}
