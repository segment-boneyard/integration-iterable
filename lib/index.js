
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

/**
 * Identify.
 *
 * https://api.iterable.com/api/docs#!/users/updateUser_post_1
 *
 * @param {Object} payload
 * @param {Function} fn
 * @api public
 */

Iterable.prototype.identify = function(identify, fn){
  return this
    .post('/users/update')
    .type('json')
    .set(headers(this.settings))
    .send(identify)
    .end(this.handle(fn));
};

/**
 * Track.
 *
 * https://api.iterable.com/api/docs#!/events/track_post_0
 *
 * @param {Track} track
 * @param {Function} fn
 * @api public
 */

Iterable.prototype.track = function(track, fn) {
  return this
    .post('/events/track')
    .type('json')
    .set(headers(this.settings))
    .send(track)
    .end(this.handle(fn));
}

/**
 * Added/Removed Product.
 *
 * Regular track call, unless properties.products is present
 *
 * @param {Track} track
 * @param {Function} fn
 * @api public
 */

Iterable.prototype.addedProduct =
Iterable.prototype.removedProduct = function(track, fn) {
  if (!track.products().length) {
    return this
      .post('/events/track')
      .type('json')
      .set(headers(this.settings))
      .send(mapper.track(track))
      .end(this.handle(fn));
  } else {
    return this
      .post('/commerce/updateCart')
      .type('json')
      .set(headers(this.settings))
      .send(mapper.addedProduct(track))
      .end(this.handle(fn));
  }
};

/**
 * Completed Order.
 *
 * https://api.iterable.com/api/docs#!/events/track_post_0
 *
 * @param {Track} track
 * @param {Function} fn
 * @api public
 */

Iterable.prototype.completedOrder = function(track, fn) {
  return this
    .post('/commerce/trackPurchase')
    .type('json')
    .set(headers(this.settings))
    .send(mapper.completedOrder(track))
    .end(this.handle(fn));
};


function headers(settings) {
  return {
    'User-Agent': 'Segment.io/1.0',
    'Api-Key': settings.apiKey
  };
}
