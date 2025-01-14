import os
import re
import pandas as pd
import pm4py
import concurrent.futures
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
from pm4py.visualization.petri_net import visualizer as pn_visualizer
from pm4py.visualization.heuristics_net import visualizer as hn_visualizer
import tempfile

def load_log(log_path):
    """Load an event log from a XES file."""
    if not os.path.exists(log_path):
        raise FileNotFoundError(f"The log file {log_path} does not exist.")
    return pm4py.read_xes(log_path)

def discover_and_convert_net(log):
    """Discover and convert heuristic and Petri nets from the log."""
    heu_net = pm4py.discover_heuristics_net(log, dependency_threshold=0.5)
    net, im, fm = pm4py.discover_petri_net_heuristics(log, dependency_threshold=0.5)
    return net, im, fm, heu_net

def evaluate_conformance(log, net, im, fm):
    """Evaluate the conformance of the log with the discovered net."""
    fitness_token_based = pm4py.fitness_token_based_replay(log, net, im, fm).get('log_fitness', None)
    precision_token_based = pm4py.precision_token_based_replay(log, net, im, fm)
    
    try:
        fitness_alignment_based = pm4py.fitness_alignments(log, net, im, fm).get('log_fitness', None)
    except Exception as e:
        print(f"Skipping alignment-based fitness due to error: {type(e).__name__} - {e}")
        fitness_alignment_based = None

    try:
        precision_alignments = pm4py.precision_alignments(log, net, im, fm)
    except Exception as e:
        print(f"Skipping precision alignment due to error: {type(e).__name__} - {e}")
        precision_alignments = None

    return {
        'fitness_token_based': fitness_token_based,
        'fitness_alignment_based': fitness_alignment_based,
        'precision_token_based': precision_token_based,
        'precision_alignments': precision_alignments
    }

def extract_params_from_filename(log_name):
    """Extract pruning parameters P and N from the filename."""
    match = re.search(r'_([0-9]+)_([0-9]+)_', log_name)
    if match:
        return int(match.group(1)), int(match.group(2))
    else:
        return None, None

def calculate_average(metric_list):
    """Calculate the average of a list of metrics, ignoring None values."""
    valid_values = [value for value in metric_list if value is not None]
    if not valid_values:
        return None
    return np.mean(valid_values)

def process_log(log_file, modified_path, original_log):
    """Process a single log file, discovering and evaluating the model."""
    base_path = 'c:/Users/ferru/Desktop/tesi_con_maggi_materiale/SaCoFa_EventLogs/'
    original_log_name = 'sepsis'
    original_log_path = os.path.join(base_path, original_log_name + '.xes')

    if not os.path.exists(original_log_path):
        print(f"The original log file {original_log_path} does not exist.")
        return None, None, None, None, None, None, None

    # Load the original log
    original_log = load_log(original_log_path)

    P, N = extract_params_from_filename(log_file)
    if P is not None and N is not None:
        print(f"Processing file: {log_file}")
        mod_log_path = os.path.join(modified_path, log_file)
        modified_log = load_log(mod_log_path)

        # Discover Petri net and Heuristic net for each modified log
        net_mod, im_mod, fm_mod, heu_net_mod = discover_and_convert_net(modified_log)
        scores_mod = evaluate_conformance(original_log, net_mod, im_mod, fm_mod)

        return P, N, scores_mod, net_mod, im_mod, fm_mod, heu_net_mod
    return None, None, None, None, None, None, None

def add_white_background(image):
    """Add a white background to an image."""
    background = Image.new('RGB', image.size, (255, 255, 255))
    background.paste(image, mask=image.split()[3] if image.mode == 'RGBA' else None)
    return background

