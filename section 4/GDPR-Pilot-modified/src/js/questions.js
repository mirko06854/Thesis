//-----------------------------QUESTIONS-----------------------------------

import {
  createDropDown,
  removeUlFromDropDown,
  createUlandSelectActivities,
  addMetaInformation,
  getActivitiesID,
  setJsonData,
  setGdprButtonCompleted,
  closeSideBarSurvey,
  questionDone,
  getSettedActivity,
  openDrop,
} from "./support.js";
import {
  getDiagram,
  editMetaInfo,
  subProcessGeneration,
  getElement,
  getPreviousElement,
  addActivityBetweenTwoElements,
  handleSideBar,
  createAGroup,
  existGdprGroup,
  addSubEvent,
  existsGdprPath,
  getAnswerQuestionX,
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
import right_to_notification from "../../resources/gdpr_compliance_patterns/right_to_notification.bpmn";

//

//----------------------------START YES HANDLER------------------------------------
//handle click yes for question A
export async function yesdropDownA() {
  await checkDropDownOrdAdd(
    "dropDownA",
    true,
    "Personal data",
    "Do you handle personal data in your process?",
    false
  );
  removeUlFromDropDown("#dropDownA");
  editMetaInfo("A", setJsonData("Yes", false));
  //allowOpenNextQuestion("B");
  enableButtons();
}
//end handle click yes for question A

//generic yes handler
//currentLetter:the letter i'm currently considering
//nextLetter: if any, is the letter of the drop i need to open after this
export function yesHandler(currentLetter, nextLetter) {
  editMetaInfo(currentLetter, setJsonData("Yes", false));
  questionDone("#dropDown" + currentLetter);
  if (nextLetter) allowOpenNextQuestion(nextLetter);
  editYesNoButton("#yes_dropDown" + currentLetter);
  removeChatGPTTip("dropDown" + currentLetter);
}
//

//----------------------------END YES HANDLER------------------------------------

//----------------------------START NO HANDLER------------------------------------

//handle click no for question A
export async function nodropDownA() {
  await checkDropDownOrdAdd(
    "dropDownA",
    true,
    "Personal data",
    "Do you handle personal data in your process?"
  );
  setGdprButtonCompleted(true);
  removeUlFromDropDown("#dropDownA");
  handleSideBar(false);
  editMetaInfo("A", setJsonData("No", false));
  editMetaInfo("gdpr", true);
}
//end handle click no for question A

export async function nodropDownB(activities_already_selected, isLast) {  // modified to handle LLM back end !
  editMetaInfo("B", setJsonData("No", false));

  // Fetch activities.txt
  let restrictedActivities = [];
  try {
    const response = await fetch("http://localhost:8000/activities.txt");
    if (!response.ok) {
      throw new Error(`Network error: ${response.status}`);
    }
    const text = await response.text();
    const lines = text.split("\n").map(name => name.trim());
    restrictedActivities = lines.slice(1); // Skip first line
  } catch (error) {
    console.error("Error fetching restricted activities:", error);
  }

  // Wait for the UI to generate checkboxes
  await createUlandSelectActivities(
    "#dropDownB",
    "Select the activities where you request personal data for the first time",
    activities_already_selected
  );

  // Add a slight delay to ensure elements exist
  setTimeout(() => {
    document.querySelectorAll("#dropDownB div").forEach(div => {
      const checkbox = div.querySelector("input[type='checkbox']");
      const label = div.querySelector("label");
      if (!checkbox || !label) return;

      const activityName = label.innerText.trim();
      if (restrictedActivities.includes(activityName)) {
        div.style.backgroundColor = "lightgrey"; // Keep background grey
        checkbox.style.accentColor = "grey"; // Checkbox remains grey
        checkbox.style.backgroundColor = "grey"; // Background stays grey

        // Ensure background stays grey even after selection
        checkbox.addEventListener("change", () => {
          div.style.backgroundColor = "lightgrey"; // Reapply grey background on change
        });
      }
    });
  }, 100); // Small delay to allow DOM update

  if (activities_already_selected) {
    questionDone("#dropDownB");
    await checkDropDownOrdAdd(
      "dropDownC",
      false,
      "User data access",
      "Do you allow users to access their data?"
    );
  }
  allowOpenNextQuestion("C");
}





//

// Handle click No for question M (Data Notification)
export async function noDropDownM(activities_already_selected, isLast) {
  // Update metadata for question M
  editMetaInfo("M", setJsonData("No", false));

  // Create a dropdown for selecting activities related to notification
  await createUlandSelectActivities(
    "#dropDownM",
    "Select the activities where data notification is required",
    activities_already_selected
  );

  if (activities_already_selected) {
    // Mark question M as completed
    questionDone("#dropDownM");

    // Check and prepare for the next question
    await checkDropDownOrdAdd(
      "dropDownN",
      false,
      "Data notification sent",
      "Do you notify users when their data is processed?"
    );
  }
}


//function to handle the click on the No button
export function noHandler(
  diagram,
  start_label,
  end_label,
  id,
  start_type,
  current_letter,
  next_letter
) {
  checkGroupOrCreate();
  if (!existsGdprPath(id)) {
    addSubEvent(diagram, start_label, end_label, id, start_type);
  }
  editYesNoButton("#no_dropDown" + current_letter);
  editMetaInfo(current_letter, setJsonData("No", false));
  if (next_letter) allowOpenNextQuestion(next_letter);
  questionDone("#dropDown" + current_letter);
  removeChatGPTTip("dropDown" + current_letter);
}
//

//----------------------------END NO HANDLER------------------------------------

//----------------------------START OTHER UTIL FUNCTIONS------------------------------------

async function addSubProcess(name, title, diagram, element, previous) {
  const subprocess = await subProcessGeneration(name, title, diagram, element);
  if (subprocess) {
    addActivityBetweenTwoElements(previous, element, subprocess);
  }
}

//function to add the path to solve B
export async function addBPath(activities, activities_already_selected) {
  const answers_done = await getAnswerQuestionX("questionB");
  await checkDropDownOrdAdd(
    "dropDownC",
    false,
    "User data access",
    "Do you allow users to access their data?"
  );
  editMetaInfo("B", setJsonData("No", activities));

  try {
    activities.forEach(async function (activity) {
      const element = getElement(activity.id);
      if (
        answers_done == null ||
        !answers_done.some((item) => item.id === activity.id)
      ) {
        var previousSet = getPreviousElement(element);
        previousSet = previousSet.filter(
          (item) => item.type != "bpmn:Participant"
        );
        if (previousSet.length > 0) {
          var i = 0;
          for (var i = 0; i < previousSet.length; i++) {
            const name = "consent_" + activity.id + "_" + i;
            await addSubProcess(
              name,
              "Right to be informed and to Consent",
              consent_to_use_the_data,
              element,
              previousSet[i]
            );
          }
        } else {
          const name = "consent_" + activity.id + "_0";
          await addSubProcess(
            name,
            "Right to be informed and to Consent",
            consent_to_use_the_data,
            element,
            null
          );
        }
      }
    });
  } catch (e) {
    console.error("Some error in addBPath", e);
  }

  //devo cercare ogni attività nel set
  //recuperare il riferimento
  //attaccare prima di questa attività la richiesta di consenso
}
//

//function to handle the creation of all the dropdown elements
//letter: the last question replied
export function createWithOnlyQuestionXExpandable(letter, questions) {
  const letters = ["B", "C", "D", "E", "F", "G", "H", "I", "L", "M"];
  var disabled = true;
  var valueA =
    questions["questionA"] == null ? null : questions["questionA"][0].value;
  if (letter == "A") {
    createDropDown(
      "dropDownA",
      true,
      "Personal data",
      "Do you handle personal data in your process?",
      false,
      valueA
    );
  } else {
    createDropDown(
      "dropDownA",
      true,
      "Personal data",
      "Do you handle personal data in your process?",
      false,
      valueA
    );
  }

  if (valueA == "Yes") {
    disabled = false;
  } else {
    disabled = true;
  }

  for (let i = 0; i < letters.length; i++) {
    switch (letters[i]) {
      case "B":
        var value =
          questions["questionB"] == null
            ? null
            : questions["questionB"][0].value == "Yes"
            ? "Yes"
            : questions["questionB"][0].value == "No"
            ? "No"
            : null;
        createDropDown(
          "dropDownB",
          false,
          "Consent",
          "Did you ask for consent before?",
          disabled,
          value
        );
        break;

      case "C":
        var value =
          questions["questionC"] == null
            ? null
            : questions["questionC"][0].value;
        createDropDown(
          "dropDownC",
          false,
          "Access data",
          "Do you allow users to access their data?",
          disabled,
          value
        );
        break;

      case "D":
        var value =
          questions["questionD"] == null
            ? null
            : questions["questionD"][0].value;
        createDropDown(
          "dropDownD",
          false,
          "Data portability",
          "Do you allow users to port their data?",
          disabled,
          value
        );
        break;

      case "E":
        var value =
          questions["questionE"] == null
            ? null
            : questions["questionE"][0].value;
        createDropDown(
          "dropDownE",
          false,
          "Rectification",
          "Do you allow users to rectify their data?",
          disabled,
          value
        );
        break;

      case "F":
        var value =
          questions["questionF"] == null
            ? null
            : questions["questionF"][0].value;
        createDropDown(
          "dropDownF",
          false,
          "Consent to data processing",
          "Do you allow users to object to data processing?",
          disabled,
          value
        );
        break;

      case "G":
        var value =
          questions["questionG"] == null
            ? null
            : questions["questionG"][0].value;
        createDropDown(
          "dropDownG",
          false,
          "Consent to automated processing",
          "Do you allow users to object to automated processing?",
          disabled,
          value
        );
        break;

      case "H":
        var value =
          questions["questionH"] == null
            ? null
            : questions["questionH"][0].value;
        createDropDown(
          "dropDownH",
          false,
          "Data Processing Restrictions",
          "Do you allow users to restrict processing on their data?",
          disabled,
          value
        );
        break;

      case "I":
        var value =
          questions["questionI"] == null
            ? null
            : questions["questionI"][0].value;
        createDropDown(
          "dropDownI",
          false,
          "Data deletion",
          "Do you allow users to be forgotten?",
          disabled,
          value
        );
        break;

      case "L":
        var value =
          questions["questionL"] == null
            ? null
            : questions["questionL"][0].value;
        createDropDown(
          "dropDownL",
          false,
          "Data breaches",
          "Do you allow users to be informed of data breaches occurred to heir data?",
          disabled,
          value
        );
        break;
      
        case "M":
          var value =
            questions["questionM"] == null
              ? null
              : questions["questionM"][0].value;
          createDropDown(
            "dropDownM",
            false,
            "Data notification",
            "Do you allow users to transfer their data to another service?",
            disabled,
            value
          );
          break;  

      default:
        break;
    }
  }
}
//

//function to get the last answer that the user has done
export function getLastAnswered(setOfQuestions) {
  var last = "A";
  const set = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "L", "M"];
  for (let i = 0; i < set.length; i++) {
    if (setOfQuestions["question" + set[i]] != null) {
      last = set[i];
    }
  }
  return last;
}
//

