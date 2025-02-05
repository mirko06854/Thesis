//-----------------------------SUPPORTS FUNCTIONS-----------------------------------
import {
  yesdropDownA,
  nodropDownA,
  nodropDownB,
  addBPath,
  openDropDown,
  removeChatGPTTip,
  yesHandler,
  noHandler,
} from "./questions.js";
import {
  getDiagram,
  removeConsentFromActivity,
  getActivities,
  reorderDiagram,
  cleanSelection,
  decolorEverySelected,
  colorActivity,
  decolorActivity,
  getAnswerQuestionX,
  callChatGpt,
  getXMLOfTheCurrentBpmn,
  fromXMLToText,
  reSet,
} from "./app.js";

//GDPR compliance patterns
import consent_to_use_the_data from "../../resources/gdpr_compliance_patterns/consent_to_use_the_data.bpmn";
import right_to_access from "../../resources/gdpr_compliance_patterns/right_to_be_consent.bpmn";
import right_to_portability from "../../resources/gdpr_compliance_patterns/right_of_portability.bpmn";
import right_to_rectify from "../../resources/gdpr_compliance_patterns/right_to_rectify.bpmn";
import right_to_object from "../../resources/gdpr_compliance_patterns/right_to_object.bpmn";
import right_to_object_to_automated_processing from "../../resources/gdpr_compliance_patterns/right_to_object_to_automated_processing.bpmn";
import right_to_restrict_processing from "../../resources/gdpr_compliance_patterns/right_to_restrict_processing.bpmn";
import right_to_be_forgotten from "../../resources/gdpr_compliance_patterns/right_to_be_forgotten.bpmn";
import right_to_be_informed_of_data_breaches from "../../resources/gdpr_compliance_patterns/data_breach.bpmn";
import right_to_notification from "../../resources/gdpr_compliance_patterns/right_to_notification.bpmn"
//

import loading from "../../resources/loading.gif";
import gdprAchived from "../../resources/GDPR_achieved.png";
import gdprImage from "../../resources/gdpr_gray.png";

const questionButton = document.getElementById("questionButton");
questionButton.addEventListener("click", function () {
  displayDynamicAlert(
    "If you are in Edit Mode, you can freely edit the diagram. However, when you are in GDPR Mode, you cannot edit the diagram. To edit it again, you must close the GDPR panel.",
    "gdpr",
    8000
  );
});

//close sideBarSurvey
function closeSideBarSurvey() {
  const mainColumn = document.querySelector(".main-column");
  const sidebarColumn = document.querySelector(".sidebar-column");
  const canvasRaw = document.querySelector("#canvas-raw");
  const spaceBetween = document.querySelector(".space-between");
  const survey_col = document.getElementById("survey_col");
  const survey_area = document.getElementById("survey_area");

  if (survey_col && survey_area) {
    survey_col.removeChild(document.getElementById("survey_area"));
    mainColumn.style.width = "100%";
    survey_col.className = "sidebar-column";
  }
  reSet();
}
//

//function to open and close drop down
//drop: id of the current question
//type: button clicked yes/no
export async function openDrop(drop, type, open) {
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "L", "M"];
  const letter = drop.split("dropDown")[1];
  const dropDownCurrent = "#ulCollapsedropDown" + letter;
  const CurrentLetterButton = document.querySelector(dropDownCurrent);
  CurrentLetterButton.setAttribute("class", "collapse");
  const index = letters.indexOf(letter);
  if (open) {
    if (
      (letter != "M" && letter != "B" && letter != "A") ||
      (letter == "A" && type == "yes") ||
      (letter == "B" && type == "yes")
    ) {
      const nextLetter = letters[index + 1];
      const dropDownNext = "#ulCollapsedropDown" + nextLetter;
      const NextLetterButton = document.querySelector(dropDownNext);
      NextLetterButton.setAttribute("class", "collapse show");
    }
  }
}
//

