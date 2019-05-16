import { Chatty } from '@looker/chatty'
import codemirror from 'codemirror'
import 'codemirror/mode/javascript/javascript'

// Example Data and Visualizations
const queryResponse = require('../data/query_responses/2_dim_1_meas.json')
const testData = require('../data/raw_data/2_dim_1_meas.json')
const testJS = require('../examples/text.txt')
const DEPS = [
  'https://code.jquery.com/jquery-2.2.4.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.9.1/underscore-min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/d3/4.13.0/d3.js',
]

const visCodeMirror = codemirror(document.getElementById('visEditor'), {
  value: testJS.default,
  mode: 'javascript',
  tabSize: 2,
  lineNumbers: true,
})

const queryCodeMirror = codemirror(
  document.getElementById('queryResponseEditor'),
  {
    value: JSON.stringify(queryResponse, null, 4),
    mode: 'javascript',
    tabSize: 2,
    lineNumbers: true,
  }
)

const dataCodeMirror = codemirror(document.getElementById('dataEditor'), {
  value: JSON.stringify(testData, null, 4),
  mode: 'javascript',
  tabSize: 2,
  lineNumbers: true,
})

const depsCodeMirror = codemirror(document.getElementById('depsEditor'), {
  value: JSON.stringify(DEPS, null, 4),
  mode: 'javascript',
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
