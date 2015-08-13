
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var mapper = require('./mapper');

/**
 * Expose `Iterable`
 */

var Iterable = module.exports = integration('Iterable')
  .endpoint('https://api.iterable.com/api')
  .channels(['server', 'mobile', 'client'])
  .ensure('settings.apiKey')
  .ensure('message.userId')
  .mapToTrack(['page'])
  .mapper(mapper)
  .retries(2);

function request(path, mapperFunc){
  return function(track, fn){
    var payload = mapperFunc ? mapperFunc(track): track;
    return this
      .post(path)
      .type('json')
      .set(headers(this.settings))
      .send(payload)
      .end(this.handle(fn));
  };
}

/**
 * Track.
 *
 * https://api.iterable.com/api/docs#!/events/track_post_0
 *
 * @param {Track} track
 * @param {Function} fn
 * @api public
 */

Iterable.prototype.track = request('/events/track');

Iterable.prototype.addedProduct = request('/commerce/updateCart', mapper.addedProduct);
Iterable.prototype.removedProduct = request('/commerce/updateCart', mapper.removedProduct);

Iterable.prototype.completedOrder = request('/commerce/trackPurchase', mapper.completedOrder);

/**
 * Identify.
 *
 * https://api.iterable.com/api/docs#!/users/updateUser_post_1
 *
 * @param {Object} payload
 * @param {Function} fn
 * @api public
 */

Iterable.prototype.identify = function(payload, fn){
  return this
    .post('/users/update')
    .type('json')
    .set(headers(this.settings))
    .send(payload)
    .end(this.handle(fn));
};

/**
 * Add the headers to the request
 *
 * @param {Object} settings
 * @return {Object}
 */

function headers(settings){
  return {
    'User-Agent': 'Segment.io/1.0',
    'Api-Key': settings.apiKey
  };
}