//function to add the text "Suggested by" under the right button
//ID: id of the dropDown in which the button is located
//answer: the result of the prediction
function addTextBelowButton(Id, answer) {
  var buttonId;
  var otherP;
  var HasBorderN = false;
  var HasBorderY = false;
  var yesButton = document.getElementById("yes_" + Id)
    ? document.getElementById("yes_" + Id)
    : true;
  var noButton = document.getElementById("no_" + Id)
    ? document.getElementById("no_" + Id)
    : true;
  if (yesButton) {
    HasBorderY =
      yesButton.style &&
      yesButton.style.border == "0.3vh solid rgb(16, 173, 116)"
        ? true
        : false;
  }
  if (noButton) {
    HasBorderN =
      noButton.style && noButton.style.border == "0.3vh solid rgb(16, 173, 116)"
        ? true
        : false;
  }
  if (yesButton && noButton && !HasBorderY && !HasBorderN) {
    //if the answer contains an array --> answer related to question B
    if (answer.match(/\[.*?\]/)) {
      buttonId = "no_" + Id;
      const arrayMatch = answer.match(/\[.*?\]/);
      if (answer.match(/\[.*?\]/)) {
        buttonId = "no_" + Id;
        const arrayMatch = answer.match(/\[.*?\]/);
        if (arrayMatch) {
          try {
            const jsonString = arrayMatch[0];
            const cleanedJsonString = jsonString.replace(/\\/g, "");
            const array = JSON.parse(cleanedJsonString);
            if (array) {
              localStorage.setItem(
                "activities_suggested",
                JSON.stringify(array)
              );
            }
          } catch (e) {
            console.log("Errore nel parsing dell'array:", e);
          }
        }
      }
    } else if (answer.includes("yes") || answer.includes("Yes")) {
      buttonId = "yes_" + Id;
      otherP = "no_" + Id;
    } else {
      buttonId = "no_" + Id;
      otherP = "p_yes_" + Id;
    }
    //in case there is something missing
    const p1 = document.getElementById("p_" + buttonId);
    if (p1) p1.remove();
    const p2 = document.getElementById("p_" + otherP);
    if (p2) p2.remove();

    const button = document.getElementById(buttonId);

    if (button) {
      const myEvent = new CustomEvent("removeGif", { detail: { id: Id } });
      document.dispatchEvent(myEvent);
      button.style.backgroundColor = "rgba(16, 173, 116, 0.3)";
      const textElement = document.createElement("p");
      textElement.innerHTML = "<center>LLM-based suggestion</center>";
      textElement.style.marginTop = "5px";
      textElement.style.marginLeft = "0.001vh";
      textElement.style.fontSize = "1.1vh";
      textElement.style.color = "rgba(16, 173, 116)";
      textElement.id = "p_" + buttonId;
      button.parentNode.insertBefore(textElement, button.nextSibling);
    }
  } else {
    const myEvent = new CustomEvent("removeGif", { detail: { id: Id } });
    document.dispatchEvent(myEvent);
  }
}
//
export function readBlobDirectly(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      resolve(event.target.result);
    };
    reader.onerror = function (event) {
      reject(event.target.error);
    };
    reader.readAsText(blob);
  });
}
//function that send the right message to chatGPT in order to get the prediction about the question
//id: the id of the drop down related to the question ex. dropDownA
async function predictionChatGPT(id) {
  try {
    const currentXMLBlob = await fromXMLToText();
    const currentXML = await readBlobDirectly(currentXMLBlob);
    console.log(currentXML);
    const descriptionReq = await callChatGpt(
      "You have to complete this two task:\n Task 1 (Logic description generation): I give you the textual description of a bpmn process, can you give me back the description of the working of this process, explicit the protagonists if there " +
        "are messages exchaged between more participants? Just a brief description of at most 30 lines" +
        currentXML +
        "\n" +
        "Task 2 (Roles definition): Consider to be a GDPR specialist, you have the same textual description of the process and you need to clearly identify who is the Data Controller and who is the Data Subject." +
        "Go to head and you have to output this information following this format, taking as example the process of a makeup store that needs to register a new customer in its database: 'Data Controller: Makeup Store;\n Data Subject: Customer'" +
        "The end output should look like this: \n\n Logic description:\n A makeup store acquires a new customer by requesting their personal data (e.g., name, email address). After verifying the data, it is entered into the database. The customer then receives promotions and product updates. The process concludes with confirmation of data entry into the system." +
        "\n Roles definition:\n Data Controller: Makeup Store;\n Data Subject: Customer"
    );
    const description = descriptionReq.content;
    if (currentXML != "") {
      const activitiesSet = await getActivities();
      switch (id) {
        case "dropDownA":
          const hasPersonalDataReq = await callChatGpt(
            "Consider to be a GDPR expert that needs to analyzing a process, in order to understand if it handles personal data of the Data subject." +
              "\n Task 1: Check this logical description of the process" +
              description +
              " in order to understand who is the data Subject and who is the data controller if they are present in the process, if they are not present in the process, check if there is some activity with a name that suggest the handle of personal data. You don't have to invent nothing, just use the material i provide to you" +
              +"Task 2: Retrieve the definition of personal data and find out if in the process handled personal data of the Data Subject" +
              "double check your answer analyzing the textual description of the process and searching for activities that suggest the handle of personal data of the data subject" +
              currentXML +
              "If the response is positive, print ‘Yes’, otherwise if the process does not handle personal data print or in ANY other case print ‘No’, add a brief motivation for your answer" +
              "The format of the response could be just 'Yes + explanation' or 'No + explanation' " +
              "\nExample you can use to understand: the description we have: A makeup store acquires a new customer by requesting their personal data (e.g., name, email address). After verifying the data, it is entered into the database. The customer then receives promotions and product updates. The process concludes with confirmation of data entry into the system." +
              "the roles definition: Data Controller: Makeup store; \n Data Subject: Customer" +
              "Here the response should be 'Yes' because the description clearly says:' A makeup store acquires a new customer by requesting their personal data' and this make us understand that the makeup store, that is the data controller, handles the personal data of the data subject that is, the customer"
          );
          const hasPersonalData = hasPersonalDataReq.content;
          console.log("Personal data", hasPersonalData);
          addTextBelowButton(id, hasPersonalData);

          break;
        case "dropDownB":
          const hasConsentReq = await callChatGpt(
            "Consider to be a GDPR specialist that needs to understand the level of GDPR compliance of a process. The logical description of the process is this one" +
              description +
              "and the provided text description of its XML " +
              currentXML +
              ".\n\nObjective: You have to understand if the process provided is compliant with the right to Consent to Use the Data or not. Definition of Consent to Use the Data: When retrieving personal data, the Data Controller needs to ask the Data Subject for consent. If consent has already been obtained for a certain set of data, it is not necessary to ask for consent again. Consent is required only for handling personal data. Definition of personal data: Personal data refers to any information that relates to an identified or identifiable individual. This encompasses a wide range of details that can be used to distinguish or trace an individual’s identity, either directly or indirectly. According to the General Data Protection Regulation (GDPR) in the European Union, personal data includes, but is not limited to:Name: This could be a full name or even initials, depending on the context and the ability to identify someone with those initials. Identification numbers: These include social security numbers, passport numbers, driver’s license numbers, or any other unique identifier. Location data: Any data that indicates the geographic location of an individual, such as GPS data, addresses, or even metadata from electronic devices.Online identifiers: These include IP addresses, cookie identifiers, and other digital footprints that can be linked to an individual.Physical, physiological, genetic, mental, economic, cultural, or social identity: This broad category includes biometric data, health records, economic status, cultural background, social status, and any other characteristic that can be used to identify an individual.The GDPR emphasizes that personal data includes any information that can potentially identify a person when combined with other data, which means that even seemingly innocuous information can be considered personal data if it contributes to identifying an individual." +
              "\n Objective: You have to understand if the process provided is compliant with the right to access or not. By definition the right to  Consent to Use the Data has this definition. Before retrieving any kind of personal data from the Data Subject, the Data Controller has to ask the Data Subject for consent. In particular, the Data Controller needs to collect the following list of aspects the Data Subject should be aware of before giving her data to the Data Controller.\n\
              • in case the data has not been directly obtained from the Data Subject, from which source the personal data originates;\n\
              • the existence of the right to lodge a complaint to a supervisory authority;\n\
              • the existence of the right to withdraw the consent at any time;\n\
              • the existence of the right to data portability;\n\
              • the existence of the right to delete personal data;\n\
              • the existence of the right to access personal data;\n\
              • the existence of the right to rectify personal data;\n\
              • the period for which the personal data will be stored, or if this is not possible, the criteria used to determine this period;\n\
              • the existence of any profiling and meaningful information about the envisaged consequences of processing the personal data;\n\
              • if the personal data can be transferred internationally;\n\
              • who are the recipients or categories of recipients of the personal data;\n\
              • which are the interests pursued by the Data Controller or by third parties;\n\
              • the legal basis of the processing;\n\
              • the purposes for which the personal data will be processed;\n\
              • the identity and contact details of the Data Controller and the DPO.\n\
              Then, consent to use the data is requested from the Data Subject. If the consent is given, the data is collected." +
              " \n\n General Task: Identify which activities require consent before being executed based on the provided text description of the process. Ensure that the consent is not already present in the process (Ex. already exists an activity that request the consent before requesting the personal data).\n" +
              ".\n1. Determine which activities handle personal data and require consent. This analysis should be based on the name given to the activities and their meaning (use the description to understand their scope). You can find the names and the ids  in the textual description i provided to you. To consider an activity, the name of the activity must clearly suggest that the activity handles personal data from the data subject." +
              "\n2. Ensure that the consent for these activities has not been requested previously in the process." +
              "\n3. If multiple activities require consent, only include the first one that appears for each unique set of personal data." +
              "\n4. Print an array with the IDs of the activities that require consent before being executed and for which the consent is not already present. Only include IDs of the activities (check the textual description). I must be able to call const arrayMatch = answer.match(/[.*?]/); const array = JSON.parse(arrayMatch); on it" +
              "+\n5. If no activities require consent, print an empty array []." +
              +"\n\nAdditional Instructions:\n- Ensure that the activities indeed handle personal data as defined above.\n- Consider the entire process to ensure accuracy.\n\nOutput: Provide a precise answer based on the analysis of the textual description of the process process. The answer must be or an array with the ids of the activities or an empty array [], nothing more" +
              "\n\n example that could be considered activity that handles personal data from the data subject is like: 'Request Personal Data', 'Request Name and Surname','Request City of provenience, City of Birth' ecc... the name must indicates the request of some personal data directly, you don't have to suppose it, if is not clearly indicated in the name ignore that activity, and before the activity, must miss a consent request in the process." +
              " The request of data should be considered if and only if is about PERSONAL DATA. The activities you choose should not be about data portability, right to access data, data breaches and the others gdpr requirements must not be taken in consideration " +
              'An Activity in the textual description is like this one: "<Activity name: 30 Days Type: StartEvent ID: Event_0x64qzk Exchange with other partecipations: no exchanges /> linked to:" so you can find the name, the type of the activity and its ID that is what you have to print if the activity handles personal data like this: ["Event_0x64qzk"]'
          );

          const hasConsent = hasConsentReq.content;
          console.log("Has Consent?", hasConsent);
          addTextBelowButton(id, hasConsent);
          break;
        case "dropDownC":
          const hasRightToAccessReq = await callChatGpt(
            "Consider to be a GDPR specialist that needs to understand the level of GDPR compliance of a process. The logical description of the process is this one" +
              description +
              ".\nThis is the provided text description of the process: \n" +
              currentXML +
              "\n Objective: You have to understand if the process provided is compliant with the right to access or not. By definition the Right to AccessRight to Access : at any moment, the Data Subject can access  the personal data associated to her. As a result, the Data Controller has the obligation to satisfy these requests. When the Data Subject sends a request availing the right to access, the Data Controller has to (i) retrieve all the data associated with the Data Subject, and (ii) retrieve any processing on the data that has been made. Then, they are both sent to the Data Subject. The design pattern in Fig. 5 implements the privacy constraint Right to Access. In the example of the phone company, this pattern can be implemented as an asynchronous request from the Data Subject that can be received at any point in time after that any personal data has been retained. Note that the customer can request to access her personal data even before the BP is completed (potentially even before the customer signs the contract), and the phone company has to handle this request by providing any personal data it possesses." +
              "\nIn order to achieve this objective, follows this steps:" +
              "Step 1 identify if there are two or more different Participant " +
              "\n If the answer is yes" +
              "Identify if there is an activity where the Data Subject (is a participant) requests her personal data from the Data Controller " +
              "If you find an activity in the participant of the data controller that send a request to access the data of the data subject, is not comply with the right to access" +
              "An example of this behavior could be: {Participant: Phone Company <Activity name: Request of the user to access its private data Type: StartEvent ID: Event_1n5smga Exchange with other partecipations: Receive a message from User /> linked to: <Activity name: Check Validity of the request Type: Task ID: Activity_170m1gv Exchange with other partecipations: no exchanges /> linked to: [Start Exclusive Gateway Gateway_0iyfbzs (only one of the path can be taken) condition to check in order to proceed with the right path 'is valid?' different paths: Path of Gateway_0iyfbzs taken if: 'yes' linked to <Activity name: allow the user to access their data Type: SendTask ID: Activity_02s2a6z Exchange with other partecipations: Send a message to User /> linked to Gateway_0lujbik Path of Gateway_0iyfbzs taken if: 'no' linked to Gateway_0lujbik End paths of ExclusiveGateway Gateway_0iyfbzs ] [Closure Exclusive Gateway Gateway_0lujbik] linked to: <Activity name: Request fullfield Type: EndEvent ID: Event_1ntbs1m Exchange with other partecipations: no exchanges /> End Participant: Phone Company} { Participant: User (empty pool) }" +
              "\n. If you find such a behavior, reply 'Yes'." +
              "\n. If you do not find such an activity or if a request to access stored data of some user is not welcomed without a reason, reply 'No'." +
              "\nn2 If there aren't two different partecipations, but ONLY IN THIS CASE, if you find two participants that can act Data Subject and data Controller, you have to find the Message Flow between them to consider a request of accessing data as it is, check if still exists this behavior without the two partecipation, taking in consideration the previous case, it could be:" +
              "{Participant: Phone Company <Activity name: Request of the user to access its private data Type: StartEvent ID: Event_1n5smga Exchange with other partecipations: no exchanges /> linked to: <Activity name: Check Validity of the request Type: Task ID: Activity_170m1gv Exchange with other partecipations: no exchanges /> linked to: [Start Exclusive Gateway Gateway_0iyfbzs (only one of the path can be taken) condition to check in order to proceed with the right path 'is valid?' different paths: Path of Gateway_0iyfbzs taken if: 'yes' linked to <Activity name: allow the user to access their data Type: SendTask ID: Activity_02s2a6z Exchange with other partecipations:no exchanges /> linked to Gateway_0lujbik Path of Gateway_0iyfbzs taken if: 'no' linked to Gateway_0lujbik End paths of ExclusiveGateway Gateway_0iyfbzs ] [Closure Exclusive Gateway Gateway_0lujbik] linked to: <Activity name: Request fullfield Type: EndEvent ID: Event_1ntbs1m Exchange with other partecipations: no exchanges /> End Participant: Phone Company}" +
              "\n\nMotivation: Briefly explain your answer. If you are not sure about the answer, please answer 'No'" +
              "The access to portability does not regard this requirement, don't take it in consideration"
          );

          const hasRightToAccess = hasRightToAccessReq.content;
          console.log("Has Right To access?", hasRightToAccess);
          addTextBelowButton(id, hasRightToAccess);
          break;
        case "dropDownD":
          const hasRightOfPortabilityReq = await callChatGpt(
            "Consider that you are a GDPR specialist analyzing the level of GDPR compliance of a process. The logical description of the process is as follows: " +
              description +
              ". This is the provided text description of the process: " +
              currentXML +
              ".\n Objective: Determine if the process is compliant with the right to data portability. According to the GDPR, the Right of Portability is defined as follows: The Data Subject (the person whose data is being processed) can, at any time, request that their personal data be transferred to a third party, and the Data Controller (the entity that collects the data) must comply with this request. The process typically involves retrieving all data associated with the Data Subject and any processing done on that data, and then sending it to the specified third party. Once the data transfer is completed, the third party must notify the Data Subject.\n To achieve this objective, follow these steps: " +
              "\nStep 1. Look for an activity where the Data Subject requests the portability of their data to the Data Controller. The request must be initiated by the Data Subject and directed to the Data Controller. Check the message exchanges described in the process. If such a request exists, make a note of it." +
              "\nStep 2. If there are no participants acting as both the Data Subject and Data Controller, look for an activity that explicitly refers to handling the right of portability, such as 'Right to Portability handler' or 'Ask Portability.' If you find such an activity, make a note of it." +
              "\nStep 3. If portability is mentioned but there is no specific activity handling it (e.g., no activity named 'portability' or similar), or if there is ambiguity about whether the process handles it, make a note of this as well." +
              "\nStep 4. Summarize the findings from the above steps and produce a final answer: 'Yes' if the process clearly handles the right to portability, or 'No' if it does not or if it is unclear. Additionally, provide a brief explanation justifying the answer." +
              "\nIf portability is not mentioned or implied in any way, the final answer should be 'Yes'."
          );

          const hasRightOfPortability = hasRightOfPortabilityReq.content;
          console.log("hasRightOfPortabilityReq?", hasRightOfPortability);
          addTextBelowButton(id, hasRightOfPortability);
          break;
        case "dropDownE":
          const hasRightToRectifyReq = await callChatGpt(
            "Consider to be a GDPR specialist that needs to understand the level of GDPR compliance of a process by analyzing the logical description of the process and its textual description. The logic description is this one:\n" +
              description +
              ". This is the text description of the process:" +
              currentXML +
              ".\n\n Objective: You have to understand if the process provided is compliant with the right to rectify or not. By definition the Right to Rectify: At any moment, the Data Subject (the person the data is about) can request to rectify her personal data to the Data Controller (the entity that collects and processes the data). The Data Controller must satisfy these requests. When the Data Subject sends a request availing the right to rectify, the Data Controller has to rectify the data as requested by the Data Subject and communicate back to the Data Subject that her data has been rectified. " +
              " Step 1 : Check if there is an activity where the Data Subject requests a modification of her personal data to the Data Controller. there must be an exchange of messages starting by the data subject and the data controller must allow the rectification, in the case in which there are more participants" +
              "an example could be: " +
              "{ Participant: Participant_0t4txcj (empty pool) } {Participant: Participant_0wfkdnl <Activity name: Request of data rectification Type: StartEvent ID: Event_0c4vuea Exchange with other partecipations: Receive a message from bpmn:ParticipantParticipant_0t4txcj /> linked to: <Activity name: UNllow data rectification Type: SendTask ID: Activity_1jivsdy Exchange with other partecipations: Send a message to bpmn:ParticipantParticipant_0t4txcj /> linked to: <Activity name: bpmn:EndEvent Type: EndEvent ID: Event_06k7hmz Exchange with other partecipations: no exchanges /> End Participant: Participant_0wfkdnl}" +
              " \nThis request must be initiated by the Data Subject and addressed to the Data Controller, not the other way around. Check the Message Flow in the textual description." +
              "If you find such a behavior print 'Yes' as the answer." +
              "\nStep2. If you do not find such an activity or if the process does not contain moreparticipants, check if in the textual description there exists an event in which a request for rectification arrives, If so, print 'Yes'; Or check if exists some kind of 'Right of rectification handler' if exists something that by the name suggested some kind of handling of this right, please print 'Yes'" +
              "The request of rectification must be satisfy, the case in which is denied, like this \n{ Participant: Participant_0t4txcj (empty pool) } {Participant: Participant_0wfkdnl <Activity name: Request of data rectification Type: StartEvent ID: Event_0c4vuea Exchange with other partecipations: Receive a message from bpmn:ParticipantParticipant_0t4txcj /> linked to: <Activity name: Deny the data rectification Type: SendTask ID: Activity_1jivsdy Exchange with other partecipations: Send a message to bpmn:ParticipantParticipant_0t4txcj /> linked to: <Activity name: bpmn:EndEvent Type: EndEvent ID: Event_06k7hmz Exchange with other partecipations: no exchanges /> End Participant: Participant_0wfkdnl} must not be taken in consideration, in this case the answer is 'No'" +
              "\n In case of insecurity, just print 'No'.\n\nMotivation: Briefly explain your answer. " +
              "\nBe careful the right of access the data is not equal to the right of rectify them, you have to find a clear activity in which there is a request of rectification/modification."
          );
          const hasRightToRectify = hasRightToRectifyReq.content;
          console.log("has Right To Rectify ", hasRightToRectify);
          addTextBelowButton(id, hasRightToRectify);
          break;
        case "dropDownF":
          const hasRightToObjectReq = await callChatGpt(
            "Consider to be a GDPR specialist that needs to understand the level of GDPR compliance of a process by analyzing the logical description of the process and its textual description. The logic description is this one:\n " +
              description +
              ". This is the textual description of the process, where you can analyze every connection and activity." +
              currentXML +
              " Perform the analysis of the process by considering the names of the activities and the logic behind the process itself: " +
              ".\n\n Objective: You have to understand if the process provided is compliant with the right to Object or not. By definition the Right to Object: At any moment, the Data Subject (the person the data is about) has the right to object to certain types of data processing, such as direct marketing. The Data Controller (the entity that collects the data of the subject) shall no longer process the personal data unless she demonstrates compelling legitimate grounds for the processing that override the interests and rights of the Data Subject. When the Data Subject sends a request availing the right to object, the Data Controller has to check if the data for which consent has been withdrawn is relevant for the execution of the BP. For this purpose, the BPMN model should start with an XOR-split preceded by a decision activity evaluating the condition according to which one of the alternative paths is chosen. Specifically, if the withdrawn data is relevant, the Data Subject should be informed that her objection to consent will mean the abortion of all running BPs. If, again, the user expresses her intention to continue the objection procedure, then all the BPs using the withdrawn data should be stopped; otherwise, the Right to Object sub-process is aborted. Whether withdrawn data are relevant or not, if the Data Controller receives a request for objection, it has to stop using the data associated with the Data Subject, and communicate back to the Data Subject that her data is not used anymore. Thus the BP terminates." +
              "\nStep1: Identify if there is an activity where the Data Subject communicates her will to object to a certain data processing. (ex Request of stop data processing).If you find this behavior, print 'Yes' as the answer." +
              " If the Data Controller does not acknowledge the request of the data subject, print 'No' as the answer." +
              " Step2 If there aren't two different participants in the textual description, check if there is an event with a request  where the name suggest a request to stop a certain type of data processing, or if there is some activity whose name indicates some kind of request like that, check if the request is welcomed by the data controller." +
              " If you find this behavior, you can print 'Yes' as the answer." +
              " Step3: If the process is not compliant with the , print 'No' as the answer." +
              "Example of case in which you have to respond 'Yes'" +
              "{ Participant: user (empty pool) } {Participant: Company <Activity name: Request of stop data processing from the user Type: StartEvent ID: Event_0c4vuea Exchange with other partecipations: Receive a message from user /> linked to: <Activity name: Stop data processing Type: Task ID: Activity_1jivsdy Exchange with other partecipations: no exchanges /> linked to: <Activity name: End process Type: EndEvent ID: Event_06k7hmz Exchange with other partecipations: no exchanges /> End Participant: Company}" +
              ""
          );

          const hasRightToObject = hasRightToObjectReq.content;
          console.log("hasRightToObject?", hasRightToObject);
          addTextBelowButton(id, hasRightToObject);
          break;
        case "dropDownG":
          const hasRightToObjectAutomatedProcessingReq = await callChatGpt(
            "Consider to be a GDPR specialist that needs to understand the level of GDPR compliance of a process by analyzing the logical description of the process and its textual description. The logic description is this one:\n " +
              description +
              ". This is the textual description of the XML of the process, where you can analyze every connection and activity." +
              currentXML +
              " Perform the analysis of the process by considering the names of the activities and the logic behind the process itself: " +
              ".\n\nObjective: You have to understand if the process provided is compliant with the Right to object to automated processing or not. Definition of Right to Object to Automated Processing: At any moment, the Data Subject (the person the data is about) has the right to object to a decision based solely on automated processing, and that may significantly affect the Data Subject's freedoms, such as profiling. The Data Controller (the entity that collects the data of the subject) should implement suitable measures to safeguard the data subject's right and, if needed, stop the automated processing of personal data. Right to Object to Automated Processing. When the Data Subject sends a request availing the right to object to automated processing on her personal data, the Data Controller should at least guarantee human intervention in all the concerned automated decision activities. In BPMN this can be done through compensation handlers. Any automated decision activity should dispose of a catching compensation event that enables an exception flow leading to a compensation activity. The compensation activity should perform the same task as the automated activity, but it should be executed by a human. In a BPMN model manual activities are identified by a specific marker, thus the compensation activity should be marked with a manual marker.Differently from the others, this right requires that any automated decision activity is easy to spot within the BP and that it disposes of a compensation event that catches the signal thrown by the compensation-throwing event in the pattern. In other words, the pattern presented is not sufficient for the fulfillment of the right, but, in this case, the entire BP should be modified to be compliant with GDPR." +
              "\n\nInstructions:\n1. If there are more participants Identify if there is an activity where the Data Subject communicates her will to object to automated processing to the data controller (check if there is 'exchange with participants' from the data subject to the data controller in the textual representation ). Also, check if the data controller acknowledges the request of the data subject check if he  stops the automated processing or implements suitable measures to safeguard the data subject." +
              " If you find this behavior, print 'Yes' as the answer. If the Data Controller does not acknowledge the request of the data subject or if it takes no action after receiving the request, print 'No' as the answer." +
              "Step2: If there aren't two different participants in the textual description, check if there is an event that reports a request to stop/object the automated processing, and if there is a gateway that indicates whether the automated processing request was acknowledged, the activity in which it is executed is run; otherwise, it is stopped. If you find this condition, you can print 'Yes' as the answer." +
              " You can also print 'Yes' if you find some activity whose name indicates some kind of right to object to automated processing handling. In every other case, including cases of insecurity, print 'No' as the answer." +
              "Example of case you can answer 'Yes': \n { Participant: User (empty pool) } {Participant: Company <Activity name: Request to interrupt automated data processing Type: StartEvent ID: Event_0c4vuea Exchange with other partecipations: Receive a message from User /> linked to: <Activity name: Interrupt automated data processing Type: SendTask ID: Activity_1jivsdy Exchange with other partecipations: Send a message to User /> linked to: <Activity name: end Type: EndEvent ID: Event_06k7hmz Exchange with other partecipations: no exchanges /> End Participant: Company}" +
              "Process: <Activity name: bpmn:StartEvent Type: StartEvent ID: Event_03lz4i3 Exchange with other partecipations: no exchanges /> linked to: <Activity name: bpmn:Task Type: Task ID: Activity_1f7gg9f Exchange with other partecipations: no exchanges /> linked to: <Activity name: bpmn:Task Type: Task ID: Activity_0xq7izg Exchange with other partecipations: no exchanges /> linked to: <Activity name: bpmn:EndEvent Type: EndEvent ID: Event_0gma890 Exchange with other partecipations: no exchanges /> <Activity name: bpmn:StartEvent Type: StartEvent ID: Event_159sevf Exchange with other partecipations: no exchanges /> linked to: <Activity name: Handle Automated Processing Objection Type: Task ID: Activity_1u27rt4 Exchange with other partecipations: no exchanges /> linked to: <Activity name: bpmn:EndEvent Type: EndEvent ID: Event_0vkkept Exchange with other partecipations: no exchanges /> End Process" +
              "Process: <Activity name: bpmn:StartEvent Type: StartEvent ID: Event_03lz4i3 Exchange with other partecipations: no exchanges /> linked to: <Activity name: bpmn:Task Type: Task ID: Activity_1f7gg9f Exchange with other partecipations: no exchanges /> linked to: <Activity name: bpmn:Task Type: Task ID: Activity_0xq7izg Exchange with other partecipations: no exchanges /> linked to: <Activity name: bpmn:EndEvent Type: EndEvent ID: Event_0gma890 Exchange with other partecipations: no exchanges /> <Activity name: bpmn:StartEvent Type: StartEvent ID: Event_159sevf Exchange with other partecipations: no exchanges /> linked to: <Activity name: Right to Object to automated Processing Type: Task ID: Activity_1u27rt4 Exchange with other partecipations: no exchanges /> linked to: <Activity name: bpmn:EndEvent Type: EndEvent ID: Event_0vkkept Exchange with other partecipations: no exchanges /> End Process"
          );
          const hasRightToObjectAutomatedProcessing =
            hasRightToObjectAutomatedProcessingReq.content;
          console.log(
            "hasRightToObjectAutomatedProcessing?",
            hasRightToObjectAutomatedProcessing
          );
          addTextBelowButton(id, hasRightToObjectAutomatedProcessing);
          break;
        case "dropDownH":
          const hasRightToRestrictProcessingReq = await callChatGpt(
            "Consider to be a GDPR specialist that needs to understand the level of GDPR compliance of a process by analyzing the logical description of the process and its textual description. The logic description is this one:\n " +
              description +
              ". This is the textual description of the xml of the process, where you can analyze every connection and activity." +
              currentXML +
              " Conduct the analysis of the process by considering the names of the activities and the logic behind the process itself: " +
              ".\n\nObjective: You have to understand if the process provided is compliant with the Right to object to restrict processing or not.Definition of Right to Restrict Processing: It gives a Data Subject (the person the data is about) the right to limit the way an organization (data controller) uses their personal data, rather than requesting erasure. When the Data Subject sends a request availing the right to restrict the processing of her personal data, the Data Controller has to (i) collect the data concerned by the request, (ii) temporarily move the involved data to another processing system that is not accessible by users, (iii) erase the data from the database and (iv) disseminate notification of data restriction to the Data Subject and to all the recipients of such data. So the request is fulfilled. In the BPMN model, these activities should be put in sequence apart from the notifications," +
              "which can be executed in any order. These same notifications could be modeled with message events or with send activities. Specifically, the notification to the Data Subject can be modeled with an intermediate throwing message event, given the simplicity and the immediacy of the notification; instead, due to the multiplicity of recipient organizations and the complexity of the notification, a multi-instance send activity is required to notify the data restriction to all the data recipients. In other words, the Data Subject is the one who sent the restriction request, so she expects a notification such as 'Data Restricted'; differently the recipients become aware of the restriction only when they receive a notification, thus such notification should be more detailed. It has to be noted that a restriction does not imply a loss of the data, but the concerned data is erased from the Personal Data DB only after it has been stored in a private database so that it could be easily recovered afterward. In addition, the procedure should be completed before the 1-month timer expires, if it happens the Data Controller can ask for additional time to manage the request, but an explanation has to be provided to the Data Subject. An event sub-process starting with a timer event should be provided in the BPMN model. A request for restriction of personal data processing can occur under certain circumstances, however, every company handling personal data should dispose of a pattern managing a restriction request whenever it occurs, coming to the request directly from the Data Subject. In the case of the phone company, the new client can contest the correctness of her data and ask for restrictions while verifications take place, or a data breach can have occurred and the company has lost some data. If the customer expresses her willingness to keep her data stored by the company, so that she could easily restart the procedure once data has been rectified or recovered, a restricted processing procedure has to be executed." +
              ".\n\nStep1. If there are more participants, Identify if there is an activity where the Data Subject communicates her will to restrict the processing of their data. Also, check if the data controller acknowledges the request of the data subject and restricts the processing of the data accordingly." +
              "\nIf you find this behavior, print 'Yes' as the answer. " +
              "\nIf the Data Controller does not acknowledge the request of the data subject or if it takes no action after receiving the request, print 'No' as the answer." +
              "\nStep 2If there aren't two different participants in the process, check if there is an event that reports a request to restrict the processing of the data, and if there is a gateway that indicates whether the restrict processing request was acknowledged, and if there is an activity whose name indicates some restriction being executed on the data of the subject processed. " +
              "\nIf you find this condition, you can print 'Yes' as the answer. You can also print 'Yes' if you find some activity whose name indicates some kind of right to restrict processing handling. In every other case, including cases of insecurity, print 'No' as the answer." +
              "Example of textual description that handle the right and for which you can answer 'Yes'\n { Participant: user (empty pool) } {Participant: Company <Activity name: Request to restrict data processing Type: StartEvent ID: Event_0c4vuea Exchange with other partecipations: Receive a message from user /> linked to: <Activity name: Restrict Processing Type: Task ID: Activity_1jivsdy Exchange with other partecipations: no exchanges /> linked to: <Activity name: End process Type: EndEvent ID: Event_06k7hmz Exchange with other partecipations: no exchanges /> End Participant: Company}" +
              "Example of textual description that handle the right and for which you can answer 'Yes'\n Process: <Activity name: bpmn:StartEvent Type: StartEvent ID: Event_080scd0 Exchange with other partecipations: no exchanges /> linked to: <Activity name: Handle right to restrict processing Type: Task ID: Activity_0dz581c Exchange with other partecipations: no exchanges /> linked to: <Activity name: bpmn:EndEvent Type: EndEvent ID: Event_0t2gigi Exchange with other partecipations: no exchanges />"
          );

          const hasRightToRestrictProcessing =
            hasRightToRestrictProcessingReq.content;
          console.log(
            "hasRightToRestrictProcessing?",
            hasRightToRestrictProcessing
          );
          addTextBelowButton(id, hasRightToRestrictProcessing);
          break;
        case "dropDownI":
          const hasRightToBeForgottenReq = await callChatGpt(
            "Consider to be a GDPR specialist that needs to understand the level of GDPR compliance of a process by analyzing the logical description of the process and its textual description. The logic description is this one:\n " +
              description +
              ". This is the textual representation of the XML of the process, where you can analyze every connection and activity. Conduct the analysis of the process by considering the names of the activities and the logic behind the process itself: " +
              currentXML +
              ".\n\nObjective: You have to understand if the process provided is compliant with the Right to be Forgotten or not. Definition of Right to be Forgotten: If the Data Subject (the person the data is about) wants their data to be deleted, the Data Controller has the obligation to satisfy this request." +
              "Right to be Forgotten. When the Data Subject sends a request availing the right to be forgotten, the Data Con- troller has to retrieve the data related to the request and check if this data is relevant. If not, the Data Controller eliminates such data and communicates this to the Data Subject. Otherwise, the Data Controller communicates to the Data Subject why the data is relevant. " +
              "\nStep1:\n1. Identify if there is an activity where the Data Subject communicates their desire to be forgotten or requests the deletion of het data. Also, check if the data controller acknowledges the request of the data subject and deletes the data accordingly." +
              "\nIf you find this behavior, print 'Yes' as the answer." +
              "\nIf the Data Controller does not acknowledge the request of the data subject or if it takes no action upon receiving the request, print 'No' as the answer. " +
              "\nStep2 If there aren't two different participants in the XML, check if there is an event that reports a request from the data subject to delete/remove her data, and if there is a gateway that indicates whether the deletion data request was acknowledged, and if there is an activity whose name indicates that the deletion of the data was executed." +
              "\n If you find this condition, you can print 'Yes' as the answer. You can also print 'Yes' if you find some activity whose name indicates some kind of right to be forgotten handling. In every other case, including cases of insecurity, print 'No' as the answer." +
              "Example of textual representation in which there is everything to replay 'Yes' to the question: \n { Participant: User (empty pool) } {Participant: Controller <Activity name: Request of data data deletion Type: StartEvent ID: Event_0c4vuea Exchange with other partecipations: Receive a message from User /> linked to: <Activity name: Delete data and inform the user Type: SendTask ID: Activity_1jivsdy Exchange with other partecipations: Send a message to User /> linked to: <Activity name: end Type: EndEvent ID: Event_06k7hmz Exchange with other partecipations: no exchanges /> End Participant: Controller}" +
              "Example of textual representation in which there is everything to replay 'Yes' to the question:\n Process: <Activity name: bpmn:StartEvent Type: StartEvent ID: Event_1wz4lq0 Exchange with other partecipations: no exchanges /> linked to: <Activity name: Handle Data deletion Type: Task ID: Activity_1qy0fyz Exchange with other partecipations: no exchanges /> linked to: <Activity name: bpmn:EndEvent Type: EndEvent ID: Event_0itlnkb Exchange with other partecipations: no exchanges /> End Process: "
          );

          const hasRightToBeForgotten = hasRightToBeForgottenReq.content;
          console.log("hasRightToBeForgotten?", hasRightToBeForgotten);
          addTextBelowButton(id, hasRightToBeForgotten);
          break;
        case "dropDownL":
          const hasRightToBeInformedAboutDataBreachesReq = await callChatGpt(
            "Consider to be a GDPR specialist that needs to understand the level of GDPR compliance of a process by analyzing the logical description of the process and its textual description. The logic description is this one:\n " +
              description +
              ". This is the textual description of the process, where you can analyze every connection and activity. Conduct the analysis of the process by considering the names of the activities and the logic behind the process itself: " +
              currentXML +
              ".\n\nObjective: You have to understand if the process provided is compliant with the Right to be Informed about Data Breaches or not. Definition of Right to be Informed about Data Breaches: In the event of a data breach, the Data Controller is required to communicate it within 72 hours to the National Authority as well as to the Data Subject. This constraint is not subject to any de minimis standard; thus, any data breach, regardless of its magnitude, must always be communicated along with the actions that will be taken to limit the damage. The only exception is if the stolen data is not usable (e.g., encrypted). However, even in this case, the National Authority can compel the Data Controller to communicate the breach to the Data Subject." +
              "Right to Be Notified of Data Breaches. In case of a Data Breach, the Data Controller has to retrieve the breached data. From this data, the Data Controller needs to extract a list of Data Subjects who had their data breached. Then, in parallel, the Data Controller needs to limit the data loss and send a notification to the National Authority. For each breached Data Subject, the Data Controller evaluates if the stolen data is usable or not. If not, and if the Data Controller is proven to manage data using high-security standards, this is communicated to the National Authority which decides whether the breach should be communicated to the Data Subject or not. Otherwise, the Data Controller needs to notify the Data Subject directly." +
              "\nStep1:\n1. Identify if there is an activity where the Data Controller communicates the data breaches to the national authority and to the data subject. " +
              "\nIf you find this behavior, print 'Yes' as the answer." +
              "\nStep2: If there aren't three different participants in the XML, check if there are any events that trigger the sending of a message to the national authority and to the data subject to inform them about the data breaches." +
              "\n In that case, you can print 'Yes' as the response. You can also print 'Yes' if you find some activity that, by its name, indicates some kind of data breach handling. In every other case, including cases of insecurity, print 'No' as the answer." +
              "Example of correct process where you have to reply yes: \n { Participant: user (empty pool) } {Participant: Company <Activity name: Check if there are data breaches Type: Task ID: Activity_1jivsdy Exchange with other partecipations: no exchanges /> linked to: [Start Exclusive Gateway Gateway_0p619nk (only one of the path can be taken) condition to check in order to proceed with the right path 'Data breaches?' different paths: Path of Gateway_0p619nk taken if: 'Yes' linked to <Activity name: Inform the subject and the data authority Type: IntermediateThrowEvent ID: Event_0hpdw9n Exchange with other partecipations: Send a message to user National Authority /> linked to Gateway_1dwsutx Path of Gateway_0p619nk taken if: 'no' linked to Gateway_1dwsutx End paths of ExclusiveGateway Gateway_0p619nk ] [Closure Exclusive Gateway Gateway_1dwsutx] linked to: <Activity name: End Type: EndEvent ID: Event_12ew51e Exchange with other partecipations: no exchanges /> <Activity name: start Type: StartEvent ID: Event_0c4vuea Exchange with other partecipations: Receive a message from user /> linked to: End Participant: Company} { Participant: National Authority (empty pool) } "
          );

          const hasRightToBeInformedAboutDataBreaches =
            hasRightToBeInformedAboutDataBreachesReq.content;
          console.log(
            "hasRightToBeForgotten?",
            hasRightToBeInformedAboutDataBreaches
          );
          addTextBelowButton(id, hasRightToBeInformedAboutDataBreaches);
          break;

          case "dropDownM":
          const hasRightToBeNotifiedReq = await callChatGpt(
          "Consider to be a GDPR specialist that needs to understand the level of GDPR compliance of a process by analyzing the logical description of the process and its textual description. The logic description is this one:\n " +
          description +
          ". This is the textual description of the process, where you can analyze every connection and activity. Conduct the analysis of the process by considering the names of the activities and the logic behind the process itself: " +
          currentXML +
          ".\n\nObjective: You have to understand if the process provided is compliant with the Right to Notification as defined by GDPR Articles 13 and 14 or not.\n\nDefinition of Right to Notification: According to Articles 13 and 14 of the GDPR (Information to be provided where personal data are collected from the data subject), the Data Controller must provide clear and transparent information to the Data Subject. This includes communicating the recipients or categories of recipients of the personal data. This information should be provided at the time the data is collected, and it should be easily accessible and understandable by the Data Subject." +
          "\nStep1:\n1. Identify if there is an activity where the Data Controller communicates the recipients or categories of recipients of the personal data to the Data Subject." +
          "\nIf you find this behavior, print 'Yes' as the answer." +
          "\nStep2:\nIf there are no participants, check if there are any activities or events that provide information about the recipients or categories of recipients to the Data Subject." +
          "\nIf you find this condition, print 'Yes'. Otherwise, print 'No'." +
          "Example of correct process: \n { Participant: Controller <Activity name: Inform Data Subject of Recipients Type: Task ID: Activity_1234 Exchange with other participants: Send information to Data Subject /> }" +
          "Example of incorrect process: \n { Participant: Controller <Activity name: Collect Data Type: Task ID: Activity_0000 Exchange with other participants: no exchanges /> }"
          );

        const hasRightToBeNotified = hasRightToBeNotifiedReq.content;
        console.log(
        "hasRightToBeNotified?",
        hasRightToBeNotified
      );
      addTextBelowButton(id, hasRightToBeNotified);
      break;
      }
    }
  } catch (e) {
    console.error("Error in prediction chatGPT", e);
  }
}

