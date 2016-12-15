/**
 * Module dependencies.
 */

var Track = require('segmentio-facade').Track;
var traverse = require('isodate-traverse');
var foldl = require('@ndhoule/foldl');
var unixTime = require('unix-time');
var del = require('obj-case').del;
var reject = require('reject');
var pick = require('@ndhoule/pick');
var extend = require('@ndhoule/extend');
var includes = require('@ndhoule/includes');
var isEmail = require('is-email');

/**
 * convert a date into the standard Iterable format "yyyy-MM-dd HH:mm:ss ZZ" (for example, 2015-04-15 10:46:45 +00:00), by fiddling with the ISO string (i.e., 2015-04-15T10:46:45.808Z)
 * @param date
 * @returns {string}
 */
function dateToIterableDateStringFormat(date) {
  return date.toISOString().replace('T', ' ').split('.')[0] + " +00:00";
}

/**
 * Map `identify`.
 *
 * @param {Identify} identify
 * @return {Object}
 * @api private
 */

exports.identify = function(identify) {
  // "phoneNumber" field in Iterable should be mapped from "phone" in Segment spec
  var traits = traverse(identify.traits({ phone: 'phoneNumber' }));
  var context = traverse(identify.context());
  var created = identify.created();
  if (created) traits.met = created.toISOString();
  del(traits, 'id');
  var ts = identify.timestamp();
  if (ts) {
    traits['profileUpdatedAt'] = dateToIterableDateStringFormat(ts);
  }
  var contextFields = ['app', 'device', 'ip', 'locale', 'location', 'page', 'timeZone', 'userAgent']; // these are the only fields we're interested in
  context['timeZone'] = context['timezone'];
  var interestingContext = pick(contextFields, context);
  extend(interestingContext, traits);
  return {
    email: identify.email(),
    userId: identify.userId(),
    dataFields: interestingContext
  };
};

/**
 * Map `track`.
 *
 * @param {Track} track
 * @return {Object}
 * @api private
 */

exports.track = function(track){
  var properties = traverse(track.properties());
  return {
    email: track.email(),
    userId: track.userId(),
    eventName: track.event(),
    createdAt: unixTime(track.timestamp()),
    dataFields: properties
  };
};

/**
 * Map `alias`.
 *
 * @param {Alias} alias
 * @return {Object}
 * @api private
 */

exports.alias = function(alias){
  return {
    currentEmail: alias.previousId(),
    newEmail: alias.userId()
  };
};



/**
 * Map `Product Added/Removed`.
 *
 * This is only invoked when a full products array is present
 *
 * @param {Track} track
 * @return {Object}
 * @api private
 */

exports.productAdded =
exports.productRemoved = function(track){
  return {
    user: {
      email: track.email(),
      userId: track.userId()
    },
    items: formatProducts(track.products())
  };
};

/**
 * Map `Order Completed`.
 *
 * @param {Track} track
 * @return {Object}
 * @api private
 */

exports.orderCompleted = function(track){
  var specialFields = ['templateId', 'campaignId'];
  var props = track.properties();
  var result = {
    createdAt: unixTime(track.timestamp()),
    total: track.total(),
    user: {
      userId: track.userId(),
      email: track.email()
    },
    dataFields: foldl(function(acc, val, key){
      if (key !== 'total' && key !== 'products' && !includes(key, specialFields)) acc[key] = val;
      return acc;
    }, {}, props),
    items: formatProducts(track.products())
  };
  extend(result, pick(specialFields, props));
  return result;
};

/**
 * Turn a Segment products array into Iterable format
 * Specifically, any non-special fields should be nested
 * under a field called "dataFields"
 *
 * @param products
 * @returns {Array}
 */

function formatProducts(products){
  return products.map(function(item){
    var product = new Track({ properties: item });
    var payload = reject({
      id: product.productId() || product.id(),
      sku: product.sku(),
      name: product.name(),
      categories: [product.category()],
      price: product.price(),
      quantity: product.quantity(),
      description: product.proxy('properties.description'),
      imageUrl: product.proxy('properties.imageUrl'),
      url: product.proxy('properties.url')
    });

    payload.dataFields = foldl(function(acc, val, key){
      if (!payload.hasOwnProperty(key) && key !== 'category' && key !== 'product_id') acc[key] = val;
      return acc;
    }, {}, product.properties());

    return payload;
  });
}