//function to enable again a dropdown
function allowOpenNextQuestion(nextQuestion) {
  const dropDown = document.querySelector("#dropDown" + nextQuestion);
  if (dropDown) {
    const button = dropDown.querySelector(".btn");
    if (
      button &&
      button.style.border &&
      button.style.border == "0.00002vh solid gray"
    ) {
      button.setAttribute("data-bs-toggle", "collapse");
      button.style.border = "0.00002vh solid";
      button.style.backgroundColor = "white";
    }
  }
}
//

//function to open a specific @dropdown
//dropdown: id of the dropdown to open
export function openDropDown(dropdown) {
  const dropDown = document.querySelector("#" + dropdown);
  const button = dropDown.querySelector(".btn");
  button.setAttribute("aria-expanded", "true");
}
//

//function to check if a group exists or to create it
async function checkGroupOrCreate() {
  const exist_gdpr = existGdprGroup();
  if (exist_gdpr == false) {
    createAGroup();
  } else {
    return;
  }
}
//

//function to check if exists the drop of a question, in the negative case it create a new one
async function checkDropDownOrdAdd(
  dropDown,
  bool,
  theme,
  question,
  isDisabled
) {
  if (!document.querySelector("#" + dropDown)) {
    await createDropDown(dropDown, bool, theme, question, isDisabled);
  }
}
//