//the green loading to add
/*
<div class="tenor-gif-embed" data-postid="27042978" data-share-method="host" data-aspect-ratio="1" data-width="100%"><a href="https://tenor.com/view/loading-green-loading-gimp-gif-gif-27042978">Loading Green Loading Sticker</a>from <a href="https://tenor.com/search/loading-stickers">Loading Stickers</a></div> <script type="text/javascript" async src="https://tenor.com/embed.js"></script>
*/

//function to create a drop down
//id:id to use for the dropdown ex "dropDownA"
//isExpanded: whether the dropdown must be expanded
//text Content: the macro title of the drop down
//questionText: the question itself
//isDisabled: is disabled or can me clicked?
//valueButton: if the question was answered with was the answer Yes or No
async function createDropDown(
  id,
  isExpanded,
  textContent,
  questionText,
  isDisabled,
  valueButton
) {
  //the row that will contain the drop down
  const space = document.querySelector("#areaDropDowns");
  const row = document.createElement("div");
  var addLoader = true;
  row.className = "row";
  //
  const dropDown = document.createElement("div");
  dropDown.className = "dropdown";
  dropDown.style.width = "100%";
  dropDown.id = id;

  if (valueButton == null) {
    predictionChatGPT(id);
  } else {
    removeChatGPTTip(id);
  }

  const button = document.createElement("button");
  button.className = "btn";
  button.setAttribute("type", "button");
  button.setAttribute("data-bs-toggle", "collapse");
  if (!isDisabled) {
    button.style.border = "0.00002vh solid";
    button.style.backgroundColor = "white";
  } else {
    button.removeAttribute("data-bs-toggle");
    button.style.backgroundColor = "#f0f0f0";
    button.style.border = "0.00002vh solid gray";
  }

  button.setAttribute("href", "#ulCollapse" + id);

  button.style.width = "100%";
  button.setAttribute("ariaExpanded", isExpanded);
  button.style.fontSize = "1.6vh";
  button.textContent = textContent;
  dropDown.appendChild(button);

  const ulContainer = document.createElement("div");
  ulContainer.id = "ulCollapse" + id;
  ulContainer.style.width = "100%";
  ulContainer.className = "collapse";

  const ul = document.createElement("div");
  ul.style.width = "100%";
  ul.className = "card card-body";

  ulContainer.appendChild(ul);

  const divQuestion = document.createElement("div");
  divQuestion.className = "container-centered";
  const question = questionText;
  divQuestion.style.fontSize = "1.4vh";

  const questionNode = document.createTextNode(question);

  divQuestion.appendChild(questionNode);

  const divButtons = document.createElement("div");
  divButtons.className = "row";
  divButtons.style.marginTop = "2vh";

  const yescol = document.createElement("div");
  yescol.className = "col  text-center";

  const nocol = document.createElement("div");
  nocol.className = "col  text-center";

  divButtons.appendChild(yescol);
  divButtons.appendChild(nocol);

  const YesButton = document.createElement("button");
  YesButton.className = "btn btn-light";
  YesButton.style.border = "0.01vh solid black";
  YesButton.textContent = "Yes";
  YesButton.style.fontSize = "1.4vh";

  YesButton.id = "yes_" + id;

  const NoButton = document.createElement("button");
  NoButton.className = "btn btn-light";
  NoButton.style.border = "0.01vh solid black";
  NoButton.textContent = "No";
  NoButton.style.fontSize = "1.4vh";

  NoButton.id = "no_" + id;

  if (valueButton == "Yes") {
    YesButton.style.border = "0.3 solid #10ad74";
    addLoader = false;
  } else if (valueButton == "No") {
    NoButton.style.border = "0.3 solid #10ad74";
    addLoader = false;
  }

  YesButton.addEventListener("click", async function (event) {
    switch (id) {
      case "dropDownA":
        yesdropDownA();
        break;
      case "dropDownB":
        yesHandler("B", "C");
        break;
      case "dropDownC":
        yesHandler("C", "D");
        break;
      case "dropDownD":
        yesHandler("D", "E");
        break;
      case "dropDownE":
        yesHandler("E", "F");
        break;
      case "dropDownF":
        yesHandler("F", "G");
        break;
      case "dropDownG":
        yesHandler("G", "H");
        break;
      case "dropDownH":
        yesHandler("H", "I");
        break;
      case "dropDownI":
        yesHandler("I", "L");
        break;
      case "dropDownL":
        yesHandler("L", "M");
        break;
      case "dropDownM":
        yesHandler("M", null);
        break;
      default:
        break;
    }

    var comp = await checkCompleteness();
    if (comp) {
      setGdprButtonCompleted(true);
    }
    if (valueButton == null) {
      openDrop(id, "yes", true);
    } else {
      openDrop(id, "yes", false);
    }
  });

  NoButton.addEventListener("click", async function (event) {
    switch (id) {
      case "dropDownA":
        nodropDownA();
        break;
      case "dropDownB":
        nodropDownB(false);
        break;
      case "dropDownC":
        noHandler(
          right_to_access,
          "Access Request Received",
          "Access Request fulfilled",
          "right_to_access",
          "bpmn:MessageEventDefinition",
          "C",
          "D"
        );
        break;
      case "dropDownD":
        noHandler(
          right_to_portability,
          "Portability Request Received",
          "Portability Request fulfilled",
          "right_to_portability",
          "bpmn:MessageEventDefinition",
          "D",
          "E"
        );
        break;
      case "dropDownE":
        noHandler(
          right_to_rectify,
          "Rectification Request Received",
          "Rectification Request fulfilled",
          "right_to_rectify",
          "bpmn:MessageEventDefinition",
          "E",
          "F"
        );
        break;
      case "dropDownF":
        noHandler(
          right_to_object,
          "Objection Request Received",
          "Objection Request fulfilled",
          "right_to_object",
          "bpmn:MessageEventDefinition",
          "F",
          "G"
        );
        break;
      case "dropDownG":
        noHandler(
          right_to_object_to_automated_processing,
          "Objection to Automated Processing Request Received",
          "Objection to Automated Processing Request fulfilled",
          "right_to_object_to_automated_processing",
          "bpmn:MessageEventDefinition",
          "G",
          "H"
        );
        break;
      case "dropDownH":
        noHandler(
          right_to_restrict_processing,
          "Processing Restriction Request Received",
          "Processing Restrict Request fulfilled",
          "right_to_restrict_processing",
          "bpmn:MessageEventDefinition",
          "H",
          "I"
        );
        break;
      case "dropDownI":
        noHandler(
          right_to_be_forgotten,
          "Request to be Forgotten Received",
          "Request to be Forgotten fulfilled",
          "right_to_be_forgotten",
          "bpmn:MessageEventDefinition",
          "I",
          "L"
        );
        break;
      case "dropDownL":
        noHandler(
          right_to_be_informed_of_data_breaches,
          "Data Breach occurred",
          "Data Breach Managed",
          "right_to_be_informed_of_data_breaches",
          "bpmn:MessageEventDefinition",
          "L",
          "M"
        );
        break;
        case "dropDownM":
          noHandler(
              right_to_notification,
              "Notification Request Received",
              "Notification Request Fulfilled",
              "right_to_notification",
              "bpmn:MessageEventDefinition",
              "M",
              null
          );
          break; 
      default:
        break;
    }
    var comp2 = await checkCompleteness();
    if (comp2) {
      setGdprButtonCompleted(true);
    }
    if (valueButton == null && id != "dropDownB") {
      openDrop(id, "no", true);
    } else if (id != "dropDownB") {
      openDrop(id, "no", false);
    }
  });

  yescol.appendChild(YesButton);
  nocol.appendChild(NoButton);

  ul.appendChild(divQuestion);
  ul.appendChild(divButtons);
  if (addLoader) {
    questionDone(id);

    const divLoading = document.createElement("div");
    divLoading.style.justifyContent = "center";
    divLoading.style.alignItems = "center";
    //divLoading.style.marginLeft = "45%";
    divLoading.id = "imgLoader_" + id;

    const Loading = document.createElement("img");
    Loading.style.height = "4vh";
    Loading.style.width = "4vh";
    Loading.style.marginLeft = "45%";
    Loading.style.marginTop = "5%";

    Loading.src = loading;

    const textUnderLoading = document.createElement("div");
    textUnderLoading.innerHTML =
      "<center>Loading LLM-based suggestions</center>";
    textUnderLoading.style.fontSize = "1.1vh";
    textUnderLoading.style.marginTop = "2%";
    textUnderLoading.style.color = "rgba(32, 170, 42, 1)";
    textUnderLoading.style.fontWeight = "bold";

    divLoading.appendChild(Loading);
    divLoading.appendChild(textUnderLoading);
    ul.appendChild(divLoading);
  }

  dropDown.appendChild(ulContainer);

  row.appendChild(dropDown);
  space.appendChild(row);

  return dropDown;
}
//end function create the dropDown

