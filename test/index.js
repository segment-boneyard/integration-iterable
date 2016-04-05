
var Test = require('segmentio-integration-tester');
var helpers = require('./helpers');
var facade = require('segmentio-facade');
var time = require('unix-time');
var should = require('should');
var assert = require('assert');
var Iterable = require('..');
var objCase = require('obj-case');
var mapper = require('../lib/mapper');

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
    test.mapper(mapper);
  });

  it('should have correct settings', function(){
    test
      .name('Iterable')
      .endpoint('https://api.iterable.com/api')
      .channels(['server', 'mobile', 'client'])
      .ensure('settings.apiKey');
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

    it('should be valid when .apiKey is given', function(){
      test.valid(msg, settings);
    });

    it('should be invalid when both .userId and .email are missing', function(){
      delete msg.userId;
      delete msg.properties.email;
      test.invalid(msg, settings);
    });

    it('should be valid when .userId is missing but .email is present', function(){
      delete msg.userId;
      test.valid(msg, settings);
    });

    it('should be valid when .userId is present but .email is missing', function(){
      delete msg.properties.email;
      test.valid(msg, settings);
    });
  });

  describe('mapper', function(){
    describe('track', function(){
      it('should map basic track', function(){
        test.maps('track-basic');
      });

      it('should map track with email but no userId', function(){
        test.maps('track-email-no-userId');
      });

      it('should map track with userId but no email', function(){
        test.maps('track-userId-no-email');
      });

      it('should map added product track', function(){
        test.maps('track-added-product');
      });

      it('should map removed product track', function(){
        test.maps('track-removed-product');
      });

      it('should map purchase track', function(){
        test.maps('track-purchase');
      });
    });

    describe('identify', function(){
      it('should map basic identify', function(){
        test.maps('identify-basic');
      });

      it('should map a more advanced identify', function(){
        test.maps('identify-advanced');
      });

      it('should map identify with email but no userId', function(){
        test.maps('identify-email-no-userId');
      });

      it('should map identify with userId but no email', function(){
        test.maps('identify-userId-no-email');
      });
    });
  });

  describe('.track()', function(){
    it('should get a good response from the API', function(done){
      var json = test.fixture('track-basic');
      test
        .set(settings)
        .track(json.input)
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

    it('should map Added Product to updateCart if there is a cart provided', function(done){
      var json = test.fixture('track-added-product');

      test
        .set(settings)
        .track(json.input)
        .sends(json.output)
        .expects(200)
        .pathname('/api/commerce/updateCart')
        .end(done);
    });

    it('should not map Added Product to updateCart if there is no cart provided', function(done){
      var json = test.fixture('track-added-product');
      var input = json.input;
      input = objCase.del(input, 'properties.products');

      test
        .set(settings)
        .track(input)
        .expects(200)
        .pathname('/api/events/track')
        .end(done);
    });

    it('should map Removed Product to updateCart if there is a cart provided', function(done){
      var json = test.fixture('track-removed-product');

      test
        .set(settings)
        .track(json.input)
        .sends(json.output)
        .expects(200)
        .pathname('/api/commerce/updateCart')
        .end(done);
    });

    it('should not map Removed Product to updateCart if there is no cart provided', function(done){
      var json = test.fixture('track-removed-product');
      var input = json.input;
      input = objCase.del(input, 'properties.products');

      test
        .set(settings)
        .track(input)
        .expects(200)
        .pathname('/api/events/track')
        .end(done);
    });

    it('should map Completed Order to trackPurchase', function(done){
      var json = test.fixture('track-purchase');

      test
        .set(settings)
        .track(json.input)
        .sends(json.output)
        .expects(200)
        .pathname('/api/commerce/trackPurchase')
        .end(done);
    });

    it('should map a more complex Completed Order to trackPurchase', function(done){
      var json = test.fixture('track-purchase2');

      test
        .set(settings)
        .track(json.input)
        .sends(json.output)
        .expects(200)
        .pathname('/api/commerce/trackPurchase')
        .end(done);
    });

    it('should map a Completed Order with template and campaign ids to trackPurchase', function(done){
      var json = test.fixture('track-purchase-campaign-id');

      test
        .set(settings)
        .track(json.input)
        .sends(json.output)
        .expects(200)
        .pathname('/api/commerce/trackPurchase')
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
