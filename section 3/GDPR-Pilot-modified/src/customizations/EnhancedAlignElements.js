import {
  filter,
  forEach,
  isArray,
  sortBy
} from 'min-dash';

/**
 * @typedef {import('../../model/Types').Element} Element
 *
 * @typedef {import('../modeling/Modeling').default} Modeling
 * @typedef {import('../rules/Rules').default} Rules
 *
 * @typedef {import('../../util/Types').Axis} Axis
 * @typedef {import('../../util/Types').Dimension} Dimension
 *
 * @typedef { 'top' | 'right' | 'bottom' | 'left' | 'center' | 'middle' } Alignment
 */

function last(arr) {
  return arr && arr[arr.length - 1];
}

function sortTopOrMiddle(element) {
  return element.y || 0; // Default to 0 if undefined
}

function sortLeftOrCenter(element) {
  return element.x || 0; // Default to 0 if undefined
}

/**
 * Sorting functions for different alignments.
 *
 * @type {Record<string, Function>}
 */
var ALIGNMENT_SORTING = {
  left: sortLeftOrCenter,
  center: sortLeftOrCenter,
  right: function(element) {
    return (element.x || 0) + (element.width || 0); // Default to 0 if undefined
  },
  top: sortTopOrMiddle,
  middle: sortTopOrMiddle,
  bottom: function(element) {
    return (element.y || 0) + (element.height || 0); // Default to 0 if undefined
  }
};

/**
 * @param {Modeling} modeling
 * @param {Rules} rules
 */
export default function AlignElements(modeling, rules) {
  this._modeling = modeling;
  this._rules = rules;
}

AlignElements.$inject = [ 'modeling', 'rules' ];


/**
 * Get relevant axis and dimension for given alignment.
 *
 * @param {Alignment} type
 *
 * @return { {
 *   axis: Axis;
 *   dimension: Dimension;
 * } }
 */
AlignElements.prototype._getOrientationDetails = function(type) {
  var vertical = [ 'top', 'bottom', 'middle' ],
      axis = 'x',
      dimension = 'width';

  if (vertical.indexOf(type) !== -1) {
    axis = 'y';
    dimension = 'height';
  }

  return {
    axis: axis,
    dimension: dimension
  };
};

AlignElements.prototype._isType = function(type, types) {
  return types.indexOf(type) !== -1;
};

/**
 * Get point on relevant axis for given alignment.
 *
 * @param {Alignment} type
 * @param {Element[]} sortedElements
 * @param {number} spaceBetween
 *
 * @return {Partial<Record<Alignment, number>>}
 */
AlignElements.prototype._alignmentPosition = function(type, sortedElements, spaceBetween) {
  var alignment = {};

  if (this._isType(type, [ 'left', 'top' ])) {
    alignment[type] = sortedElements[0][type] || 0; 

  } else if (this._isType(type, [ 'right', 'bottom' ])) {
    var lastElement = last(sortedElements);
    alignment[type] = (lastElement[type] || 0) + (lastElement[this._getOrientationDetails(type).dimension] || 0); // Default to 0 if undefined

  } else if (this._isType(type, [ 'center', 'middle' ])) {
    var firstElement = sortedElements[0];
    var lastElement = last(sortedElements);
    var totalSpace = sortedElements.length * spaceBetween;
    alignment[type] = ((firstElement[type] || 0) + (lastElement[type] || 0) + (lastElement[this._getOrientationDetails(type).dimension] || 0) - totalSpace) / 2; 
  }

  return alignment;
};

/**
 * Align elements on relevant axis for given alignment.
 *
 * @param {Element[]} elements
 * @param {Alignment} type
 * @param {number} spaceBetween
 */
AlignElements.prototype.trigger = function(elements, type, spaceBetween) {
  var modeling = this._modeling,
      allowed;

  // filter out elements which cannot be aligned
  var filteredElements = filter(elements, function(element) {
    return !(element.waypoints || element.host || element.labelTarget);
  });

  // filter out elements via rules
  allowed = this._rules.allowed('elements.align', { elements: filteredElements });
  if (isArray(allowed)) {
    filteredElements = allowed;
  }

  if (filteredElements.length < 2 || !allowed) {
    return;
  }

  var sortFn = ALIGNMENT_SORTING[type];

  var sortedElements = sortBy(filteredElements, sortFn);

  var alignment = this._alignmentPosition(type, sortedElements, spaceBetween);

  modeling.alignElements(sortedElements, alignment);
};
