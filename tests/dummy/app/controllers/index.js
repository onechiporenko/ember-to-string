/* jshint newcap: false */

import Ember from 'ember';

const {
  observer,
  computed,
  A,
  get,
  on
} = Ember;

export default Ember.Controller.extend({

  abc: [1],

  firstName: null,
  lastName: null,

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

  someNotComputedVariable: Ember.Object.create({
    a: A([]),
    b: ['a', 'b', 'c'],
    c: 'abc',
    d: true
  }),

  someVariable: computed('abc.[]', 'def.length', function() {
    return this.get('abc.length');
  }),

  someVariable2: computed('abc.[]', 'def.length', function() {
    return this.get('abc.length');
  }),

  someVariable3: computed('abc', function() {
    return this.get('abc.length');
  }),

  someVariable4: computed('abc', function() {
    return Ember.Object.create({
      a: 1,
      l: get(this, 'abc.length')
    });
  }),

  someFunction: on('init', observer('abc', 'def', 'ghi.[]', function() {
    var abc = this.get('abc');
    this.set('def', abc);
  })),

  actions: {
    someAction () {
      this.set('abc', 123);
    }
  }

});