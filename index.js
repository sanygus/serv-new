const app = require('express')();
const request = require('request');
const options = require('./options');
const db = require('./db');

app.get('/state', (req, res) => {
  db.getAllStatus((err, result) => {
    if (err) {
      res.type('application/json').status(503).send({ok: false, error: {code: 503, text: err.message}});
    } else {
      res.type('application/json').status(200).send(result);
    }
  });
});

app.get('/:id/wakeup', (req, res) => {
  if (options.devsIP[req.params.id] !== undefined) {
    request
      .get(`http://geoworks.pro:1234/watch?action=set&iddev=${req.params.id}&status=1`)
      .on('error', (/*errorGet*/) => {
        res.type('application/json').status(504).send({ok: false, error: {code: 504, text: 'Server not available'}});
      })
      .on('response', (respServ) => {
        respServ.on('data', (dataServ) => {
          try {
            if (JSON.parse(dataServ).status === "ok") {
              res.type('application/json').status(200).send({ok: true});
            } else {
              res.type('application/json').status(503).send({ok: false});
            }
          } catch(e) {
            res.type('application/json').status(503).send({ok: false});
          }
        });
      })
  } else {
    res.type('application/json').status(503).send({ok: false, error: {code: 503, text: 'Device is not registered'}});
  }
});

app.get('/:id/*', (req, res) => {
  if (options.devsIP[req.params.id] !== undefined) {
    db.getStatus(parseInt(req.params.id), (err, state) => {
      if (err) {
        res.type('application/json').status(503).send({ok: false, error: {code: 503, text: err.message}});
      } else if (state) {
        if ((state.event !== undefined) && (state.event === 'wakeup')) {
          const devReq = req.originalUrl.replace(`/${req.params.id}`, '');
          console.log(devReq);
          request
            .get(`http://${options.devsIP[req.params.id]}:3000${devReq}`)
            .on('error', (/*errorGet*/) => {
              res.type('application/json').status(504).send({ok: false, error: {code: 504, text: 'Device not available'}});
            })
            .pipe(res);
        } else if ((state.event !== undefined) && (state.event === 'sleep')) {
          res.type('application/json').status(303).send({ok: false, error: {code: 303, text: 'Device is sleeping', date: state.date, time: state.time}});
        } else {
          res.type('application/json').status(503).send({ok: false, error: {code: 503, text: 'Uncertain state for device'}});
        }
      } else {
        res.type('application/json').status(503).send({ok: false, error: {code: 503, text: 'No state for device'}});
      }
    });
  } else {
    res.type('application/json').status(503).send({ok: false, error: {code: 503, text: 'Device is not registered'}});
  }
});

app.get('/webhook/:devid/:event', (req, res) => {
  const { url } = req.query;
  if (url) {
    req.params.devid = parseInt(req.params.devid);
    db.addWebHook(Object.assign({}, { url }, req.params));
    res.type('application/json').status(200).send({ok: true});
  } else {
    res.type('application/json').status(400).send({ok: false});
  }
});

app.get('/', (req, res) => {
  res.type('text/html').status(200).send("\
    Avalable functions:<ul>\
      <li>GET /state</li>\
      <li>GET /[id]/wakeup</li>\
      <li>GET /[id]/[devfunc]</li>\
    </ul>\
    <a href=\"https://github.com/sanygus/serv-new/blob/master/README.md\">Full documentation</a>\
  ");
});

app.listen(options.httpPort);