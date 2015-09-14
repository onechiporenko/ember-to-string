import Ember from 'ember';

const {
  observer,
  computed
} = Ember;

export default Ember.Controller.extend({

  someVariable1: computed('abc.[]', 'def.length', function() {
    return this.get('abc.length');
  }),

  someFunction1: observer('abc', 'def', 'ghi.[]', function() {
    var abc = this.get('abc');
    this.set('def', abc);
  }),

  actions: {
    someAction1 () {
      this.set('abc', 123);
    }
  }

});