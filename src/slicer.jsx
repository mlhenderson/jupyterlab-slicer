import * as React from "react";
import * as Plotly from "plotly.js"
import Plot from "react-plotly.js"
import { ReactWidget } from "@jupyterlab/apputils";


export default class Slicer extends ReactWidget {
    // render() {
    //     return(
    //         <div> Hello World </div>
    //     );
    // }
  render() {
    return(
        <Plot
            data={[
                {
                    x: [1, 2, 3],
                    y: [2, 6, 3],
                    type: 'scatter',
                    marker: {color: 'red'},
                },
                {type: 'bar', x: [1, 2, 3], y: [2, 5, 3]},
            ]}
            layout={ {width: 320, height: 240, title: 'A Fancy Plot'} }
        />
    );
}
}


// try with react plotly, if it doesn't work, try with plain plotly

// can also probably just make this a .jsx file?