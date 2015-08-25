
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var mapper = require('./mapper');
var objCase = require('obj-case');
var type = require('segmentio-facade/lib/utils').type;

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
 * shorthand function to generate request to Iterable
 *
 * @param getPathAndMapperFunc A function that returns an object whose .path is the path to call, and optionally .mapper is the mapper to use
 * @returns {Function}
 */
function request(getPathAndMapperFunc){
  return function(track, fn) {
    var pathAndMapper = getPathAndMapperFunc(track),
      mapperFunc = pathAndMapper.mapper,
      payload = mapperFunc ? mapperFunc(track) : track;
    return this
      .post(pathAndMapper.path)
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

Iterable.prototype.track = request(function (track) { return { path: '/events/track' }; });

/**
 * If there's no "products" specified, just treat this as a normal track. Otherwise, forward to our updateCart API
 * @param track
 * @returns {*}
 */
function updateCartGetPathAndMapper(track){
  var products = objCase(track.properties(), 'products');
  return type(products) === 'array' ?
      { path: '/commerce/updateCart', mapper: mapper.addedProduct} :
      { path: '/events/track', mapper: mapper.track };
}
Iterable.prototype.addedProduct = request(updateCartGetPathAndMapper);
Iterable.prototype.removedProduct = request(updateCartGetPathAndMapper);

Iterable.prototype.completedOrder = request(function (track) { return { path: '/commerce/trackPurchase', mapper: mapper.completedOrder}; });

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
