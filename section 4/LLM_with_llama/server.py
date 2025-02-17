from flask import Flask, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Serve answers.json
@app.route('/answers.json')
def serve_json():
    return send_from_directory('.', 'answers.json')

# Serve activities.txt
@app.route('/activities.txt')
def serve_txt():
    return send_from_directory('.', 'activities.txt')

if __name__ == "__main__":
    app.run(port=8000)
