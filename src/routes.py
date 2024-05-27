from flask import redirect, render_template, request, url_for
from flask_socketio import emit
from . import app, socketio

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('signal')
def handle_signal(data):
    emit('signal', data, broadcast=True)