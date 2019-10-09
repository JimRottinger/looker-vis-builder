const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const fs = require('fs');
const bodyParser = require('body-parser')

let DEPS = [
  "https://code.jquery.com/jquery-2.2.4.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.9.1/underscore-min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/d3/4.13.0/d3.js"
]
let JS_Script = fs.readFileSync('examples/text.txt');

/** CONFIG **/
app.use(express.static(__dirname));
app.use(bodyParser.json())
app.set('view engine', 'pug');

/** STARTUP **/
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});

/** ROUTES **/
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
});

router.get('/visualization', (req, res) => {
  res.render('vis', {
    dependencies: DEPS
  })
});

router.get('/visualization/get_js', (req, res) => {
  res.setHeader('content-type', 'text/javascript');
  res.end(JS_Script);
})

router.post('/visualization/update', (req, res) => {
  JS_Script = req.body.js;
  DEPS = req.body.deps
  res.end('true')
})

app.use('/', router);