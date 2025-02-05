import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";
import { displayDynamicPopUp } from "../../js/support.js";

export default class ConfirmForGDPRPath {
  constructor(popupMenu, bpmnReplace) {
    popupMenu.registerProvider("bpmn-replace", this);
    this.replaceElement = bpmnReplace.replaceElement;
  }

  getPopupMenuHeaderEntries(element) {
    return function (entries) {
      return entries;
    };
  }

  getPopupMenuEntries(element) {
    const self = this;
    const gdprPrefix = ["consent", "right", "GdprGroup"];
    const prefixId = element.id.split("_")[0];
    const isPrefixGdpr = gdprPrefix.includes(prefixId);
    var confirmEntries;

    if (isPrefixGdpr) {
      return function (entries) {
        confirmEntries = Object.entries(entries).reduce((acc, [key, value]) => {
          const actionType = value.actionType;
          const requiresConfirmation = [
            "replace",
            "delete",
            "connect",
          ].includes(actionType);
          acc[key] = {
            ...value,
            action: () => {
              displayDynamicPopUp(
                "This action will compromise the gdpr compliance level and is not revertible. Do you want to proceed?"
              ).then((confirmed) => {
                if (confirmed) {
                  value.action();
                }
              });
            },
          };
          return acc;
        }, {});
        return confirmEntries;
      };
    } else {
      return function (entries) {
        confirmEntries = Object.entries(entries).reduce((acc, [key, value]) => {
          acc[key] = {
            ...value,
            action: () => {
              value.action();
            },
          };
          return acc;
        }, {});
        return confirmEntries;
      };
    }
  }
}

ConfirmForGDPRPath.$inject = ["popupMenu", "bpmnReplace"];
