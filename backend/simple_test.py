#!/usr/bin/env python3
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/test')
def test():
    return jsonify({'status': 'ok', 'message': 'Simple test endpoint working'})

if __name__ == '__main__':
    print("Starting simple test Flask app...")
    app.run(host='127.0.0.1', port=5002, debug=True)