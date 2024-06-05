from flask import render_template
from flask_socketio import emit, join_room
from . import app, socketio

# Attributes
rooms = {}

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('join')
def handle_join(data):
    room = data['room']
    userId = data['userId']
    socket_type = data['type']
    # Checks for createing or joining a room
    if (socket_type == "create"):
        if (room not in rooms):
            rooms[room] = [userId,]
            join_room(room)
            print("Created room...")
            emit('join', {'type': 'create', 'userId': userId, 'room': room}, room=room)
        else:
            print("Already created.")
            return
    elif (socket_type == "join"):
        if (room not in rooms):
            print("Room does not exist")
        else:
            rooms[room].append(userId)
            join_room(room)
            print("Joined room...")
            emit('join', {'type': 'join', 'userId': userId, 'room': room}, room=room)
    print(rooms)
    

@socketio.on('message')
def handle_message(data):
    print(data)
    room = data['room']
    userId = data['userId']
    print(f"Message received: {data}")  # Debug output
    emit('message', data, room=room, include_self=False)

if __name__ == '__main__':
    socketio.run(app, debug=True)