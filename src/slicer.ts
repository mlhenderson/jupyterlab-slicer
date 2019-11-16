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
  // hdfContentsRequest, 
  IContentsParameters 
} from './hdf';

enum Dimension {
  x = 'x',
  y = 'y',
  z = 'z'
};

interface AxisData {
  horizontal: number[];
  vertical: number[];
  normal: number[];
};

interface SlicerPlotData {
  axis: AxisData;
  slice: number[][];
}

export default class Slicer extends Widget {
  private readonly graphDiv: HTMLDivElement;
  private plot: PlotlyHTMLElement;
  private serverSettings: ServerConnection.ISettings;
  // relative filepath of the dataset that is currently displayed
  private fpath: string;
  // private uri: string;
  private horizontalAxis: Dimension;
  private verticalAxis: Dimension;
  // private normalAxis: Dimension;
  private normalAxis: Dimension;
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
    } as PlotData];

    const nSteps = data.axis.normal.length;
    const steps = this.sliderSteps(nSteps);
    // Slice index slider
    const sliders = [{
        pad: {t: 30},
        currentvalue: {
          xanchor: "right",
          prefix: `${this.normalAxis} =  ${data.axis.normal[this.sliceIndex]}`,
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
            args: ['normalAxis', Dimension.z],
            label: 'xy'
        }, {
            method: 'restyle',
            args: ['normalAxis', Dimension.y],
            label: 'xz'
        }, {
            method: 'restyle',
            args: ['normalAxis', Dimension.x],
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
      const normalAxis = data[0].normalAxis;
      if (normalAxis !== undefined) {
        this.updateNormalAxis(normalAxis);
      }
    });
  }

  private async updateSliceIndex(sliceIndex: number) {
    this.sliceIndex = sliceIndex;
    // const params: IContentsParameters = {
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

  private async updateNormalAxis(normalAxis: Dimension) {
    this.normalAxis = normalAxis;
    // this.sliceIndex = 0;
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
    // this.data = await this.getPlotData();
    // this.plotLayout.sliders[0].steps = await this.sliderSteps();
    let data = await this.getPlotData();

    const nSteps = data.axis.normal.length;
    let steps = this.sliderSteps(nSteps);

    const dataUpdate = {
      z: [data.slice],
      x: [data.axis.horizontal],
      y: [data.axis.vertical]
    }
    const layoutUpdate = {
      sliders: [{
        steps: steps
      }]
    }
    Plotly.update(this.graphDiv, dataUpdate, layoutUpdate);
  }

  private async getPlotData(): Promise<SlicerPlotData> {
    // console.log("ENTERED GETDATA");
    // const hParams: IContentsParameters = {
    //   fpath: this.fpath,
    //   uri: this.horizontalAxis,
    // }

    // const vParams: IContentsParameters = {
    //   fpath: this.fpath,
    //   uri: this.verticalAxis,
    // }

    // need a try...catch block here
    // const hData = await hdfDataRequest(hParams, this.serverSettings);
    // const vData = await hdfDataRequest(vParams, this.serverSettings);
    const axisData = await this.getAxisData();
    const sliceData = await this.getSliceData();

    // Need to transpose data if slicing through x or y dimensions

    // const data = {
    //   hData: hData,
    //   vData: vData,
    //   sliceData: sliceData
    // };
    return {
      axis: axisData,
      slice: sliceData
    } as SlicerPlotData;
  } 

  private async getAxisData(): Promise<AxisData> {
    const hParams: IContentsParameters = {
      fpath: this.fpath,
      uri: this.horizontalAxis,
    }

    const vParams: IContentsParameters = {
      fpath: this.fpath,
      uri: this.verticalAxis,
    }

    const nParams: IContentsParameters = {
      fpath: this.fpath,
      uri: this.normalAxis,
    }

    const horizontalAxisData = await hdfDataRequest(hParams, this.serverSettings);
    const verticalAxisData = await hdfDataRequest(vParams, this.serverSettings);
    const normalAxisData = await hdfDataRequest(nParams, this.serverSettings);

    return {
      horizontal: horizontalAxisData,
      vertical: verticalAxisData,
      normal: normalAxisData
    } as AxisData;
  }





  private async getSliceData(): Promise<number[][]> {
    const params: IContentsParameters = {
      fpath: this.fpath,
      uri: "model",
      select: this.selectString(this.sliceIndex)
    }
    return hdfDataRequest(params, this.serverSettings).then(sliceData => {
      if (this.normalAxis === Dimension.z) {
        return sliceData;
      }
      // Need to transpose data if slicing through x or y dimensions
      return this.transpose(sliceData);
    })
  }

  private sliderSteps(nSteps: number): Partial<SliderStep>[] {
    // const paramsContents: IContentsParameters = {
    //   fpath: this.fpath,
    //   // temp hard-coding
    //   uri: this.normalAxis
    // }
    // // try...catch block needed here
    // const meta = await hdfContentsRequest(paramsContents, this.serverSettings);
    // const nSteps = meta.content.shape[0];
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
    if (this.normalAxis === Dimension.x) {
      return `[${sliceIndex},:,:]`;
    }
    if (this.normalAxis === Dimension.y) {
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
