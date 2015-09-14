/* jshint newcap: false */

import Ember from 'ember';

const {
  observer,
  computed,
  get,
  on
} = Ember;

export default Ember.Controller.extend({

  abc: [1],

  fullName: computed('firstName', 'lastName', {
    get() {
      return this.get('firstName') + ' ' + this.get('lastName');
    },
    set(key, value) {
      var parts = value.split(/\s+/);
      var firstName = parts[0];
      var lastName = parts[1];
      this.set('firstName', firstName);
      this.set('lastName',  lastName);
    }
  }),

  some: Ember.inject.controller('some'),

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

  computedPropertyEmberObject: computed('a.firstObject', 'b.[]', function() {
    return Ember.Object.create({
      a: this.get('a.firstObject'),
      b: this.get('b.length')
    });
  }),

  computedPropertyWithGetterSetter: computed('firstName', 'lastName', {
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

  methodObserver: observer('a.[]', 'b.[]', function () {
    var a = this.get('a.length');
    var b = this.get('b.length');
    this.set('c', a + b);
  }),

  methodListener: on('init', function () {
    var a = this.get('a.length');
    var b = this.get('b.length');
    this.set('c', a + b);
  }),

  methodObserverListener: on('init', observer('a.[]', 'b.[]', function () {
    var a = this.get('a.length');
    var b = this.get('b.length');
    this.set('c', a + b);
  })),

  actions: {

    someAction: function () {
      var a = this.get('a');
      this.set('c', a.get('length'));
    }

  }

});