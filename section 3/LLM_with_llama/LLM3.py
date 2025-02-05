import re
import xml.etree.ElementTree as ET
from groq import Groq
import datetime

description = """A self-service restaurant operates in a chaotic environment where guests order at the 
till and pick up meals when called by the kitchen. To handle increased demand, the process will be streamlined 
with one staff member per guest, and buzzers will alert guests when meals are ready.
The process involves three pools: Guest, Employee, and Chef. Guests order and pay, receiving a buzzer. 
The employee informs the chef, who prepares the meal. Once ready, the employee activates the buzzer, and 
the guest picks up the meal. If the guest doesn't respond within 5 minutes, the employee will call them."""


# Funzione per estrarre i nomi delle attività da un file BPMN
def parse_bpmn_for_activities(bpmn_file):
    tree = ET.parse(bpmn_file)
    root = tree.getroot()
    
    # Elenco per raccogliere i nomi delle attività
    activities = []

    # Traverso il file BPMN per trovare tutti i tag <bpmn:task>
    for activity in root.findall('.//bpmn:task', namespaces={'bpmn': 'http://www.omg.org/spec/BPMN/20100524/MODEL'}):
        name = activity.attrib.get('name')  # Ottieni il nome dell'attività
        if name:  # Se l'attività ha un nome
            activities.append(name)
    
    print(f"Extracted activities: {activities}")  #  verifica le attività estratte
    return activities

# Funzione per chiedere al modello LLM se è stato richiesto il consenso per un'attività
def ask_for_consent(client, activity_name):
    # Crea il prompt da inviare all'LLM
    prompt = f"This is a question about consent for an activity related to GDPR (General Data Protection Regulation). If you were a human, would you provide consent for the activity '{activity_name}'? Respond as a human would, with 'yes' if you would consent or 'no, because' followed by a short explanation of why you would not consent. Do not explain anything further. The goal is to help guide a person in deciding whether to grant consent. This is the BPMN diagram description based on which you can provide your answers: {description}."

    # Richiesta al modello Llama
    completion = client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[{
            "role": "user",
            "content": prompt
        }],
        temperature=0.7,
        max_tokens=100,
        top_p=1,
        stream=False,
        stop=None,
    )

    # Estrai la risposta dall'LLM
    response = completion.choices[0].message.content.strip().lower()

    # Se la risposta è 'no', estrai la motivazione completa dopo 'no, because'
    if "no, because" in response:
        reason = response.split("no, because")[1].strip()
        # Prendi tutto ciò che viene dopo "no, because" fino al punto
        reason = reason.split('.')[0]  # Prendi la parte prima del punto
        response = f"no, because {reason}."
    elif "yes" in response:
        response = "yes"
    else:
        response = "no, because the response was unclear or invalid."

    print(f"Consent response for '{activity_name}': {response}")  # Aggiungi questa stampa per vedere la risposta dell'LLM
    
    return response

# Funzione principale per generare il file di output
def generate_activities_with_no_consent_file():
    # Inizializza il client Groq
    client = Groq(api_key='PUT HERE YOUR API_KEY')

    # Carica le attività dal file BPMN
    activities = parse_bpmn_for_activities(r'C:\Users\ferru\Desktop\parte2 tesi tests\self-service-restaurant.bpmn')  // pointer to my bpmn file
    
    # Elenco per raccogliere le attività senza consenso
    activities_without_consent = []

    # Chiedere al modello per ogni attività
    for activity in activities:
        consent_response = ask_for_consent(client, activity)
        
        # Se la risposta dell'LLM è 'no, because', aggiungi l'attività alla lista
        if "no, because" in consent_response:
            activities_without_consent.append(activity)
    
    # Crea il file di output con le attività senza consenso
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    output_file_name = f"activities_without_consent_{timestamp}.txt"
    
    with open(output_file_name, 'w') as output_file:
        output_file.write(f"# Activities without consent - {timestamp}\n\n")
        if activities_without_consent:
            output_file.write("\n".join(activities_without_consent))
        else:
            output_file.write("All activities have consent.\n")

# Esegui la funzione principale
generate_activities_with_no_consent_file()
