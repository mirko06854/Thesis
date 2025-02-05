import inherits from 'inherits-browser';

import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';


export default function CustomRules(eventBus) {
  RuleProvider.call(this, eventBus);
}

inherits(CustomRules, RuleProvider);

CustomRules.$inject = [ 'eventBus' ];
//pinecon per vectorial storing meglio per chiamate API
//lunchChain per embedding o lama index ma il primo è più completo


CustomRules.prototype.init = function() {
  this.addRule('shape.create', function(context) {

    var shape = context.shape,
        target = context.target;
    var shapeBo = shape.businessObject,
        targetBo = target.businessObject;

    var allowDrop = targetBo.get('vendor:allowDrop');

    if (!allowDrop || !shapeBo.$instanceOf(allowDrop)) {
      return false;
    }
  });
};