//funtion to set the gdpr button as completed or remove the complete button
export function setGdprButtonCompleted(isCompleted) {
  /*const gdpr_button = document.querySelector("#gdpr_compliant_button");
  gdpr_button.style.backgroundImage = `url(${gdprAchived})`;
  if (
    gdpr_button.style.backgroundImage != `url(${gdprAchived})` &&
    isCompleted
  ) {
    //gdpr_button.style.backgroundImage = `url(${gdprAchived})`;
  } else {
    gdpr_button.style.backgroundImage = `url(${gdprImage})`;
  }*/
}
//

//function to remove ul from drop down and sign it as passed
function removeUlFromDropDown(dropDown) {
  const dropDownA = document.querySelector(dropDown);

  if (dropDownA) {
    const child = dropDownA.querySelector(".collapse");
    if (child) {
      while (child.firstChild) {
        child.removeChild(child.firstChild);
      }
      //dropDownA.removeChild(child);
      dropDownA.click();
      const button = dropDownA.querySelector(".btn");
      if (button) {
        button.setAttribute("data-bs-toggle", "");

        if (dropDown == "#dropDownA") button.className = "btn";
        button.style.border = "0.0002vh solid #2CA912";
        //button.style.borderRadius = "1vh";
        //button.style.marginTop = "0.3vh";
      } else {
        console.error("error in finding the button");
      }
    } else {
      console.log("Not possible to remove the child ul from the dropdownA");
    }
    dropDownA.removeAttribute("data-bs-toggle");
  } else {
    console.error("Elemento #dropDownA non trovato.");
  }
}
//end function to remove ul

