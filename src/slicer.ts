import * as Plotly from "plotly.js"

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
  private sliceDim: Dimension;
  private sliceIndex: number;
  private data: PlotData[];
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
    } as Layout;

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
    this.sliceDim = Dimension.z;

    // const hParams: IContentsParameters = {
    //   fpath: this.fpath,
    //   uri: this.hAxis,
    // }

    // const vParams: IContentsParameters = {
    //   fpath: this.fpath,
    //   uri: this.vAxis,
    // }

    // const dataParams: IContentsParameters = {
    //   fpath: this.fpath,
    //   uri: "model",
    //   select: this.selectString(0)
    // }

    // // need a try...catch block here
    // const hData = await hdfDataRequest(hParams, this.serverSettings);
    // const vData = await hdfDataRequest(vParams, this.serverSettings);
    // const targetData = await hdfDataRequest(dataParams, this.serverSettings);

    // this.data = [{
    //   z: targetData,
    //   x: hData,
    //   y: vData,
    //   type: 'heatmap',
    //   colorscale: 'Viridis'
    // } as PlotData];

    let data = await this.getPlotData();
    let plotData = [{
      z: data.data.targetData,
      x: data.hData,
      y: data.vData,
      type: 'heatmap',
      colorscale: 'Viridis'
    } as PlotData];

    const steps = await this.getSliderSteps();
    const sliders = [{
        pad: {t: 30},
        currentvalue: {
          xanchor: "right",
          prefix: `${this.sliceDim}-index: `,
          font: {
            color: '#888',
            size: 20
          }
        },
        steps: steps,
     }] as Partial<Slider>[]

    const updatemenus = [{
        y: 0.8,
        yanchor: 'top',
        buttons: [{
            method: 'restyle',
            args: ['sliceDim', Dimension.z],
            label: 'xy'
        }, {
            method: 'restyle',
            args: ['sliceDim', Dimension.y],
            label: 'xz'
        }, {
            method: 'restyle',
            args: ['sliceDim', Dimension.x],
            label: 'yz'
        }]
    }];

    this.plotLayout.sliders = sliders;
    this.plotLayout.updatemenus = updatemenus;

    this.plot = await Plotly.newPlot(this.graphDiv, this.data, this.plotLayout);

    // Define behavior for sliderchange event
    this.plot.on('plotly_sliderchange', (data: any) => {
      this.updateSliceIndex(data.slider.active);
    });

    // Define behavior for dropdown change event
    this.plot.on('plotly_restyle', (data: any) => {
      if ('sliceDim' in data) {
        this.updateSliceDimension(data.sliceDim);
      }
    });
  }

  private async updateSliceIndex(sliceIndex: number) {
    this.sliceIndex = sliceIndex;
    const dataParams: IContentsParameters = {
      fpath: this.fpath,
      uri: "model",
      select: this.selectString(sliceIndex)
    }
    const targetData = await hdfDataRequest(dataParams, this.serverSettings);
    const update = {
      z: [targetData] // The data array we want to update must be wrapped in an outer array
    };
    Plotly.restyle(this.graphDiv, update);
  }

  private async updateSliceDimension(sliceDim: Dimension) {
    this.sliceDim = sliceDim;
    this.sliceIndex = 0;
    // Display yz plane
    if (sliceDim == Dimension.x) {
      this.hAxis = Dimension.y;
      this.vAxis = Dimension.z;
    }
    // Display xz plane
    else if (sliceDim == Dimension.y) {
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
      z: [data[0].z],
      x: [data[0].x],
      y: [data[0].y]
    }
    const layoutUpdate = {
      sliders: [{
        steps: steps
      }]
    }
    Plotly.update(this.graphDiv, dataUpdate, layoutUpdate);
  }

  private async getPlotData(): Promise<Partial<PlotData>[]> {
    const hParams: IContentsParameters = {
      fpath: this.fpath,
      uri: this.hAxis,
    }

    const vParams: IContentsParameters = {
      fpath: this.fpath,
      uri: this.vAxis,
    }

    const dataParams: IContentsParameters = {
      fpath: this.fpath,
      uri: "model",
      select: this.selectString(0)
    }

    // need a try...catch block here
    const hData = await hdfDataRequest(hParams, this.serverSettings);
    const vData = await hdfDataRequest(vParams, this.serverSettings);
    const targetData = await hdfDataRequest(dataParams, this.serverSettings);

    const data = {
      hData: hData,
      vData: vData,
      targetData: targetData,
    };
    return data;
  }

  private async getSliderSteps() {
    const paramsContents: IContentsParameters = {
      fpath: this.fpath,
      // temp hard-coding
      uri: this.sliceDim
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

  private selectString(sliceIndex: number) {
    if (this.sliceDim == Dimension.x) {
      return `[${sliceIndex},:,:]`
    }
    if (this.sliceDim == Dimension.y) {
      return `[:,${sliceIndex},:]`
    }
    if (this.sliceDim == Dimension.z) {
      return `[:,:,${sliceIndex}]`
    }    
  }
}
