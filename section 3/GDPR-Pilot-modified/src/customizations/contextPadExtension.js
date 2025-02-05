//this file was used to personalize the context pad, to add the process for the GDPR compliance and to hide some not necessary components

import { is } from "bpmn-js/lib/util/ModelUtil";

import { assign } from "min-dash";
import { handleSideBar, decolorEverySelected } from "../js/app.js";
import { removeChatGPTTipFromAll } from "../js/questions.js";
import { closeSideBarSurvey } from "../js/support.js";

//diagrams
import right_to_access from "../../resources/gdpr_compliance_patterns/right_to_be_consent.bpmn";
import right_to_portability from "../../resources/gdpr_compliance_patterns/right_of_portability.bpmn";
import right_to_rectify from "../../resources/gdpr_compliance_patterns/right_to_rectify.bpmn";
import right_to_object from "../../resources/gdpr_compliance_patterns/right_to_object.bpmn";
import right_to_object_to_automated_processing from "../../resources/gdpr_compliance_patterns/right_to_object_to_automated_processing.bpmn";
import right_to_restrict_processing from "../../resources/gdpr_compliance_patterns/right_to_restrict_processing.bpmn";
import right_to_be_forgotten from "../../resources/gdpr_compliance_patterns/right_to_be_forgotten.bpmn";
import right_to_be_informed_of_data_breaches from "../../resources/gdpr_compliance_patterns/data_breach.bpmn";
import consent_to_use_the_data from "../../resources/gdpr_compliance_patterns/consent_to_use_the_data.bpmn";
import right_to_notification from "../../resources/gdpr_compliance_patterns/right_to_notification.bpmn";
//

var icons = {
  openSubProcess:
    '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="black" class="bi bi-arrow-down-right-square" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5.854 3.146a.5.5 0 1 0-.708.708L9.243 9.95H6.475a.5.5 0 1 0 0 1h3.975a.5.5 0 0 0 .5-.5V6.475a.5.5 0 1 0-1 0v2.768z"/></svg>',
};

export default function DisabledTypeChangeContextPadProvider(
  contextPad,
  bpmnReplace,
  elementRegistry,
  translate,
  viewer,
  second
) {
  contextPad.registerProvider(this);
  this._bpmnReplace = bpmnReplace;
  this._elementRegistry = elementRegistry;
  this._translate = translate;
  this._viewer = viewer;
  this._second = second;
}

DisabledTypeChangeContextPadProvider.$inject = [
  "contextPad",
  "bpmnReplace",
  "elementRegistry",
  "translate",
];

const gdprActivityQuestionsPrefix = ["consent", "right"];

DisabledTypeChangeContextPadProvider.prototype.getContextPadEntries = function (
  element
) {
  var bpmnReplace = this._bpmnReplace,
    elementRegistry = this._elementRegistry,
    translate = this._translate,
    viewer = this._viewer,
    second = this._second;

  function openNewPage(event) {
    closeSideBarSurvey();
    handleSideBar(false);
    decolorEverySelected();
    //removeChatGPTTipFromAll();

    const settings_area = document.getElementById("settings_area");
    const settings_area_gdpr = document.getElementById("settings_area_gdpr");
    if (settings_area && settings_area_gdpr) {
      settings_area.style.visibility = "hidden";
      settings_area_gdpr.style.visibility = "hidden";
      const canvas = document.getElementById("canvas");
      if (canvas) canvas.style.height = "95vh";
      const mode = document.getElementById("mode");
      if (mode) mode.innerHTML = "View-only Mode";
    }

    viewer.detach();
    second.attachTo("#canvas");

    var title = "Consent to use the data";
    var diagramToPass = consent_to_use_the_data;
    switch (element.id) {
      case "right_to_access":
        diagramToPass = right_to_access;
        title = "Right to access";
        break;
      case "right_to_portability":
        diagramToPass = right_to_portability;
        title = "Right to portability";
        break;
      case "right_to_rectify":
        diagramToPass = right_to_rectify;
        title = "Right to rectify";
        break;
      case "right_to_object":
        diagramToPass = right_to_object;
        title = "Right to object";
        break;
      case "right_to_object_to_automated_processing":
        diagramToPass = right_to_object_to_automated_processing;
        title = "Right to object to automated processing";
        break;
      case "right_to_restrict_processing":
        diagramToPass = right_to_restrict_processing;
        title = "Right to restrict processing";
        break;
      case "right_to_be_forgotten":
        diagramToPass = right_to_be_forgotten;
        title = "Right to be forgotten";
        break;
      case "right_to_be_informed_of_data_breaches":
        diagramToPass = right_to_be_informed_of_data_breaches;
        title = "Right to be informed of data breaches";
        break;
      case "right_to_notification":
        diagramToPass = right_to_notification;
        title = "Right to notification";
      default:
        break;
    }

    second.importXML(diagramToPass);
    second.get("canvas").zoom("fit-viewport");

    const back = document.getElementById("GoBackArrow");
    const separator = document.getElementById("separator");
    const name = document.getElementById("name_subprocess");

    back.style.display = "block";
    separator.style.display = "block";

    name.style.display = "block";
    name.innerHTML = title;

    const container = second._container;
    container.appendChild(back);

    back.addEventListener("click", function (event) {
      second.detach();
      viewer.attachTo("#canvas");
      if (settings_area) {
        settings_area.style.visibility = "visible";
        settings_area_gdpr.style.visibility = "visible";

        if (canvas) canvas.style.height = "86vh";
        if (mode) mode.innerHTML = "Edit Mode";
      }
      back.style.display = "none";
      separator.style.display = "none";
      name.style.display = "none";
    });

    //const idToPass= (element.id.split("_")[0]=="consent") ? "consent" : element.id;
    //window.open("diagrams.html?id="+idToPass, '_blank');
  }

  return function (entries) {
    const idSplitted = element.id.split("_");
    if (element.id.split("_")[0] == "consent") {
      delete entries["replace"];
      delete entries["append.append-task"];
      delete entries["append.end-event"];
      delete entries["append.gateway"];
      delete entries["append.intermediate-event"];
      delete entries["connect"];

      entries["open.new-page"] = {
        group: "connect",
        html: `<div class="entry">${icons["openSubProcess"]}</div>`,
        title: translate("Open the related called process"),
        action: {
          click: openNewPage,
        },
      };
    } else if (
      element.id.split("_")[0] == "right" &&
      element.type != "bpmn:SequenceFlow"
    ) {
      delete entries["replace"];
      delete entries["append.append-task"];
      delete entries["append.end-event"];
      delete entries["append.gateway"];
      delete entries["append.intermediate-event"];
      delete entries["connect"];

      if (
        idSplitted[idSplitted.length - 1] != "start" &&
        idSplitted[idSplitted.length - 1] != "end"
      ) {
        entries["open.new-page"] = {
          group: "connect",
          html: `<div class="entry">${icons["openSubProcess"]}</div>`,
          title: translate("Open the related called process"),
          action: {
            click: openNewPage,
          },
        };
      }
    } else if (element.type == "bpmn:SequenceFlow") {
      const sourceId = element.source.id;
      const splitSourceId = sourceId.split("_");
      const suffixLength = splitSourceId[splitSourceId.length - 1].length + 1;
      const withoutEnd = sourceId.substring(0, sourceId.length - suffixLength);
      if (
        gdprActivityQuestionsPrefix.some((item) => splitSourceId[0] == item)
      ) {
        delete entries["replace"];
        delete entries["delete"];
      }
    }

    return entries;
  };
};
