const MongoClient = require('mongodb').MongoClient;
const { map, parallel } = require('async');
const options = require('./options');
let dataBase;

MongoClient.connect(options.mongoDBUrl, (err, db) => {
  if (err) { console.log(err); } else {
    dataBase = db;
    console.log('connect to DB success');
  }
  //db.close();
});

module.exports.getStatus = (devid, callback) => {
  parallel({
    lastEvent: (cb) => {
      dataBase.collection('events').findOne(
        {
          devid,
          event: { $in: ['wakeup', 'sleep'] },
        },
        { '_id': false },
        { 'sort': [['recDate', 'desc']] },
        cb
      );
    },
    lastHB: (cb) => {
      dataBase.collection('heartbeats').findOne(
        { devid },
        { '_id': false },
        { 'sort': [['recDate', 'desc']] },
        cb
      )
    }
  }, (err, res) => {
    let state = null;
    if (res.lastEvent && res.lastHB) {
      state = { up: null, charge: res.lastHB.charge }
      if (new Date() - new Date(res.lastHB.recDate) < 50000) {
        if ((res.lastHB.component === "rpi") && (res.lastEvent.event === "wakeup")) {
          state.up = true;
        } else if ((res.lastHB.component === "ard") && (res.lastEvent.event === "sleep")) {
          state.up = false;
        }
      }
    } else { err = new Error(`no info about state ${devid}`); }
    callback(err, state);
  });
}

module.exports.getAllStatus = (callback) => {
  dataBase.collection('devs').find(
    { 'order': { $gt: 0 } },
    { '_id': false, 'order': false },
    { 'sort': 'order' }
  ).toArray((err, devs) => {
    if (err) { callback(err); } else {
      map(devs, (dev, cb) => {
        module.exports.getStatus(dev.devid, (err, state) => {
          cb(err, Object.assign({}, state, dev));
        });
      }, callback);//[ { up: true, charge: 0.5, devid: 1, label: '123' }, { up: null, charge: 0.3, devid: 2, label: '124' } ]
    }
  });
}

module.exports.addWebHook = (data) => {
  //console.log(data);
  dataBase.collection('webhook').insertOne(data);
}