//function to edit the color of the button
//idButton the id of the yes/no button i have to edit
//if id: yes then yes will have the green border and no the black one
async function editYesNoButton(idButton) {
  try {
    // Fetch AI-generated answers
    const response = await fetch("http://localhost:8000/answers.json");
    if (!response.ok) {
        throw new Error(`Network error: ${response.status}`);
    }
    const answers = await response.json();

    // Letters representing each question
    const questionLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "L", "M"];

    questionLetters.forEach(letter => {
        const aiAnswer = answers["question" + letter]?.toLowerCase();
        if (!aiAnswer) return; // Skip if no AI answer

        // Select correct and incorrect buttons
        const correctButtonId = aiAnswer === "yes" ? `#yes_dropDown${letter}` : `#no_dropDown${letter}`;
        const wrongButtonId = aiAnswer === "yes" ? `#no_dropDown${letter}` : `#yes_dropDown${letter}`;

        const correctButton = document.querySelector(correctButtonId);
        const wrongButton = document.querySelector(wrongButtonId);

        // Apply colors
        if (correctButton) {
            correctButton.style.border = "0.3vh solid #10ad74"; // Green for correct
            correctButton.style.backgroundColor = "#10ad74"; // Green background
            correctButton.style.color = "white"; // White text
        }

        if (wrongButton) {
            wrongButton.style.border = "0.01vh solid black"; // Reset incorrect
            wrongButton.style.backgroundColor = "white"; // Reset background to white
            wrongButton.style.color = "black"; // Reset text color
        }
    });

} catch (error) {
    console.error("Error loading answers:", error);
}
}

