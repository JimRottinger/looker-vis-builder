import { Chatty } from "@looker/chatty"
import CodeMirror from "codemirror"
const QueryResponse = require('../data/query_responses/2_dim_1_meas.json')
import Split from 'split-grid'
import '../node_modules/codemirror/mode/javascript/javascript.js'

// Example Data and Visualizations
const TestData = require('../data/raw_data/2_dim_1_meas.json')
const TestJS = require('../examples/text.txt')

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

Split({ // gutters specified in options
  columnGutters: [{
      track: 1,
      element: document.querySelector('.column-1'),
  }, {
      track: 3,
      element: document.querySelector('.column-3'),
  }],
  rowGutters: [{
      track: 1,
      element: document.querySelector('.row-1'),
  }, {
    track: 3,
      element: document.querySelector('.row-3')
  }]
})

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
  }

  const request = new Request('/visualization/update', {method: 'POST', body: JSON.stringify(options)});

  fetch(request).then((response: any) => {
    visEl.innerHTML = '<h4>Rendered Visualization</h4>'
    Chatty.createHost(`/visualization`)
    .appendTo(visEl)
    .build()
    .connect().then((host: any) => {
      host.send('Create', null , {})
      host.send('UpdateAsync', JSON.parse(options.data), null, {}, JSON.parse(options.query), '')
    }).catch(console.error)

    this.disabled = false
  })
})
