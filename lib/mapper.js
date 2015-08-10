/**
 * Module dependencies.
 */

var traverse = require('isodate-traverse');
var clone = require('component-clone');
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

  var eventName = track.event();
  var cart = props["products"] || props["cart"];
  if (cart && (eventName == "Added Product" || eventName == "Removed Product")) {
    // TODO - map extra product fields to dataFields
    return {
      user: {
        email: track.email(),
        userId: track.userId()
      },
      items: cart,
      isUpdateCart: true
    };
  } else if (cart && eventName == "Completed Order") {
    // TODO - map extra product fields to dataFields
    var total = track.total();
    if (!total) {
      total = 0;
      var i, len = cart.length;
      for (i = 0; i < len; i++) {
        var price = cart[i]["price"];
        var quantity = cart[i]["quantity"];
        if (price && quantity) {
          total += price * quantity;
        }
      }
    }
    objCase.del(props, 'cart');
    objCase.del(props, 'products');
    return {
      user: {
        email: track.email(),
        userId: track.userId()
      },
      items: cart,
      total: total,
      createdAt: unixTime(track.timestamp()),
      dataFields: props,
      isPurchase: true
    };
  } else {
    return {
      email: track.email(),
      userId: track.userId(),
      eventName: eventName,
      createdAt: unixTime(track.timestamp()),
      dataFields: props
    };
  }
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
