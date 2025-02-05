# GDPR Pilot

This repository contains the codebase for my Master's thesis, developed as part of the Computer Science Engineering program at Sapienza University. The GDPR-Pilot tool is designed as an extension of BPMN.io, providing users with a robust platform for creating, editing, and refining business process models with an emphasis on GDPR (General Data Protection Regulation) compliance.

To ensure processes adhere to GDPR regulations, the tool guides users through ten critical questions that assess compliance with various obligations. These questions cover key areas, such as whether personal data is being processed and whether obligations like obtaining consent, providing access, data portability, and the right to object are fulfilled. By addressing these obligations, the tool helps identify and mitigate potential non-compliance risks.

The obligations evaluated include:

- **Consent**: Ensuring transparency and explicit consent from data subjects, with clear communication of their rights, such as withdrawing consent, accessing data, and data portability.
- **Right to Access**: Allowing data subjects to request and view all data and processing details related to them.
- **Data Portability**: Enabling data transfers to third parties upon request.
- **Right to Rectification**: Facilitating the correction of inaccurate data.
- **Right to Object**: Supporting objections to data usage, potentially halting dependent processes.
- **Automated Processing**: Providing human intervention when decisions are automated.
- **Restriction of Processing**: Securely restricting data upon request and notifying relevant parties.
- **Right to Erasure (Right to be Forgotten)**: Deleting data when it is no longer needed or upon valid requests.
- **Data Breach Notification**: Ensuring timely communication of data breaches to affected individuals and authorities.

If a compliance gap is detected, the tool automatically applies a predefined pattern to address it. Additionally, it leverages an LLM to offer suggestions, guiding users through the compliance process and helping them respond effectively to each question. This approach simplifies GDPR compliance within process modeling, ensuring clarity and ease of adherence for all users.

## Installation

Before starting the installation, you need to add an OpenAI API Key (preferably for GPT-3.5) to the `.env` file located inside the `src/js` folder under the field `API_KEY`.  
Here you can find information about the [OpenAI API](https://openai.com/index/openai-api/).

If you don't have `concurrently` installed, you need to install it:  
`npm install concurrently --save-dev`

Run the following command to start the tool:  
`npm run dev`

## Contributions

- **Prof. Andrea Marrella**
- **Prof. Simone Agostinelli**

## License

The code of this project is released under the [MIT License](./LICENSE.md), which you can find in the LICENSE.md file.

## Contacts

Email: alessia.volpi.28@gmail.com
