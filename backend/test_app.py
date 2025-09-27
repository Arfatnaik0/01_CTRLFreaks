"""
Simple Flask test to verify basic functionality
"""
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return jsonify({"status": "running", "message": "Simple Flask test"})

@app.route('/test')
def test():
    return jsonify({"test": "successful"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)