/**
 * Module dependencies.
 */

var traverse = require('isodate-traverse');
var clone = require('component-clone');
var unixTime = require('unix-time');
var objCase = require('obj-case');

/**
 * Turn a JSON product into Iterable format
 * Specifically, any non-special fields should be nested under a field called "dataFields"
 *
 * @param cart
 * @returns {Array}
 */
function cartToIterableCart(cart) {
  var commerceItemFields = ["id", "sku", "name", "description", "categories", "price", "quantity", "imageUrl", "url"];
  var numCommerceItemFields = commerceItemFields.length;
  var items = [];
  var i, len = cart.length;
  for (i = 0; i < len; i++) {
    var cartItem = cart[i];
    var iterableItem = {};
    var j;
    for (j = 0; j < numCommerceItemFields; j++) {
      var fieldName = commerceItemFields[j];
      var field = cartItem[fieldName];
      if (field !== undefined) {
        iterableItem[fieldName] = field;
        objCase.del(cartItem, fieldName);
      }
    }
    iterableItem['dataFields'] = cartItem;
    items.push(iterableItem);
  }
  return items;
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
  var cart = props["products"] || props["cart"];
  return {
    user: {
      email: track.email(),
      userId: track.userId()
    },
    items: cartToIterableCart(cart)
  };
}

exports.addedProduct = updateCart;
exports.removedProduct = updateCart;

exports.completedOrder = function(track) {
  var props = track.properties();
  sanitizeProps(track, props);
  var cart = props["products"] || props["cart"];
  // TODO - how do we verify "required" fields such as "total"?
  var total = track.total();
  objCase.del(props, 'total');
  objCase.del(props, 'cart');
  objCase.del(props, 'products');
  return {
    user: {
      email: track.email(),
      userId: track.userId()
    },
    items: cartToIterableCart(cart),
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