//function to sign the question as done
export function questionDone(dD) {
  const dropDown = document.querySelector(dD);
  if (dropDown) {
    const button = dropDown.querySelector(".btn");
    if (button) {
      button.style.border = " 0.0002vh solid #2CA912";
      button.click();
    } else {
      console.error("error in finding the button");
    }
  }
}
//

function removeC3() {
  const c3Set = document.querySelectorAll(".checkbox-suggested");
  if (c3Set.length > 0) {
    c3Set.forEach((c3) => {
      c3.remove();
      c3 = null;
    });
  }
}

//function to create ul and handle activity selection
async function createUlandSelectActivities(
  dropDownID,
  titleText,
  activities_already_selected
) {
  cleanSelection();
  const dropDown = document.querySelector(dropDownID);
  const space = document.querySelector("#areaDropDowns");
  var activityFromMeta = [];
  const collapse = dropDown.querySelector(".collapse");

  if (collapse) {
    while (collapse.firstChild) {
      collapse.removeChild(collapse.firstChild);
    }

    const button = dropDown.querySelector(".btn");
    button.addEventListener("click", function (event) {
      const isOpen =
        button.className != "btn collapsed" || button.ariaExpanded == true;

      if (!isOpen) {
        decolorEverySelected();
      } else {
        //se il drop di C è aperto
        getAnswerQuestionX("questionB").then((result) => {
          if (result && result.length > 0) {
            activityFromMeta = result;
            result.forEach((act) => {
              colorActivity(act.id);
            });
          }
        });
        getActivities().then((result) => {
          if (result && result.length > 0) {
            result.forEach((act) => {
              const c = document.getElementById("checkbox_" + act.id);
              if (c && c.checked) {
                colorActivity(act.id);
              }
            });
          }
        });
      }
    });

    const ulDropDown = document.createElement("div");
    ulDropDown.className = "card card-body";
    collapse.appendChild(ulDropDown);

    const Title = document.createTextNode(titleText);
    const divTitle = document.createElement("div");
    divTitle.className = "container-centered";
    divTitle.style.fontSize = "1.4vh";
    divTitle.appendChild(Title);

    const divActivities = document.createElement("div");
    divActivities.style.height = "15vh";
    divActivities.style.overflowY = "auto";
    divActivities.style.overflowX = "hidden";
    divActivities.style.marginLeft = "1vh";
    divActivities.style.marginTop = "1.5vh";

    ulDropDown.appendChild(divTitle);
    ulDropDown.appendChild(divActivities);

    try {
      const activities = await getActivities();
      if (activities.length === 0) {
        divActivities.style.display = "flex";
        divActivities.style.justifyContent = "center";
        divActivities.style.fontWeight = "bold";
        divActivities.textContent = "No activities available";
        divActivities.style.fontSize = "1.4vh";
      } else {
        const form = document.createElement("form");

        activities.forEach((activity) => {
          const row = document.createElement("div");
          row.className = "row";
          row.id = "row_checkbox_" + activity.id;

          const c1 = document.createElement("div");
          c1.className = "col-1";
          c1.style.alignItems = "center";
          c1.id = "col_checkbox_" + activity.id;
          c1.style.marginTop = "0.7vh";

          const c2 = document.createElement("div");
          c2.style.alignItems = "center";
          c2.className = "col-9";

          var c3 = null;

          const checkmark = document.createElement("span");
          checkmark.className = "checkmark";

          const label = document.createElement("label");
          label.textContent =
            activity.name != null &&
            activity.name != undefined &&
            activity.name != ""
              ? activity.name
              : activity.id;
          label.id = "label:" + activity.id;
          label.style.fontSize = "1.3vh";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.name = "activity";
          checkbox.value = activity.id;
          checkbox.id = "checkbox_" + activity.id;
          checkbox.style.fontSize = "1.9vh";
          checkbox.style.marginBottom = "0.2vh";

          if (activities_already_selected) {
            if (
              activities_already_selected.some(
                (item) => item.id === activity.id
              )
            ) {
              checkbox.checked = true;
            } else {
              checkbox.checked = false;
            }
          }

          //if the activity is suggested by AI
          if (
            !activities_already_selected ||
            activities_already_selected.length == 0
          ) {
            const activitySuggested = JSON.parse(
              localStorage.getItem("activities_suggested")
            );
            if (
              activitySuggested &&
              activitySuggested.some((act) => act === activity.id) &&
              !document.getElementById("c3_checkbox_" + activity.id)
            ) {
              c2.className = "col-5";
              c3 = document.createElement("div");
              c3.id = "c3_checkbox_" + activity.id;
              c3.innerHTML = "LLM-based Suggestion";
              c3.style.marginLeft = "2px";
              c3.className = "col-4 checkbox-suggested";
              c3.style.marginTop = "2%";
              c3.style.fontSize = "1vh";
              checkbox.style.backgroundColor = "rgba(16, 173, 116, 0.3)";
              checkbox.style.border = "0.1em solid #2ca912";
            }
          }
          //

          checkbox.addEventListener("click", function (event) {
            if (event.target.checked == true) {
              colorActivity(event.target.value);
              checkbox.style.backgroundColor = "white";
              checkbox.style.border = " 0.1em solid black";
            } else {
              decolorActivity(event.target.value);
            }
          });

          label.addEventListener("click", function (event) {
            const id = label.id.split(":")[1];
            const checkbox = document.getElementById("checkbox_" + id);
            if (checkbox) {
              checkbox.checked = !checkbox.checked;
              if (checkbox.checked) {
                colorActivity(checkbox.value);
              } else {
                decolorActivity(checkbox.value);
              }
            }
          });

          c1.appendChild(checkbox);
          c2.appendChild(label);

          row.appendChild(c1);
          row.appendChild(c2);
          if (c3) row.appendChild(c3);

          form.appendChild(row);
        });

        const subDiv = document.createElement("div");
        subDiv.className = "row";
        subDiv.style.justifyContent = "center";

        const submitButton = document.createElement("button");
        submitButton.className = "btn btn-light btn-sm";
        submitButton.textContent = "Submit";
        submitButton.style.width = "30%";
        submitButton.style.fontSize = "1.5vh";
        submitButton.type = "submit";
        submitButton.id = "submit_" + dropDownID;

        subDiv.appendChild(submitButton);
        ulDropDown.appendChild(form);
        ulDropDown.appendChild(subDiv);

        submitButton.addEventListener("click", async function (event) {
          // Prevent the default form submission behavior
          event.preventDefault();
          if (localStorage.getItem("activity_suggested")) {
            localStorage.remove("activities_suggested");
          }
          // Get the selected activities
          const selectedActivities = Array.from(
            form.querySelectorAll("input[name='activity']:checked")
          ).map((checkbox) =>
            activities.find((activity) => activity.id === checkbox.value)
          );

          // Update the button styles
          submitButton.style.border = "2px solid #2CA912";
          submitButton.style.backgroundColor = "white";

          // Call the questionDone function
          questionDone("#dropDownB");
          removeC3();

          removeChatGPTTip("dropDownB");

          try {
            // Get the setted activity
            const callSelected = await getSettedActivity("questionB");
            console.log(
              "callSelected",
              callSelected,
              "\n",
              "selectedActivity ",
              selectedActivities,
              "\n"
            );
            if (callSelected.length > 0) {
              // Remove consent from activities not selected
              callSelected.forEach((element) => {
                if (!selectedActivities.some((item) => item.id == element.id)) {
                  removeConsentFromActivity(element, "consent_");
                }
              });

              // Reorder the diagram

              reorderDiagram();
            }
            // Add the selected activities to the path
            addBPath(selectedActivities, activities_already_selected);
            // Open the dropdown
            openDrop("dropDownB", "yes", true);
            // Decolor every selected element
            decolorEverySelected();
          } catch (error) {
            console.error("Error during the process:", error);
          }
        });

        divActivities.appendChild(form);
      }
    } catch (e) {
      console.error("error in getting activities", e);
    }
  }
}
//end function to create ul and handle activity selection

