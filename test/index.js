
var Test = require('segmentio-integration-tester');
var helpers = require('./helpers');
var facade = require('segmentio-facade');
var time = require('unix-time');
var should = require('should');
var assert = require('assert');
var Iterable = require('..');

describe('Iterable', function(){
  var settings;
  var iterable;
  var payload;
  var test;

  beforeEach(function(){
    payload = {};
    settings = { apiKey: '124175f3654446babf5b5966e232d91d' };
    iterable = new Iterable(settings);
    test = Test(iterable, __dirname);
  });

  it('should have correct settings', function(){
    test
      .name('Iterable')
      .endpoint('https://api.iterable.com/api')
      .channels(['server', 'mobile', 'client'])
      .ensure('settings.apiKey')
      .ensure('message.userId');
  });

  describe('.validate()', function(){
    var msg;

    beforeEach(function(){
      msg = {
        userId: '7331',
        properties: {
          email: 'jd@example.com'
        }
      };
    });

    it('should be invalid when .apiKey is missing', function(){
      delete settings.apiKey;
      test.invalid(msg, settings);
    });

    it('should be invalid when .userId is missing', function(){
      delete msg.userId;
      test.invalid(msg, settings);
    });

    it('should be valid when .apiKey is given', function(){
      test.valid(msg, settings);
    });
  });

  describe('mapper', function(){
    describe('track', function(){
      it('should map basic track', function(){
        test.maps('track-basic');
      });

      it('should map update cart track', function(){
        test.maps('track-update-cart');
      });

      it('should map purchase track', function(){
        test.maps('track-purchase');
      });
    });

    describe('identify', function(){
      it('should map basic identify', function(){
        test.maps('identify-basic');
      });
    });
  });

  describe('.track()', function(){
    it('should get a good response from the API', function(done){
      test
        .set(settings)
        .track(helpers.track())
        .expects(200)
        .pathname('/api/events/track')
        .end(done);
    });

    it('should error on invalid apikey', function(done){
      test
        .set({ apiKey: 'x' })
        .track({})
        .error('cannot POST /api/events/track (401)', done);
    });

    it('should map Add/Remove Item to updateCart if there is a cart provided', function(done){
      test
        .set(settings)
        .track({
          "type": "track",
          "event": "Added Product",
          "userId": "some-uid",
          "timestamp": "2014",
          "properties": {
            "revenue": 19.99,
            "email": "jd@example.com",
            "prop": true,
            "cart": [
              {
                "id": "foo-id",
                "sku": "foo-sku",
                "name": "foo-name",
                "price": 5.5,
                "quantity": 2,
                "category": "foo-category"
              }
            ]
          }
        })
        .expects(200)
        .pathname('/api/commerce/updateCart')
        .end(done);
    });

    it('should not map Add/Remove Item to updateCart if there is no cart provided', function(done){
      test
        .set(settings)
        .track({
          "type": "track",
          "event": "Added Product",
          "userId": "some-uid",
          "timestamp": "2014",
          "properties": {
            "revenue": 19.99,
            "email": "jd@example.com",
            "prop": true
          }
        })
        .expects(200)
        .pathname('/api/events/track')
        .end(done);
    });

    it('should map Completed Order to trackPurchase if there is a cart provided', function(done){
      test
        .set(settings)
        .track({
          "type": "track",
          "event": "Completed Order",
          "userId": "some-uid",
          "timestamp": "2014",
          "properties": {
            "revenue": 19.99,
            "email": "jd@example.com",
            "prop": true,
            "cart": [
              {
                "id": "foo-id",
                "sku": "foo-sku",
                "name": "foo-name",
                "price": 5.5,
                "quantity": 2,
                "category": "foo-category"
              }
            ]
          }
        })
        .expects(200)
        .pathname('/api/commerce/trackPurchase')
        .end(done);
    });

    it('should not map Completed Order to trackPurchase if there is no cart provided', function(done){
      test
        .set(settings)
        .track({
          "type": "track",
          "event": "Completed Order",
          "userId": "some-uid",
          "timestamp": "2014",
          "properties": {
            "revenue": 19.99,
            "email": "jd@example.com",
            "prop": true
          }
        })
        .expects(200)
        .pathname('/api/events/track')
        .end(done);
    });
  });

  describe('.identify()', function(){
    it('should get a good response from the API', function(done){
      test
        .set(settings)
        .identify(helpers.identify())
        .expects(200)
        .end(done);
    });

    it('should error on invalid apikey', function(done){
      test
        .set({ apiKey: 'x' })
        .identify({})
        .error('cannot POST /api/users/update (401)', done);
    });
  });

  describe('.page()', function(){
    it('should not track automatically', function(done){
      test
        .set(settings)
        .page(helpers.page())
        .requests(0)
        .end(done);
    });

    it('should track all pages', function(done){
      test
        .set(settings)
        .set({ trackAllPages: true })
        .page(helpers.page())
        .requests(1)
        .expects(200)
        .end(done);
    });

    it('should track named pages', function(done){
      test
        .set(settings)
        .set({ trackNamedPages: true })
        .page(helpers.page())
        .requests(1)
        .expects(200)
        .end(done);
    });

    it('should track category pages', function(done){
      test
        .set(settings)
        .set({ trackCategorizedPages: true })
        .page(helpers.page())
        .requests(1)
        .expects(200)
        .end(done);
    });
  });
});
