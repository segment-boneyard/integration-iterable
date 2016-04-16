'use strict';

/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var type = require('type-component');
var mapper = require('./mapper');
var get = require('obj-case');

/**
 * Expose `Iterable`
 */

var Iterable = module.exports = integration('Iterable')
  .endpoint('https://api.iterable.com/api')
  .channels(['server', 'mobile', 'client'])
  .ensure('settings.apiKey')
  .mapToTrack(['page'])
  .mapper(mapper)
  .retries(2);

/**
 * We require either a userId or an email
 */

Iterable.ensure(function(msg) {
  if (msg.userId() || msg.email()) return;
  return this.reject('Must set either userId or email');
});

/**
 * Identify.
 *
 * https://api.iterable.com/api/docs#!/users/updateUser_post_1
 *
 * @param {Object} payload
 * @param {Function} fn
 * @api public
 */

Iterable.prototype.identify = function(identify, fn) {
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
};

/**
 * Added/Removed Product.
 *
 * Regular track call, unless properties.products is present
 *
 * @param {Track} track
 * @param {Function} fn
 * @api public
 */

Iterable.prototype.addedProduct = Iterable.prototype.removedProduct = function(track, fn) {
  var products = get(track.properties(), 'products');

  return this
    .post(type(products) === 'array' ? '/commerce/updateCart' : '/events/track')
    .type('json')
    .set(headers(this.settings))
    .send(type(products) === 'array' ? mapper.addedProduct(track) : mapper.track(track))
    .end(this.handle(fn));
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
