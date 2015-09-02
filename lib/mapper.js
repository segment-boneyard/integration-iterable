/**
 * Module dependencies.
 */

var Track = require('segmentio-facade').Track;
var traverse = require('isodate-traverse');
var clone = require('component-clone');
var foldl = require('@ndhoule/foldl');
var unixTime = require('unix-time');
var del = require('obj-case').del;
var reject = require('reject');

/**
 * Map `identify`.
 *
 * @param {Identify} track
 * @return {Object}
 * @api private
 */

exports.identify = function(identify) {
  var traits = traverse(clone(identify.traits()));
  var created = identify.created();
  if (created) traits.met = created.toISOString();
  del(traits, 'id');
  return {
    email: identify.email(),
    userId: identify.userId(),
    dataFields: traits
  };
};

/**
 * Map `track`.
 *
 * @param {Track} track
 * @return {Object}
 * @api private
 */

exports.track = function(track) {
  return {
    email: track.email(),
    userId: track.userId(),
    eventName: track.event(),
    createdAt: unixTime(track.timestamp()),
    dataFields: track.properties()
  };
};

/**
 * Map `Added Product and Removed Product`.
 *
 * This is only invoked when a full products array is present
 *
 * @param {Track} track
 * @return {Object}
 * @api private
 */

exports.addedProduct =
exports.removedProduct = function(track) {
  return {
    user: {
      email: track.email(),
      userId: track.userId()
    },
    items: formatProducts(track.products())
  };
}

/**
 * Map `Completed Order`.
 *
 * @param {Track} track
 * @return {Object}
 * @api private
 */

exports.completedOrder = function(track) {
  return {
    createdAt: unixTime(track.timestamp()),
    total: track.total(),
    user: {
      userId: track.userId(),
      email: track.email()
    },
    dataFields: foldl(function(acc, val, key) {
      if (key !== 'total' && key !== 'products') acc[key] = val;
      return acc;
    }, {}, track.properties()),
    items: formatProducts(track.products())
  };
};


/**
 * Turn a Segment products array into Iterable format
 * Specifically, any non-special fields should be nested
 * under a field called "dataFields"
 *
 * @param products
 * @returns {Array}
 */

function formatProducts(products) {
  return products.map(function(item) {
    var product = new Track({ properties: item });
    var payload = reject({
      id: product.id(),
      sku: product.sku(),
      name: product.name(),
      categories: [product.category()],
      price: product.price(),
      quantity: product.quantity(),
      description: product.proxy('properties.description'),
      imageUrl: product.proxy('properties.imageUrl'),
      url: product.proxy('properties.url')
    });

    payload.dataFields = foldl(function(acc, val, key) {
      if (!payload.hasOwnProperty(key) && key !== 'category') acc[key] = val;
      return acc;
    }, {}, product.properties());

    return payload;
  });
}
