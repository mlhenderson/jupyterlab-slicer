import * as Plotly from "plotly.js"

import { Widget } from '@phosphor/widgets';

import { Message } from '@phosphor/messaging';

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
  RequestParameters 
} from './hdf';

const TARGET_DATASET_NAME = 'model';


export default class Slicer extends Widget {

  constructor(fpath: string) {
    super();

    console.log("Create Slicer Widget");

    this.fpath = fpath;
    this.outerGraphDiv = document.createElement('div');
    this.graphDiv = document.createElement('div');
    this.outerGraphDiv.classList.add("outerGraphDiv");
    this.graphDiv.classList.add("graphDiv");
    this.outerGraphDiv.appendChild(this.graphDiv);
    this.node.appendChild(this.outerGraphDiv);
    this.serverSettings = ServerConnection.makeSettings();
    this.sliceData = null;

    // enumerate colorscales
    this.colorScales = [];
    let c;
    for (c in this.colorScales) {
      let button = {
        args: ['visible', this.colorScales[c]],
        label: c.toString(),
        method: 'restyle',
      };
      this.colorScales.push(button);
    }

    console.log(this.colorScales);

    this.layoutBase = {
      autosize: true,
      // Dropdown buttons
      updatemenus: [{
        y: 0.8,
        yanchor: 'bottom',
        pad: {r: 60},
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
      }, {
        y: 1,
        yanchor: 'bottom',
        pad: {r: 60},
        buttons: this.colorScales
      }
      ]
    };

    this.plotNewDataset();
  }

  /*
  // TODO: determine whether or not this should be used 
  // instead of calling in constructor
  protected async onUpdateRequest(msg: Message): Promise<void> {
    super.onUpdateRequest(msg);
    console.log(["onUpdateRequest", msg, this.plot, this.fpath]);

    if (!this.plot && !this.isAttached && !this.) {
      console.log("call plotNewDataset()");
      await this.plotNewDataset();
    }
    else {
      console.log("call Plotly.update()");

      const data = await this.getPlotData();
      const dataUpdate = {
        z: [data.slice],
        x: [data.axis.horizontal],
        y: [data.axis.vertical]
      };
      const layoutUpdate = this.layoutUpdate(data);
      Plotly.update(this.graphDiv, dataUpdate, layoutUpdate);
    }
  }
  */

  protected async onUpdateRequest(msg: Message): Promise<void> {
    super.onUpdateRequest(msg);
    console.log(["onUpdateRequest", msg, this.fpath]);

    this._render_new();

    /*
    if (this.graphDiv.classList.contains('js-plotly-plot')) {
      this._render_update();
    }
    else {
      this._render_new();
    }
    */
  }

  protected async onBeforeAttach(msg: Message): Promise<void> {
    super.onBeforeAttach(msg);
    console.log(["onBeforeAttach", this.graphDiv.classList]);

    if (!this.graphDiv.classList.contains('js-plotly-plot')) {
      return;
    }

    this._render_new();
  }

  protected async onBeforeDetach(msg: Message): Promise<void> {
    super.onBeforeDetach(msg);
    console.log("onBeforeDetach");

    this.plot.removeAllListeners('plotly_sliderchange');
    this.plot.removeAllListeners('plotly_restyle');
  }

  private async _render_new(): Promise<void> {
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

    const layoutUpdate = this.layoutUpdate(data);
    const plotLayout = {
      ...this.layoutBase,
      ...layoutUpdate,
    } as Layout;

    this.plot = await Plotly.newPlot(this.graphDiv, plotData, plotLayout, {displaylogo: false, responsive: true});

    // Define behavior for sliderchange event
    this.plot.on('plotly_sliderchange', (data: any) => {
      if (this.sliderTimer) {
        clearTimeout(this.sliderTimer);
      }
      this.sliderTimer = setTimeout(() => {
        this.updateSliceIndex(data.slider.active);
      }, 25);
    });

    // Define behavior for dropdown change event
    this.plot.on('plotly_restyle', (data: any) => {
      const normalAxis = data[0].normalAxis;
      if (normalAxis !== undefined) {
        this.updateNormalAxis(normalAxis);
      }
    });

  }

  /*
  private async _render_update(): Promise<void> {
    const data = await this.getPlotData();
    const dataUpdate = {
      z: [data.slice],
      x: [data.axis.horizontal],
      y: [data.axis.vertical]
    };
    const layoutUpdate = this.layoutUpdate(data);
    Plotly.update(this.graphDiv, dataUpdate, layoutUpdate);
  }
  */

