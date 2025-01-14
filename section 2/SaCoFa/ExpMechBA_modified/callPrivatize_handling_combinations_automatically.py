from opyenxes.data_in.XUniversalParser import XUniversalParser
from opyenxes.classification.XEventNameClassifier import XEventNameClassifier
from pm4py.objects.log.exporter.xes import exporter as xes_exporter
from pm4py.objects.log import log as event_log
import datetime
from dateutil.tz import tzutc

from privatize_ba import privatize_ba

import math

TRACE_START = "TRACE_START"
TRACE_END = "TRACE_END"
EVENT_DELIMETER = ">>>"

# Parameters P and N to test
P_values = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024]
N_values = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90]

basePath = 'c:/Users/ferru/Desktop/tesi_con_maggi_materiale/SaCoFa_EventLogs/'  # Path to the folder containing all the event logs
logName = 'sepsis'  # The preferred file structure is given in the README

inPath = basePath + logName + '.xes'
epsRange = [1.0]  # Range of epsilon
tries = 10

def main():
    log = readLogFile(inPath)
    counter = 1
    for P in P_values:  # Iterate over P values
        for N in N_values:  # Iterate over N values
            for eps in epsRange:
                for i in range(tries):
                    try:
                        print(f"Run {counter}: P={P}, N={N}, eps={eps}, try={i}")

                        # Only 'ba' mode is used here
                        sanitized_frequencies = privatize_ba.privatize_tracevariants(log=log, epsilon=eps, P=P, N=N)

                        # Check for NaN values
                        if any(math.isnan(frequency) for frequency in sanitized_frequencies.values()):
                            print(f"NaN detected in sanitized frequencies for P={P}, N={N}, eps={eps}, try={i}")
                            # Option 1: Replace NaN values with 0
                            sanitized_frequencies = {k: (0 if math.isnan(v) else v) for k, v in sanitized_frequencies.items()}

                        counter += 1
                        print(f"Done: ba eps = {eps}, try = {i}, P = {P}, N = {N}")

                        print("Writing to .csv...")
                        outPath_csv = f"{basePath}/Out/{logName}/{logName}_{P}_{N}_{eps}_ba_{i}.csv"
                        write_to_csv(frequencies=sanitized_frequencies, path=outPath_csv)

                        print("Writing to .xes...")
                        outPath_xes = f"{basePath}/Out/{logName}/{logName}_{P}_{N}_{eps}_ba_{i}.xes"
                        write_to_xes(frequencies=sanitized_frequencies, path=outPath_xes)

                    except Exception as e:
                        print(f"Error during processing: P={P}, N={N}, eps={eps}, try={i}. Error: {e}")

    print("Done for all combinations of P, N, and eps for all tries.")

def readLogFile(file):
    with open(file) as log_file:
        return XUniversalParser().parse(log_file)

def generate_pm4py_log(trace_frequencies):
    log = event_log.EventLog()
    trace_count = 0
    for variant in trace_frequencies.items():
        frequency = variant[1]
        activities = variant[0].split(EVENT_DELIMETER)
        for i in range(frequency):
            trace = event_log.Trace()
            trace.attributes["concept:name"] = str(trace_count)
            trace_count += 1
            for activity in activities:
                if TRACE_END not in activity:
                    event = event_log.Event()
                    event["concept:name"] = str(activity)
                    event["time:timestamp"] = datetime.datetime(1970, 1, 1, 0, 0, 0, tzinfo=tzutc())
                    trace.append(event)
            log.append(trace)
    return log

def write_to_xes(frequencies, path):
    model = generate_pm4py_log(trace_frequencies=frequencies)
    xes_exporter.apply(model, path)

def write_to_csv(frequencies, path):
    with open(path, "w+") as f:
        f.write("Case ID;Activity\n")
        case = 0
        for entry in frequencies.items():
            frequency = entry[1]
            activities = list(filter(None, entry[0].split(EVENT_DELIMETER)))
            for i in range(frequency):
                for activity in activities:
                    if TRACE_END not in activity:
                        f.write(f"{case};{activity}\n")
                case += 1

main()
