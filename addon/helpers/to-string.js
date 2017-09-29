import Ember from 'ember';
import emberVersionIs from 'ember-version-is';

const {
  A,
  typeOf,
  get,
  isNone
} = Ember;

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

/**
 * Get function's string representation with replacing "Ember['default']" to "Ember"
 * @param {function} f some function
 * @returns {string}
 */
function f2str(f) {
  return f.toString().replace(/(_e|E)mber\['default'\]/g, 'Ember');
}

/**
 * Wrap function body (<code>f</code>) into the 'keys'
 * Example:
 * <pre>
 *   let keys = ['a', 'b', 'c'];
 *   let type = 'observes';
 *   let f = 'function () {}';
 *   let output = addTriggers(keys, type, f); // "Ember.observes('a', 'b', 'c', function () {})"
 * </pre>
 * If <code>keys</code> is empty array, <code>f</code> is returned without any changes
 * @param {string[]} keys list of the depended keys
 * @param {string} type type of dependency ('observes', 'on')
 * @param {string} f function's body
 * @returns {string}
 */
function addTriggers(keys, type, f) {
  return (keys && keys.length) ? `Ember.${type}(${dependedKeys(keys)}, ${f})` : f;
}

/**
 * Convert array of strings <code>['a, 'b', 'c'] to the string <code>"'a', 'b', 'c'"</code>
 * Used to display depended keys for computed properties and observers
 * If array is empty, empty string is returned
 * @param {string[]} keys list of the depended keys
 * @returns {string}
 */
function dependedKeys(keys) {
  return keys.length ? keys.map(k => {return `'${k}'`;}).join(', ') : '';
}

/**
 * Show computed property as:
 * <pre>
 *    name: Ember.computed('a', 'b', 'c', {
 *      function get() {
 *        // getter
 *      },
 *      function set() {
 *        // setter
 *      }
 *    })
 * </pre>
 * or
 * <pre>
 *    name: Ember.computed('a', 'b', 'c', function () {
 *      // getter
 *    })
 * </pre>
 * @param {object} targetObject object where variable declared
 * @param {string} varName name of needed variable
 * @returns {string}
 */
function computedProperty(targetObject, varName) {
  let getter = targetObject[varName]._getter;
  let setter = targetObject[varName]._setter;
  let dKeys = targetObject[varName]._dependentKeys;
  let openBracket = '';
  let closeBracket = '';
  if ('function' === typeOf(getter) && 'function' === typeOf(setter)) {
    openBracket = '{\n';
    closeBracket = '}';
  }
  let firstPart = `${varName}: ` + (dKeys && dKeys.length ? `Ember.computed(${dependedKeys(dKeys)}` : '') + `, ${openBracket}`;
  let lastPart = closeBracket  + (dKeys && dKeys.length ? ')' : '');
  return firstPart + f2str(getter) + (setter ? `,\n${f2str(setter)}\n` : '') + lastPart;
}

/**
 * Stringify shown value (and calculate it if it's computed property)
 * If is an Ember.Object, add correct wrap:
 * <pre>
 *   name: Ember.Object.create({
 *    // fields
 *   })
 * </pre>
 * or
 * <pre>
 *   name: {
 *    // fields
 *   }
 * </pre>
 * @param {object} targetObject object where variable declared
 * @param {string} varName name of needed variable
 * @returns {string}
 */
function calculatedValue(targetObject, varName) {
  let shown = get(targetObject, varName);
  const funcs = A([]);
  const plain = JSON.stringify(shown, (key, value) => {
    if ('function' === typeOf(value)) {
      const f = f2str(value);
      funcs.pushObject(f.replace(/\n/g, '\\n'));
      return f;
    }
    return value;
  }, 2);
  let calculated = `${varName}: ` + ('instance' === typeOf(shown) ? `Ember.Object.create(${plain})` : plain);

  // remove quotes around function bodies
  funcs.sortBy('length').reverse().forEach(fStringified => calculated = calculated
    .replace(new RegExp(`"${escapeRegExp(fStringified)}"`, 'g'), fStringified)
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
  );

  return calculated;
}

/**
 * Stringify controller/service injection
 * Output examples:
 * <pre>
 *   varName: Ember.inject.service('...')
 * </pre>
 * <pre>
 *   varName: Ember.inject.controller('...')
 * </pre>
 * @param {object} targetObject object where variable declared
 * @param {string} varName name of needed variable
 * @returns {string}
 */
function injection(targetObject, varName) {
  let shown = targetObject[varName];
  return `${varName}: Ember.inject.${shown.type}('${shown.name}')`;
}

/**
 *
 * @param {array} params
 *  params[0] - object    object where needed variable is declared
 *  params[1] - string    variable name that should be shown
 *  params[2] - boolean   (optional) if shown variable is computed property this flag is used to select the way of displaying (true - calculate value and show result, false - show it as is the object)
 * @returns {string}
 */
export function toString([targetObject, varName, showCalculated]) {
  if (targetObject[varName] && targetObject[varName].isDescriptor) {
    if (targetObject[varName]._getter && 'injectedPropertyGet' === targetObject[varName]._getter.name) {
      // injection
      return injection(targetObject, varName);
    }
    // some computed property
    if (showCalculated) {
      // show calculated
      return calculatedValue(targetObject, varName);
    }
    // shown as is
    return computedProperty(targetObject, varName);
  }
  let shown = get(targetObject, varName);
  if (isNone(shown)) {
    // try as action
    const actionsKey = emberVersionIs('lessThan', '2.0.0') ? '_actions' : 'actions';
    shown = get(targetObject, `${actionsKey}.${varName}`);
    if ('function' === typeOf(shown)) {
      return f2str(shown);
    }
  }
  else {
    if ('function' === typeOf(shown)) {
      // some method
      let f = f2str(shown);
      f = addTriggers(shown.__ember_observes__, 'observer', f);
      f = addTriggers(shown.__ember_listens__, 'on', f);
      return `${varName}: ` + f;
    }
    else {
      // some variable
      return calculatedValue(targetObject, varName);
    }
  }
}

export default Ember.Helper.helper(toString);