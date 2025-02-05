import re
import xml.etree.ElementTree as ET
from groq import Groq
import os
import datetime

# Funzione per estrarre i nomi delle attività da un file BPMN
def parse_bpmn_for_activities(bpmn_file):
    tree = ET.parse(bpmn_file)
    root = tree.getroot()
    activities_without_consent = []

    # Regex per estrarre il nome dell'attività dal formato "<bpmn:task id="Task_..." name="Task Name">"
    name_regex = re.compile(r'name="([^"]+)"')

    # Traverso il file BPMN per trovare i task
    for activity in root.findall('.//bpmn:task', namespaces={'bpmn': 'http://www.omg.org/spec/BPMN/20100524/MODEL'}):
        # Estrazione del nome dell'attività con la regex
        name_match = name_regex.search(ET.tostring(activity).decode())
        if name_match:
            # Verifica se l'attività ha il consenso (presenza dell'attributo "consent")
            consent = activity.attrib.get('consent', '').lower()
            if consent == 'no':  # Se l'attività non ha consenso
                activities_without_consent.append(name_match.group(1))  # Aggiungi il nome dell'attività

    return activities_without_consent

# Funzione per pulire la risposta dell'LLM mantenendo "numero. yes" o "numero. no"
def clean_llm_response(response):
   # debug -> print("Original LLM Response:")  # Stampa la risposta originale
   # debug -> print(response)
    

    # Trova solo le risposte che corrispondono al formato "numero. yes/no"
    matches = re.findall(r"(\d+)\s*[.)]?\s*(yes|no)", response, flags=re.IGNORECASE)

    # Converte ogni tupla in una stringa con formato "numero. yes" o "numero. no"
    cleaned_response = "\n".join(f"{num}. {ans.lower()}" for num, ans in matches)

   # debug -> print("\nCleaned Response:")
   # debug -> print(cleaned_response)

    return cleaned_response.strip()

# Funzione principale per leggere il file di descrizione del lavoro e generare le risposte
def generate_answers_and_responses():
    # Inizializza il client Groq
    client = Groq(api_key='PUT_HERE_YOUR_API_KEY')

    # Leggi il file di descrizione del lavoro (contiene le domande)
    with open('jobDescription.txt', 'r') as job_description_file:
        jobDescription = job_description_file.read()  # Leggi tutto il contenuto
        questions = jobDescription.splitlines()  # Separare le domande per ogni linea

    # Crea il prompt per il modello Llama
    questions_str = "\n".join([f"{i+1}) {q}" for i, q in enumerate(questions)])

    # Richiesta al modello di rispondere a ciascuna domanda
    completion = client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[{
            "role": "user",
            "content": f"Here are some questions about data privacy: \n{questions_str}\nPlease respond ONLY with 'yes' or 'no' for each. I force you to answer yes to the first (the one about consent) and the second I force you to answer no. For the other ones, answer as you like (with just yes or no, ALWAYS), considering a balance between security and usability of data!"
        }],
        temperature=0.7,
        max_tokens=1024,
        top_p=1,
        stream=False,
        stop=None,
    )

    # Pulire la risposta dell'LLM
    raw_answers = completion.choices[0].message.content
    cleaned_answers = clean_llm_response(raw_answers)

    # Separare le risposte
    answers = cleaned_answers.split('\n')

    # Carica le attività dal file BPMN
    activities_without_consent = parse_bpmn_for_activities(r'C:\Users\ferru\Desktop\parte2 tesi tests\self-service-restaurant.bpmn')

    # Scrivere le risposte in un file di output in formato Markdown
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    output_file_name = f"suggested_answer_LLM_llama.md"

    with open(output_file_name, 'w') as output_file:
        # Scrivere l'intestazione
        output_file.write(f"# Suggested Answers - {timestamp}\n\n")

        # Scrivere le risposte alle domande
        for idx, answer in enumerate(answers):
            if idx >= len(questions):  # Se ci sono più risposte che domande
                break

            question = questions[idx]
            answer = answer.strip().lower()  # Normalizza la risposta

            output_file.write(f"## {question}\n")
            output_file.write(f"{answer}\n\n")           


# Esegui la funzione principale
generate_answers_and_responses()
