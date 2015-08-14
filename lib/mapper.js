/**
 * Module dependencies.
 */

var traverse = require('isodate-traverse');
var clone = require('component-clone');
var unixTime = require('unix-time');
var objCase = require('obj-case');
var _ = require('underscore');
var Track = require('segmentio-facade').Track;

/**
 * Turn a JSON product into Iterable format
 * Specifically, any non-special fields should be nested under a field called "dataFields"
 *
 * @param products
 * @returns {Array}
 */
function productsToIterableCart(products) {
  return products.map(function(item){
    var product = new Track({ properties: item });
    var payload = {
      id: product.id(),
      sku: product.sku(),
      name: product.name(),
      categories: [product.category()],
      price: product.price(),
      quantity: product.quantity()
    };
    if (product.proxy('properties.description')) payload.description = product.proxy('properties.description');
    if (product.proxy('properties.imageUrl')) payload.imageUrl = product.proxy('properties.imageUrl');
    if (product.proxy('properties.url')) payload.url = product.proxy('properties.url');

    var commerceItemFields = ["id", "sku", "name", "description", "category", "price", "quantity", "imageUrl", "url"];
    _.each(commerceItemFields, function(field) {
      objCase.del(item, field)
    });
    payload.dataFields = item;
    return payload;
  });
}

function sanitizeProps(track, props) {
  if (track.revenue()) {
    props.amount = track.revenue();
    objCase.del(props, 'revenue');
  }
}

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

  var eventName = track.event();
  return {
    email: track.email(),
    userId: track.userId(),
    eventName: eventName,
    createdAt: unixTime(track.timestamp()),
    dataFields: props
  };
};

function updateCart(track){
  var props = track.properties();
  sanitizeProps(track, props);
  return {
    user: {
      email: track.email(),
      userId: track.userId()
    },
    items: productsToIterableCart(track.products())
  };
}

exports.addedProduct = updateCart;
exports.removedProduct = updateCart;

exports.completedOrder = function(track) {
  var props = track.properties();
  sanitizeProps(track, props);
  var products = track.products();
  var total = track.total();
  objCase.del(props, 'total');
  objCase.del(props, 'products');
  return {
    user: {
      email: track.email(),
      userId: track.userId()
    },
    items: productsToIterableCart(products),
    total: total,
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
  var traits = traverse(clone(identify.traits()));
  var created = identify.created();
  var userId = identify.userId();
  objCase.del(traits, 'id');
  if (created) traits.met = created.toISOString();
  return {
    email: identify.email(),
    userId: userId,
    dataFields: traits
  };
};
