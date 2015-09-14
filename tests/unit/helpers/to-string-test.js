import { toString } from '../../../helpers/to-string';
import { module, test } from 'qunit';
import Ember from 'ember';

function minifier(str) {
  return str.replace(/\s+/g, ' ');
}

let targetObject = Ember.Controller.extend({

  a: Ember.A([1,2,3]),
  b: Ember.A([1,2,3]),

  firstName: 'a',
  lastName: 'b',

  notComputedEmberObject: Ember.Object.create({
    a: 1,
    b: 'b',
    c: [1, 2, 3],
    d: true
  }),

  notComputedObject: {
    a: 'a',
    b: 123,
    c: true,
    d: null
  },

  computedPropertyEmberObject: Ember.computed('a.firstObject', 'b.[]', function() {
    return Ember.Object.create({
      a: this.get('a.firstObject'),
      b: this.get('b.length')
    });
  }),

  computedPropertyWithGetterSetter: Ember.computed('firstName', 'lastName', {
    get() {
      return this.get('firstName') + ' ' + this.get('lastName');
    },
    set(key, value) {
      var parts = value.split(/\s+/);
      this.setProperties({
        firstName: parts[0],
        lastName: parts[1]
      });
    }
  }),

  method(a, b, c) {
    this.set('c', a + b + c);
  },

  methodObserver: Ember.observer('a.[]', 'b.[]', function () {
    var a = this.get('a.length');
    var b = this.get('b.length');
    this.set('c', a + b);
  }),

  methodListener: Ember.on('init', function () {
    var a = this.get('a.length');
    var b = this.get('b.length');
    this.set('c', a + b);
  }),

  methodObserverListener: Ember.on('init', Ember.observer('a.[]', 'b.[]', function () {
    var a = this.get('a.length');
    var b = this.get('b.length');
    this.set('c', a + b);
  })),

  service: Ember.inject.service('someService'),

  // dummy way to simulate container
  container: {
    lookup: Ember.K
  },

  actions: {

    someAction: function () {
      var a = this.get('a');
      this.set('c', a.get('length'));
    }

  }

}).create();

module('Unit | Helper | to string');

test('Not computed property. Ember Object', function (assert) {
  assert.equal(minifier(toString([targetObject, 'notComputedEmberObject'])), 'notComputedEmberObject: Ember.Object.create({ "a": 1, "b": "b", "c": [ 1, 2, 3 ], "d": true })');
});

test('Not computed property. Plain Object', function (assert) {
  assert.equal(minifier(toString([targetObject, 'notComputedObject'])), 'notComputedObject: { "a": "a", "b": 123, "c": true, "d": null }');
});

test('Computed property. Ember Object. Calculated', function (assert) {
  assert.equal(minifier(toString([targetObject, 'computedPropertyEmberObject', true])), 'computedPropertyEmberObject: Ember.Object.create({ "a": 1, "b": 3 })');
});

test('Computed property. Ember Object. Raw', function (assert) {
  assert.equal(minifier(toString([targetObject, 'computedPropertyEmberObject'])), `computedPropertyEmberObject: Ember.computed('a.firstObject', 'b.[]', function () { return Ember.Object.create({ a: this.get('a.firstObject'), b: this.get('b.length') }); })`);
});

test('Computed property with getter and setter', function (assert) {
  assert.equal(minifier(toString([targetObject, 'computedPropertyWithGetterSetter'])), `computedPropertyWithGetterSetter: Ember.computed('firstName', 'lastName', { function get() { return this.get('firstName') + ' ' + this.get('lastName'); }, function set(key, value) { var parts = value.split(/\\s+/); this.setProperties({ firstName: parts[0], lastName: parts[1] }); } })`);
});

test('Action', function (assert) {
  assert.equal(minifier(toString([targetObject, 'someAction'])), `function someAction() { var a = this.get('a'); this.set('c', a.get('length')); }`);
});

test('Method', function (assert) {
  assert.equal(minifier(toString([targetObject, 'method'])), `method: function method(a, b, c) { this.set('c', a + b + c); }`);
});

test('Method is observer', function (assert) {
  assert.equal(minifier(toString([targetObject, 'methodObserver'])), `methodObserver: Ember.observer('a.[]', 'b.[]', function () { var a = this.get('a.length'); var b = this.get('b.length'); this.set('c', a + b); })`);
});

test('Method is listener', function (assert) {
  assert.equal(minifier(toString([targetObject, 'methodListener'])), `methodListener: Ember.on('init', function () { var a = this.get('a.length'); var b = this.get('b.length'); this.set('c', a + b); })`);
});

test('Method is observer and listener', function (assert) {
  assert.equal(minifier(toString([targetObject, 'methodObserverListener'])), `methodObserverListener: Ember.on('init', Ember.observer('a.[]', 'b.[]', function () { var a = this.get('a.length'); var b = this.get('b.length'); this.set('c', a + b); }))`);
});

test('Injection', function (assert) {
  assert.equal(minifier(toString([targetObject, 'service'])), `service: Ember.inject.service('someService')`);
});