def merge_images(image_list, output_path, grid_size=(2, 5)):
    """Merge a list of images into a single collage image."""
    widths, heights = zip(*(img.size for img in image_list))
    max_width = max(widths)
    max_height = max(heights)

    collage_width = max_width * grid_size[1]
    collage_height = max_height * grid_size[0]

    collage_image = Image.new('RGB', (collage_width, collage_height), color=(255, 255, 255))

    for index, image in enumerate(image_list):
        x_offset = (index % grid_size[1]) * max_width
        y_offset = (index // grid_size[1]) * max_height
        collage_image.paste(image, (x_offset, y_offset))

    collage_image.save(output_path)

def process_visualizations(output_dir, P, N, nets, ims, fms, heuristics_nets):
    """Generate and save visualizations for the nets."""
    petri_net_image_paths = []
    heuristics_net_image_paths = []

    for i in range(len(nets)):
        # Generate Petri net visualization
        gviz_petri_net = pn_visualizer.apply(nets[i], ims[i], fms[i])
        
        # Save Petri net visualization to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png', dir=output_dir) as temp_file:
            temp_path = temp_file.name
            pn_visualizer.save(gviz_petri_net, temp_path)
            petri_net_image_paths.append(temp_path)

        # Generate Heuristics net visualization
        gviz_heuristics_net = hn_visualizer.apply(heuristics_nets[i])
        
        # Save Heuristics net visualization to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png', dir=output_dir) as temp_file:
            temp_path = temp_file.name
            hn_visualizer.save(gviz_heuristics_net, temp_path)
            heuristics_net_image_paths.append(temp_path)

    # Open images for merging and add white background
    petri_net_images = [add_white_background(Image.open(path)) for path in petri_net_image_paths]
    heuristics_net_images = [add_white_background(Image.open(path)) for path in heuristics_net_image_paths]

    # Create collages from opened images
    petri_net_collage_path = os.path.join(output_dir, f'sepsis_{P}_{N}_petri_net_collage.png')
    heuristics_net_collage_path = os.path.join(output_dir, f'sepsis_{P}_{N}_heuristics_net_collage.png')

    merge_images(petri_net_images, petri_net_collage_path)
    merge_images(heuristics_net_images, heuristics_net_collage_path)

    # Clean up temporary files
    for path in petri_net_image_paths + heuristics_net_image_paths:
        os.remove(path)

def main():
    base_path = 'c:/Users/ferru/Desktop/tesi_con_maggi_materiale/SaCoFa_EventLogs/'
    modified_path = 'c:/Users/ferru/Desktop/tesi_con_maggi_materiale/SaCoFa_EventLogs/Out/sepsis/'
    output_dir = 'c:/Users/ferru/Desktop/tesi_con_maggi_materiale/sepsis_out/visualizations_complete_avg_algorithm'
    
    # Ensure output directory exists
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    log_files = [f for f in os.listdir(modified_path) if f.endswith('.xes')]

    print("Log files in directory:")
    for log_file in log_files:
        print(log_file)

    original_log_name = 'sepsis'
    original_log_path = os.path.join(base_path, original_log_name + '.xes')

    if not os.path.exists(original_log_path):
        print(f"The original log file {original_log_path} does not exist.")
        return

    original_log = load_log(original_log_path)
    net, im, fm, heu_net = discover_and_convert_net(original_log)
    scores = evaluate_conformance(original_log, net, im, fm)
    print("Original Log Scores:", scores)

    results = []
    results.append({
        'Log': original_log_name + '.xes',
        'P': None,
        'N': None,
        'fitness_token_based': scores['fitness_token_based'],
        'fitness_alignment_based': scores['fitness_alignment_based'],
        'precision_token_based': scores['precision_token_based'],
        'precision_alignments': scores['precision_alignments']
    })

    combined_results = {}

    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_to_log = {executor.submit(process_log, log_file, modified_path, original_log): log_file for log_file in log_files}

        for future in concurrent.futures.as_completed(future_to_log):
            log_file = future_to_log[future]
            try:
                P, N, scores, net_mod, im_mod, fm_mod, heu_net_mod = future.result()
                if scores is not None:
                    results.append({
                        'Log': log_file,
                        'P': P,
                        'N': N,
                        'fitness_token_based': scores['fitness_token_based'],
                        'fitness_alignment_based': scores['fitness_alignment_based'],
                        'precision_token_based': scores['precision_token_based'],
                        'precision_alignments': scores['precision_alignments']
                    })

                    # Accumulate results for average calculation
                    if (P, N) not in combined_results:
                        combined_results[(P, N)] = []
                    combined_results[(P, N)].append(scores)

            except Exception as e:
                print(f"Error processing {log_file}: {e}")

    # Calculate averages for each combination of P and N
    average_results = []
    for (P, N), scores_list in combined_results.items():
        average_scores = {
            'fitness_token_based': calculate_average([s['fitness_token_based'] for s in scores_list]),
            'fitness_alignment_based': calculate_average([s['fitness_alignment_based'] for s in scores_list]),
            'precision_token_based': calculate_average([s['precision_token_based'] for s in scores_list]),
            'precision_alignments': calculate_average([s['precision_alignments'] for s in scores_list]),
        }
        average_results.append({
            'Log': f"Average for P={P}, N={N}",
            'P': P,
            'N': N,
            **average_scores
        })

    # Add average results to overall results
    results.extend(average_results)

    # Create DataFrame and save to CSV
    df = pd.DataFrame(results)
    output_csv_path = os.path.join(output_dir, 'conformance_results.csv')

    try:
        df.to_csv(output_csv_path, index=False)
        print(f"CSV file saved at {output_csv_path}")
    except Exception as e:
        print(f"Failed to save CSV file: {e}")

    # Process and visualize the results
    nets = []
    ims = []
    fms = []
    heuristics_nets = []

    for log_file in log_files:
        P, N, _, net_mod, im_mod, fm_mod, heu_net_mod = process_log(log_file, modified_path, original_log)
        if net_mod is not None:
            nets.append(net_mod)
            ims.append(im_mod)
            fms.append(fm_mod)
            heuristics_nets.append(heu_net_mod)

    process_visualizations(output_dir, P, N, nets, ims, fms, heuristics_nets)

if __name__ == "__main__":
    main()