//function to mark as completed some question
//metainfo structure
//{"MetaInfo1": "Value"}
//xml passed not parsed
async function addMetaInformation(metaInfo) {
  const xmlString = await getDiagram();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  // Verifica se il namespace `meta:` è già presente nel documento
  const existingMetaNamespace = xmlDoc.lookupNamespaceURI("meta");
  if (!existingMetaNamespace) {
    xmlDoc.documentElement.setAttributeNS(
      "http://www.w3.org/2000/xmlns/",
      "xmlns:meta",
      "http://example.com/metaInfo"
    );
  }

  const bpmnDocumentation = xmlDoc.createElementNS(
    "http://www.omg.org/spec/BPMN/20100524/MODEL",
    "bpmn:documentation"
  );
  bpmnDocumentation.setAttribute("id", "MetaInformation_gdpr");

  const bpmnMetaInfo = xmlDoc.createElementNS(
    "http://www.omg.org/spec/BPMN/20100524/MODEL",
    "bpmn:metaInfo"
  );

  Object.keys(metaInfo).forEach((key) => {
    const metaQuestionA = xmlDoc.createElementNS(
      existingMetaNamespace || "http://example.com/metaInfo",
      "meta:" + key
    );
    metaQuestionA.textContent = metaInfo[key];
    bpmnMetaInfo.appendChild(metaQuestionA);
  });

  bpmnDocumentation.appendChild(bpmnMetaInfo);

  const existingDocumentation = xmlDoc.querySelector(
    "bpmn\\:documentation[id='MetaInformation_gdpr']"
  );
  if (!existingDocumentation) {
    xmlDoc.documentElement.appendChild(bpmnDocumentation);
  } else {
    existingDocumentation.appendChild(bpmnMetaInfo);
  }

  const serializer = new XMLSerializer();
  const updatedXmlString = serializer.serializeToString(xmlDoc);
  return updatedXmlString;
}
//

