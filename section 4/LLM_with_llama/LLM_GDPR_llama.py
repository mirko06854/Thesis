import re
import xml.etree.ElementTree as ET
from groq import Groq
import os
import json
import datetime

# Funzione per pulire la risposta dell'LLM mantenendo "numero. yes" o "numero. no"
def clean_llm_response(response):
    matches = re.findall(r"(\d+)\s*[.)]?\s*(yes|no)", response, flags=re.IGNORECASE)
    cleaned_response = {str(num): ans for num, ans in matches}
    return cleaned_response

# Funzione principale per leggere il file di descrizione del lavoro e generare le risposte
def generate_answers_and_responses():
    client = Groq(api_key='PUT_YOUR_API_KEY_HERE')

    # Legge il file con le domande
    with open('jobDescription.txt', 'r') as job_description_file:
        questions = job_description_file.read().splitlines()  # Ogni riga è una domanda

    # Crea il prompt
    questions_str = "\n".join([f"{i+1}) {q}" for i, q in enumerate(questions)])

    completion = client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[{
            "role": "user",
            "content": f"Here are some questions about data privacy: \n{questions_str}\nPlease respond ONLY with 'Yes' or 'No' for each. I force you to answer yes to the first (the one about consent) and the second I force you to answer no. For the other ones, answer as you like (with just yes or no, ALWAYS), considering a balance between security and usability of data!"
        }],
        temperature=0.7,
        max_tokens=1024
    )

    # Pulisce la risposta LLM
    raw_answers = completion.choices[0].message.content
    cleaned_answers = clean_llm_response(raw_answers)

    # Crea il dizionario domanda -> risposta
    answers_dict = {questions[int(num)-1]: ans for num, ans in cleaned_answers.items() if int(num)-1 < len(questions)}

    # Scrive le risposte in un file JSON con domande complete
    output_file_name = "answers_original.json"
    with open(output_file_name, 'w') as output_file:
        json.dump(answers_dict, output_file, indent=4)

    # Crea un dizionario con lettere A, B, C, D, E, F, G, H, I, L, M come chiavi
    lettered_answers = {
        'questionA': cleaned_answers['1'],
        'questionB': cleaned_answers['2'],
        'questionC': cleaned_answers['3'],
        'questionD': cleaned_answers['4'],
        'questionE': cleaned_answers['5'],
        'questionF': cleaned_answers['6'],
        'questionG': cleaned_answers['7'],
        'questionH': cleaned_answers['8'],
        'questionI': cleaned_answers['9'],
        'questionL': cleaned_answers['10'],
        'questionM': cleaned_answers['11']
    }

    # Scrive le risposte in un altro file JSON con lettere
    output_file_name_lettered = "answers.json"
    with open(output_file_name_lettered, 'w') as output_file:
        json.dump(lettered_answers, output_file, indent=4)

# Esegui la funzione principale
generate_answers_and_responses()
