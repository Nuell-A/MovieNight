from flask import render_template
from flask_socketio import emit, join_room, leave_room
from . import app, socketio

@app.route('/')
def index():
    return render_template('index.html')



content = {"name": "Alca"}
@socketio.on('connect')
def handle_connect(auth):
    print(f"User connected.")

@socketio.on('join')
def handle_join(data):
    room = data["room"]
    join_room(room)
    emit("join", room=room)
    print(f"User joined: {data["room"]}")

@socketio.on('message')
def handle_message(data):
    room = data['room']
    emit('message', data, room=room)

@socketio.on('disconnect')
def handle_disconnect():
    print("User disconnected.")

'''@socketio.on("response")
def message(data):
    print(f"From JS: {str(data)}")'''

@socketio.on("sharebt_clicked")
def handle_clicked(data):
    print(f"Button clicked to share screen: {str(data)}")