  // update the plot when a resize event happens
  protected async onResize(msg: Widget.ResizeMessage): Promise<void> {
    console.log("onResize");
    this._render_new();
  }

  public dispose(): void {
    if (this.graphDiv) {
      Plotly.purge(this.graphDiv);
    }
  }

  /*
  * Generates the default plot-view for the given
  * file: xy-plane at index 0.
  */
  private async plotNewDataset() {
    //console.log("plotNewDataset");
    this._render_new();
  }


  private async updateSliceIndex(sliceIndex: number) {
    //console.log(["updateSliceIndex", sliceIndex]);

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


  private async updateNormalAxis(normalAxis: Dimension): Promise<void> {
    //console.log(["updateNormalAxis", normalAxis]);

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


  private async getPlotData(): Promise<SlicerPlotData> {
    //console.log("getPlotData");

    const axisData = await this.getAxisData();
    const sliceData = await this.getSliceData();

    console.log(["getPlotData", axisData, sliceData]);

    return {
      axis: axisData,
      slice: sliceData
    } as SlicerPlotData;
  } 


  private async getAxisData(): Promise<SlicerAxisData> {
    //console.log("getAxisData");

    const hParams: RequestParameters = {
      fpath: this.fpath,
      uri: this.horizontalAxis,
    };

    const vParams: RequestParameters = {
      fpath: this.fpath,
      uri: this.verticalAxis,
    };

    const nParams: RequestParameters = {
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
    } as SlicerAxisData;
  }


  private async getSliceData(): Promise<number[][]> {
    //console.log(["getSliceData", this.sliceIndex]);

    const params: RequestParameters = {
      fpath: this.fpath,
      uri: TARGET_DATASET_NAME,
      select: this.selectString(this.sliceIndex)
    };
    return hdfDataRequest(params, this.serverSettings).then(sliceData => {
      if (this.normalAxis === Dimension.z) {
        return sliceData;
      }
      // Need to transpose data if slicing through x or y dimensions
      this.sliceData = this.transpose(sliceData);
      return this.transpose(this.sliceData);
    })
  }


  private layoutUpdate(data: SlicerPlotData): Partial<Layout> {
    //console.log(["layoutUpdate", data]);

    const sliders = this.sliders(data);
    return {
      title: `${this.normalAxis} = ${this.normalAxisData[this.sliceIndex]}`,
      xaxis: { title: `${this.horizontalAxis}`, automargin: true },
      yaxis: { title: `${this.verticalAxis}`, automargin: true },
      sliders: sliders,
    } as Partial<Layout>
  }


  private sliders(data: SlicerPlotData): Partial<Slider>[] {
    //console.log(["sliders", data]);

    const nSteps = data.axis.normal.length;
    let steps = [];
    for (let i = 0; i < nSteps; i++) {
      let step = {
          value: i.toString(),
          label: i.toString(),
          method: 'skip', // do not call plotly API, defer to manual event handling
       } as Partial<SliderStep>;
       steps.push(step);
    }
    const sliders = [{
        pad: {t: 60},
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
     }] as Partial<Slider>[];
    return sliders;
  }


  private selectString(sliceIndex: number): string {
    //console.log(["selectString", sliceIndex]);

    if (this.normalAxis === Dimension.x) {
      return `[${sliceIndex},:,:]`;
    }
    if (this.normalAxis === Dimension.y) {
      return `[:,${sliceIndex},:]`;
    }
    return `[:,:,${sliceIndex}]`;    
  }


  private transpose(data: number[][]): number[][] {
    //console.log("transpose");

    return data[0].map((_, i: number) => data.map((row: number[]) => row[i]));
  }

  private layoutBase: Partial<Layout>;
  private readonly outerGraphDiv: HTMLDivElement;
  private readonly graphDiv: HTMLDivElement;
  private plot: PlotlyHTMLElement;
  private serverSettings: ServerConnection.ISettings;
  private fpath: string;
  private horizontalAxis: Dimension;
  private verticalAxis: Dimension;
  private normalAxis: Dimension;
  private sliceIndex: number;
  private sliceData: number[][];
  private normalAxisData: number[];
  private sliderTimer: ReturnType<typeof setTimeout>;
  private colorScales: object[];

}

enum Dimension {
  x = 'x',
  y = 'y',
  z = 'z'
}

interface SlicerAxisData {
  horizontal: number[];
  vertical: number[];
  normal: number[];
}

interface SlicerPlotData {
  axis: SlicerAxisData;
  slice: number[][];
}