//function to get metadata information
async function getMetaInformationResponse() {
  try {
    const xml = await getDiagram();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "application/xml");
    const questionElements = xmlDoc.querySelectorAll("modelMetaData")[0];
    const setOfQuestions = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "L", "M"];
    var questions = {};
    setOfQuestions.forEach((letter) => {
      const valore =
        questionElements != undefined
          ? questionElements.getAttribute("question" + letter)
          : null;
      const res = valore != null ? JSON.parse(valore) : null;
      questions["question" + letter] = res;
    });
    questions["gdpr_compliant"] =
      questionElements != undefined
        ? questionElements.getAttribute("gdpr_compliant")
        : "false";
    return questions;
  } catch (error) {
    console.error("An error occurred in getMetaInformationResponse:", error);
    throw error;
  }
}
//

//function to check if is already gdpr compliant
async function isGdprCompliant() {
  try {
    const xml = await getDiagram();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "application/xml");
    const questionElements = xmlDoc.querySelectorAll("modelMetaData");

    if (questionElements.length > 0) {
      questionElements.forEach((element) => {
        const compliance = element.getAttribute("gdpr_compliant");
        if (compliance != null) {
          return compliance === true ? true : false;
        } else {
          return false;
        }
      });
    } else {
      return false;
    }
  } catch (error) {
    console.error("An error occurred in isGdprCompliant:", error);
    throw error;
  }
}
//