// Call the function when the page loads
//document.addEventListener("DOMContentLoaded", editYesNoButton);

//

function enableButtons() {
  const letters = ["B", "C", "D", "E", "F", "G", "H", "I", "L", "M"];
  /*const area = document.querySelector("#areaDropDowns");
  letters.forEach(letter=>{
    const name= "dropDown"+letter;
    const dropContainer = document.querySelector(name);
    console.log("drop container",dropContainer);
    if(dropContainer){
      const drop= dropContainer.querySelector(".btn");
      if(drop){
        drop.removeAttribute("data-bs-toggle");
        drop.style.border = "0.00002vh solid gray";
      }
    }
  })*/

  letters.forEach((letter) => {
    const dropDown = document.querySelector("#dropDown" + letter);
    const button = dropDown.querySelector(".btn");
    button.setAttribute("data-bs-toggle", "collapse");
    button.style.border = "0.00002vh solid";
    button.style.backgroundColor = "white";
  });
}

//id: is the dropDown id ex. dropDownA
//function to remove the p appended to show the openAI suggest
export function removeChatGPTTip(id) {
  var buttonId = false;
  var pElement = false;
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "L", "M"];

  if (document.getElementById("p_yes_" + id)) {
    buttonId = "yes_" + id;
    pElement = document.getElementById("p_yes_" + id);
  } else if (document.getElementById("p_no_" + id)) {
    buttonId = "no_" + id;
    pElement = document.getElementById("p_no_" + id);
  }
  if (pElement && buttonId) {
    pElement.remove();
    const button = document.getElementById(buttonId);
    if (button) {
      button.style.backgroundColor = "white";
    }
  }
  if (id == "dropDownB") {
    letters.forEach((letter) => {
      const checkSet = document.querySelectorAll("input[type='checkbox']");
      if (checkSet.length > 0) {
        checkSet.forEach((check) => {
          check.style.backgroundColor = "white";
          check.style.border = " 0.1em solid black";
        });
      }
    });
  }
}
//

export function removeChatGPTTipFromAll() {
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "L", "M"];
  letters.forEach((letter) => {
    removeChatGPTTip("dropDown" + letter);
  });
}
