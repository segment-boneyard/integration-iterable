/**
 * Module dependencies.
 */

var unixTime = require('unix-time');
var objCase = require('obj-case');

/**
 * Map `track`.
 *
 * @param {Track} track
 * @return {Object}
 * @api private
 */

exports.track = function(track){
  var props = track.properties();
  if (track.revenue()) {
    props.amount = track.revenue();
    objCase.del(props, 'revenue');
  }

  return {
    email: track.email(),
    eventName: track.event(),
    createdAt: unixTime(track.timestamp()),
    dataFields: props
  };
};

/**
 * Map `identify`.
 *
 * @param {Identify} track
 * @return {Object}
 * @api private
 */

exports.identify = function(identify){
  var traits = identify.traits();
  var created = identify.created();
  if (created) traits.met = created.toISOString();
  return {
    email: identify.email(),
    dataFields: traits
  };
};