//function to get the set of activities ids from the set returned by the form submission
export function getActivitiesID(activities) {
  var setIds = new Set();
  activities.forEach((activity) => {
    setIds.add(activity.id);
  });
  return setIds;
}
//

//TODO: here miss the part were i add the already added activity maybe
//function to set the questions answers in json format
export function setJsonData(response, activities) {
  var setJson = new Set();
  setJson.add({ id: "response", value: response });
  if (activities) {
    activities.forEach((activity) => {
      setJson.add({ id: activity.id, value: activity.name });
    });
  }
  let arrayOggetti = Array.from(setJson);
  return JSON.stringify(arrayOggetti);
}
//end function

//function to get the set activities of a question
export async function getSettedActivity(question) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await getMetaInformationResponse();
      const questions = response;
      const requested_question = questions[question];
      var result = new Array();
      if (requested_question) {
        result = requested_question.filter((item) => item.id != "response");
      }
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}
//

export function displayDynamicAlert(message, type, time) {
  const alertContainer = document.getElementById("alertContainer");
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;

  alertDiv.setAttribute("role", "alert");
  var start = " <strong>Important!</strong>";
  if (type != "danger" && type != "warning") {
    alertDiv.style.color = "#10ad74";
    alertDiv.style.backgroundColor = "white";
    alertDiv.style.border = "0.1vh solid white";
    start = "";
    alertDiv.style.boxShadow =
      "0 4px 8px rgba(0, 0, 0, 0.1), 0 6px 20px rgba(0, 0, 0, 0.1)";
  }

  alertDiv.innerHTML =
    start +
    `
         ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
  const closeButton = alertDiv.querySelector(".btn-close");
  closeButton.addEventListener("click", () => {
    alertDiv.remove();
  });
  alertContainer.appendChild(alertDiv);
  setTimeout(() => {
    alertDiv.remove();
  }, time);
}

export function displayDynamicPopUp(message) {
  return new Promise((resolve) => {
    const alertContainer = document.getElementById("alertContainer");

    if (!alertContainer) {
      console.error("alertContainer element not found");
      resolve(false);
      return;
    }

    const alertDiv = document.createElement("div");
    alertDiv.className = "alert alert-warning alert-dismissible fade show";
    alertDiv.setAttribute("role", "alert");
    alertDiv.style.position = "fixed";
    alertDiv.style.right = "50vh";
    alertDiv.style.left = "50vh";
    alertDiv.style.width = "40%";
    alertDiv.style.left = "30%";

    alertDiv.style.bottom = "82%";
    alertDiv.style.zIndex = "1050";
    alertDiv.style.backgroundColor = "white";
    alertDiv.style.border = "0.1vh solid white";
    alertDiv.style.color = "#10ad74";
    alertDiv.style.fontSize = "1.6vh";
    alertDiv.style.boxShadow =
      "0 4px 8px rgba(0, 0, 0, 0.1), 0 6px 20px rgba(0, 0, 0, 0.1)";

    alertDiv.innerHTML = `<center>
      <strong>${message}</strong>
      <hr>
      <div class="row">
      <div class="col">
      <button type="button" class="yes-btn">Yes</button></div>
      <div class="col">
      <button type="button" class="no-btn">No</button></div></div>
    </center>`;

    alertContainer.appendChild(alertDiv);

    alertDiv.querySelector(".yes-btn").addEventListener("click", () => {
      alertDiv.remove();
      resolve(true);
    });

    alertDiv.querySelector(".no-btn").addEventListener("click", () => {
      alertDiv.remove();
      resolve(false);
    });
  });
}

function readBlob(blob) {
  const reader = new FileReader();

  reader.onload = function (event) {
    const fileContent = event.target.result;
    console.log("File content: ", fileContent);
  };
  reader.readAsText(blob);
}

//check if the user has responded to all the questions
//return true if the user has responded to all
//return false otherwise
async function checkCompleteness() {
  var result = true;
  try {
    const responseSet = await getMetaInformationResponse();
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "L", "M"];
    for (var i = 0; i < letters.length; i++) {
      if (responseSet["question" + letters[i]] == null) {
        result = false;
        break;
      }
    }
  } catch (error) {
    console.error("Errore durante il recupero delle informazioni meta:", error);
    result = false;
  }
  return result;
}
//

export {
  removeUlFromDropDown,
  createDropDown,
  createUlandSelectActivities,
  closeSideBarSurvey,
  addMetaInformation,
  getMetaInformationResponse,
  isGdprCompliant,
};
