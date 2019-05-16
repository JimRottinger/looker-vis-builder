import { Chatty } from '@looker/chatty'
import 'bootstrap/dist/css/bootstrap.css'
import codemirror from 'codemirror'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/theme/darcula.css'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

// Example Data and Visualizations
const queryResponse = require('../data/query_responses/2_dim_1_meas.json')
const testData = require('../data/raw_data/2_dim_1_meas.json')
const testJS = require('../examples/text.txt')
const DEPS = [
  'https://code.jquery.com/jquery-2.2.4.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.9.1/underscore-min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/d3/4.13.0/d3.js',
]
class LookerVisBuilder extends React.Component {
  render() {
    return (
      <div>
        <div id="top-bar">
          <h2>Looker Custom Visualization Builder</h2>
          <div id="control-panel">
            <button id="run-button">Run</button>
          </div>
        </div>

        <div class="grid">
          <div class="grid-element column-1 row-1" id="visEditorWrapper">
            <h4>Visualization JS</h4>
            <div id="visEditor" class="editor" />
          </div>
          <div class="grid-element column-3 row-1" id="queryEditorWrapper">
            <h4>Query Response</h4>
            <div id="queryResponseEditor" class="editor" />
          </div>
          <div class="grid-element column-1 row-3" id="dataEditorWrapper">
            <h4>Raw Data</h4>
            <div id="dataEditor" class="editor" />
          </div>
          <div class="grid-element column-1 row-3" id="depsEditorWrapper">
            <h4>Dependencies (Comma Separated)</h4>
            <div id="depsEditor" class="editor" />
          </div>
          <div class="grid-element column-3 row-5" id="visWrapper">
            <h4>Rendered Visualization</h4>
          </div>
        </div>
      </div>
    )
  }
}

ReactDOM.render(<LookerVisBuilder />, document.getElementById('react-root'))

const visCodeMirror = codemirror(document.getElementById('visEditor'), {
  value: testJS.default,
  mode: 'javascript',
  theme: 'darcula',
  tabSize: 2,
  lineNumbers: true,
})

const queryCodeMirror = codemirror(
  document.getElementById('queryResponseEditor'),
  {
    value: JSON.stringify(queryResponse, null, 4),
    mode: 'javascript',
    theme: 'darcula',
    tabSize: 2,
    lineNumbers: true,
  }
)

const dataCodeMirror = codemirror(document.getElementById('dataEditor'), {
  value: JSON.stringify(testData, null, 4),
  mode: 'javascript',
  theme: 'darcula',
  tabSize: 2,
  lineNumbers: true,
})

const depsCodeMirror = codemirror(document.getElementById('depsEditor'), {
  value: JSON.stringify(DEPS, null, 4),
  mode: 'javascript',
  theme: 'darcula',
  tabSize: 2,
  lineNumbers: true,
})

const visEl = document.getElementById('visWrapper')

const chatter = Chatty.createHost(`/visualization`)
  .appendTo(visEl)
  .build()
  .connect()

chatter
  .then((host: any) => {
    host.send('Create', null, {})
    host.send('UpdateAsync', testData, null, {}, queryResponse, '')
  })
  .catch(console.error)

document
  .getElementById('run-button')
  .addEventListener('click', function(this: HTMLInputElement) {
    this.disabled = true

    const options = {
      data: dataCodeMirror.getValue(),
      js: visCodeMirror.getValue(),
      query: queryCodeMirror.getValue(),
      deps: JSON.parse(depsCodeMirror.getValue()),
    }

    let config = {}
    let myHost = null

    const request = new Request('/visualization/update', {
      method: 'POST',
      body: JSON.stringify(options),
    })

    fetch(request).then((response: any) => {
      visEl.innerHTML = '<h4>Rendered Visualization</h4>'
      Chatty.createHost(`/visualization`)
        .on('Create', newConfig => {
          config = newConfig

          if (!myHost) return

          myHost.send(
            'UpdateAsync',
            JSON.parse(options.data),
            null,
            config,
            JSON.parse(options.query),
            ''
          )
        })
        .appendTo(visEl)
        .build()
        .connect()
        .then((host: any) => {
          myHost = host
          myHost.send('Create', null, config)
          myHost.send(
            'UpdateAsync',
            JSON.parse(options.data),
            null,
            config,
            JSON.parse(options.query),
            ''
          )
        })
        .catch(console.error)

      this.disabled = false
    })
  })
