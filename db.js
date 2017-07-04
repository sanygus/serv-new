const MongoClient = require('mongodb').MongoClient;
const map = require('async/map');
const parallel = require('async/parallel');
const options = require('./options');

MongoClient.connect(options.mongoDBUrl, (err, db) => {
  if (err) {
    console.log(err);
  } else {
    dataBase = db;
    console.log('connect to DB success');
  }
  //db.close();
});

module.exports.getStatus = (iddev, callback) => {
  dataBase.collection('events').find(
    {
      iddev,
      event: { $in: ['wakeup', 'sleep'] },
    },
    { '_id': false },
    {
      'limit': 1,
      'sort': [['date', 'desc']]
    }
  ).toArray((err, lastStat) => {
    if (err) { callback(err); } else {
      if (lastStat.length === 1) {
        callback(null, lastStat.slice()[0]);
      } else {
        callback(new Error('No info about device'));
      }
    }
  });
}

module.exports.getAllStatus = (callback) => {
  dataBase.collection('devs').find({}, { '_id': false }, { 'sort': 'order' }).toArray((err, devs) => {
    if (err) { callback(err); } else {
      map(
        devs,
        (devObj, callback) => {
          parallel({
            charge: (callbackP) => {
              dataBase.collection('sensors').find(
                { 'iddev': devObj['iddev'] },
                { '_id': false },
                {
                  'limit': 1,
                  'sort': [['date', 'desc']]
                }
              ).toArray((err, lastDocs) => {
                if (err) { callbackP(err); } else {
                  if (lastDocs.length <= 1) {
                    let result = null;
                    if (lastDocs.length === 1) {
                      result = lastDocs.slice()[0];
                      delete result['iddev'];
                    }
                    callbackP(null, result.charge);
                  } else {
                    callbackP(new Error('more 1 records on limit'));
                  }
                }
              });
            },
            status: (callbackP) => {
              const search = {};// search by type/event
              search['iddev'] = devObj['iddev'];
              search.event = { $in: ['wakeup', 'sleep'] };
              dataBase.collection('events').find(
                search,
                { '_id': false },
                {
                  'limit': 1,
                  'sort': [['date', 'desc']]
                }
              ).toArray((err, lastStat) => {
                if (err) { callbackP(err); } else {
                  if (lastStat.length <=1) {
                    let result = null;
                    if (lastStat.length === 1) {
                      result = lastStat.slice()[0];
                      delete result['iddev'];
                    }
                    callbackP(null, result);
                  } else {
                    callbackP(new Error('more 1 stat records on limit'));
                  }
                }
              });
            },
            warn: (callbackP) => {
              const search = {};// search by type/event
              search['iddev'] = devObj['iddev'];
              search.event = 'warn';
              dataBase.collection('events').find(
                search,
                { '_id': false },
                {
                  'limit': 1,
                  'sort': [['date', 'desc']]
                }
              ).toArray((err, lastStat) => {
                if (err) { callbackP(err); } else {
                  if (lastStat.length <=1) {
                    let result = null;
                    if (lastStat.length === 1) {
                      result = lastStat.slice()[0];
                      delete result['iddev'];
                    }
                    callbackP(null, result);
                  } else {
                    callbackP(new Error('more 1 stat warn records on limit'));
                  }
                }
              });
            },
          }, (err, resultPar) => {
            resultPar.location = devObj.location;
            resultPar.iddev = devObj.iddev;
            callback(err, resultPar);
          });
        },
        callback
      );
    }
  });
}
