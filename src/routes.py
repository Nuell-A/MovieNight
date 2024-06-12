from flask import render_template, request, jsonify
from flask_socketio import emit, join_room
from . import app, socketio

# Attributes
rooms = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/room', methods=['GET', 'POST'])
def room():
    if request.method == 'POST':
        # Retrieve POST data.
        data = request.json
        room = data['room']
        room_type = data['type']
        
        if room_type == 'create':
            if room in rooms:
                
                return jsonify({'status': 'error', 'message': 'Room already exists.'})
            print(f"POST REQUEST: Created room {room}")
        elif room_type == 'join':
            if room not in rooms:
                return jsonify({'status': 'error', 'message': 'Room does not exist.'})
            print(f"POST REQUEST: Joined room {room}")
        
        return jsonify({'status': 'success', 'room': room})
    elif request.method == 'GET':
        room = request.args.get('room')
        # Prevents accessing room page directly.
        if (room == None):
            return render_template('index.html')
        return render_template('room.html', room=room)

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
            print(rooms)
        else:
            print("Already created.")
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