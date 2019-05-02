import { Chatty } from "@looker/chatty"
import CodeMirror from "codemirror"
const QueryResponse = require('../data/query_responses/2_dim_1_meas.json')
// import Split from 'split-grid'
import '../node_modules/codemirror/mode/javascript/javascript.js'

// Example Data and Visualizations
const TestData = require('../data/raw_data/2_dim_1_meas.json')
const TestJS = require('../examples/liquid_fill_gauge.txt')
const DEPS = [
  "https://code.jquery.com/jquery-2.2.4.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.9.1/underscore-min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.min.js"
]

var visCodeMirror = CodeMirror(document.getElementById("visEditor"), {
  value: TestJS.default,
  mode:  "javascript",
  tabSize: 2,
  lineNumbers: true
});

var queryCodeMirror = CodeMirror(document.getElementById("queryResponseEditor"), {
  value: JSON.stringify(QueryResponse, null, 4),
  mode:  "javascript",
  tabSize: 2,
  lineNumbers: true
});

var dataCodeMirror = CodeMirror(document.getElementById("dataEditor"), {
  value: JSON.stringify(TestData, null, 4),
  mode:  "javascript",
  tabSize: 2,
  lineNumbers: true
});

var depsCodeMirror = CodeMirror(document.getElementById("depsEditor"), {
  value: JSON.stringify(DEPS, null, 4),
  mode:  "javascript",
  tabSize: 2,
  lineNumbers: true
});

const visEl = document.getElementById('visWrapper')

const chatter = Chatty.createHost(`/visualization`)
  .appendTo(visEl)
  .build()
  .connect()

chatter.then((host: any) => {
  host.send('Create', null , {})
  host.send('UpdateAsync', TestData, null, {}, QueryResponse, '')
}).catch(console.error)

document.getElementById("run-button").addEventListener("click", function(this: HTMLInputElement) {
  this.disabled = true

  const options = {
    data: dataCodeMirror.getValue(),
    js: visCodeMirror.getValue(),
    query: queryCodeMirror.getValue(),
    deps: JSON.parse(depsCodeMirror.getValue())
  }

  let config = {}
  let myHost = null

  const request = new Request('/visualization/update', {method: 'POST', body: JSON.stringify(options)});

  fetch(request).then((response: any) => {
    visEl.innerHTML = '<h4>Rendered Visualization</h4>'
    Chatty.createHost(`/visualization`)
      .on('Create', (config) => {
        config = config

        if (!myHost) return

        myHost.send('UpdateAsync', JSON.parse(options.data), null, config, JSON.parse(options.query), '')
      })
      .appendTo(visEl)
      .build()
      .connect().then((host: any) => {
        myHost = host
        myHost.send('Create', null , config)
      }).catch(console.error)

    this.disabled = false
  })
})
