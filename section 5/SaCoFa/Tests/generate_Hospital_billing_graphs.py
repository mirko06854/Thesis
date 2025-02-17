import pandas as pd
import matplotlib.pyplot as plt
import os
import numpy as np
from matplotlib.ticker import MaxNLocator

def plot_fitness_precision(data, fixed_param, fixed_values, varying_param, metric_name, title, output_filename, output_dir, original_value):
    plt.figure(figsize=(12, 12))  # Dimensioni compatte per il grafico

    for fixed_value in fixed_values:
        # Filtra i dati per il parametro fissato
        subset = data[data[fixed_param] == fixed_value]
        subset = subset.sort_values(by=varying_param)  # Ordina per il parametro variabile

        # Filtra valori non validi
        subset = subset[subset[varying_param] > 0]

        # Traccia il grafico
        plt.plot(subset[varying_param], subset[metric_name], marker='o', label=f'{fixed_param} = {fixed_value}')

    # Configura i ticks in base al parametro variabile
    if varying_param == 'P':
        plt.xscale('log', base=2)  # Scala logaritmica per P
        sequence = [2 ** i for i in range(1, 11)]  # Da 2^1 a 2^10
        plt.xticks(sequence)
    elif varying_param == 'N':
        plt.xticks(sorted(data[varying_param].dropna().unique()))  # Mostra tutti i valori unici di N

    # Linea orizzontale per il valore originale
    plt.axhline(y=original_value, color='r', linestyle='--', label='Original Log')

    # Configura i limiti degli assi
    min_x_value = data[varying_param].min()
    max_x_value = data[varying_param].max()
    min_y_value = data[metric_name].min()
    max_y_value = data[metric_name].max()

    plt.xlim(left=min_x_value, right=max_x_value)  # Imposta i limiti dell'asse X
    plt.ylim(bottom=min_y_value, top=max_y_value)  # Imposta i limiti dell'asse Y

    # Configurazioni generali
    plt.title(title)
    plt.xlabel(varying_param)
    plt.ylabel(metric_name)
    plt.legend()
    plt.grid(True, which="both", linestyle="--", linewidth=0.5)

    # Salva il grafico
    output_file = os.path.join(output_dir, output_filename)
    plt.savefig(output_file,dpi=300)
    plt.close()
    print(f"Saved plot to {output_file}")

def main():
    output_dir = 'c:/Users/ferru/Desktop/tesi_con_maggi_materiale/Hospital_Billing_out/'
    results_file = os.path.join(output_dir, 'conformance_results_last.csv')

    if not os.path.exists(results_file):
        print(f"The results file {results_file} does not exist.")
        return

    data = pd.read_csv(results_file)

    # Normalizza la colonna 'Log'
    data['Log'] = data['Log'].str.strip()

    # Recupera i valori originali di log
    original_log_df = data[data['Log'] == 'Hospital_Billing.xes']

    if original_log_df.empty:
        print("No matching rows found for 'Hopital_Billing.xes' in the Log column.")
        return

    original_fitness = original_log_df['fitness_alignment_based'].iloc[0]
    original_precision = original_log_df['precision_alignments'].iloc[0]

    # Genera i valori per P e N
    P_values = [2 ** i for i in range(1, 11)]  # Da 2^1 a 2^10
    N_values = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90]

    # Plotting fitness con P fisso e N variabile
    plot_fitness_precision(data, 'P', P_values, 'N', 'fitness_alignment_based',
                           'Fitness (Alignment-Based) with Varying N and Fixed P', 'fitness_fixed_P_varying_N.png', output_dir, original_fitness)

    # Plotting precision con P fisso e N variabile
    plot_fitness_precision(data, 'P', P_values, 'N', 'precision_alignments',
                           'Precision (Alignment-Based) with Varying N and Fixed P', 'precision_fixed_P_varying_N.png', output_dir, original_precision)

    # Plotting fitness con N fisso e P variabile
    plot_fitness_precision(data, 'N', N_values, 'P', 'fitness_alignment_based',
                           'Fitness (Alignment-Based) with Varying P and Fixed N', 'fitness_fixed_N_varying_P.png', output_dir, original_fitness)

    # Plotting precision con N fisso e P variabile
    plot_fitness_precision(data, 'N', N_values, 'P', 'precision_alignments',
                           'Precision (Alignment-Based) with Varying P and Fixed N', 'precision_fixed_N_varying_P.png', output_dir, original_precision)

if __name__ == "__main__":
    main()
