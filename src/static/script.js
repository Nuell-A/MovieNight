// HTML Attributes
let room_text = document.getElementById('roomText') // Input
let room_join_bt = document.getElementById('joinRoomSubmit') // BT
let room_create_bt = document.getElementById('createRoomSubmit') // BT

let local_share = document.getElementById('localShare') // Video
let local_share_bt = document.getElementById('localShareSubmit')
let remote_share = document.getElementById('remoteShare') // Video

let share_bt = document.getElementById('shareSubmit') // BT
let stop_bt = document.getElementById('stopSubmit') // BT

// Attributes
socketio = io()
let peer_conn, room, local_stream, remote_stream
let userId = "userId" + Math.random().toString(6).slice(2, 8)
const servers = {
    iceServers: [
        {
            urls:[
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302'
              ]
        }
    ]
};


let init = async () => {
    // Initial connection to signaling server. 
    socketio.on('connect', async () => {
        console.log("User", userId, "connected to signaling server.")
    })

    socketio.on('join', async (data) => {
        // Displays console if user joins or creates a room.
        if (data.type == 'join') {
            console.log("User", data.userId, "joined room", data.room)
        } else if (data.type == 'create') {
            console.log("User", data.userId, "created and joined room", data.room)
        }
    })

    socketio.on('message', async (data) => {
        if (data.offer) {
            await handleOffer(data.offer)
        } else if (data.answer) {
            await handleAnswer(data.answer)
        } else if (data.candidate) {
            await handleCandidate(data.candidate)
        }
    })

    room_join_bt.addEventListener('click', async () => {
        // Joins room if it exists
        room = room_text.value
        socketio.emit('join', {'type': 'join', userId: userId, room:room})
        sendRoomData(room, 'join')
    })

    room_create_bt.addEventListener('click', async () => {
        // Sends room info to signaling server to create room if not already taken.
        room = room_text.value
        socketio.emit('join', {'type': 'create', userId: userId, room:room})
        sendRoomData(room, 'create')
    })

    local_share_bt.addEventListener('click', async () => {
        // Gets user display screen media.
        fetchUserMedia()
        // Makes local video visible and hides remote video.
        local_share.style.display = 'block'
        remote_share.style.display = 'none'
    })

    share_bt.addEventListener('click', async () => {
        // Start sharing to peer 
        console.log("Starting screen share...")
        initPeerConn()

        // Creates offer.
        const offer = await peer_conn.createOffer()
        await peer_conn.setLocalDescription(offer)
        console.log("SENT OFFER")
        socketio.emit('message', {offer: offer, room: room, userId: userId})
    })
    
    stop_bt.addEventListener('click', async () => {
        // Stop sharing to peer
    })
}

function sendRoomData(room, type) {
    fetch('/room', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            type: type,
            room: room
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            window.location.href = `/room?room=${data.room}`;
        } else {
            console.error('Error:', data);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

let fetchUserMedia = async () => {
    // Gets user media.
    local_stream = await navigator.mediaDevices.getDisplayMedia({video: true, audio: true})
    local_share.srcObject = local_stream
    console.log("Recording screen...")
}

let initPeerConn = async () => {
    /**
     * Creates new PC, gets ICE Candidates 
     * Creates MediaStream object to hold incoming tracks and sets remoteShare element.
     */
    peer_conn = new RTCPeerConnection(servers) // New PC
    console.log("RTCPeerconnection instantiated.")
    remote_stream = new MediaStream() // Object to hold incoming media streams
    remote_share.srcObject = remote_stream // Sets to remoteShare in HTML

    // Grabs local media tracks to send to peer. 
    if (local_stream) {
        local_stream.getTracks().forEach(track => {
            peer_conn.addTrack(track, local_stream)
        })
    }
    
    // Monitors connection changes.
    peer_conn.addEventListener("signalingstatechange", (event) => {
        console.log(event);
        console.log(peer_conn.signalingState)
    });

    // Finds and sends ICE Candidates to peer.
    peer_conn.addEventListener("icecandidate", event => { // Gets ICE Candidates
        console.log('........Ice candidate found!......')
        console.log(event)
        if (event.candidate) {
            console.log("Sending ICE Candidate", event.candidate)
            socketio.emit('message', { candidate: event.candidate, room: room, userId: userId });
        }
    });

    // Grabs incoming media.
    peer_conn.addEventListener("track", event => { // Grabs incoming tracks and inserts them in MediaStream object.
        console.log('........Track received!......')
        console.log(event)
        event.streams[0].getTracks().forEach(track => {
            remote_stream.addTrack(track, remote_stream)
            console.log("Track Added!!")
        })
    })

    // Monitor connection state
    peer_conn.onconnectionstatechange = () => {
        console.log(`Connection state change: ${peer_conn.connectionState}`);
        if (peer_conn.connectionState === 'connected') {
            console.log('Peer connection established successfully.');
        }
    };

    // Monitor ICE connection state
    peer_conn.oniceconnectionstatechange = () => {
        console.log(`ICE connection state change: ${peer_conn.iceConnectionState}`);
        if (peer_conn.iceConnectionState === 'connected' || peer_conn.iceConnectionState === 'completed') {
            console.log('ICE connection established successfully.');
        }
    };
}

let handleOffer = async (offer) => {
    /* 
    Creates new peer_conn.
    Grabs ICE Candidates.
    Adds tracks.
    Sets remote description and emits.
    */

    if (!peer_conn) {
        initPeerConn();
        console.log("Create Peer Connection to handle offer.")
     }

    await peer_conn.setRemoteDescription(offer)
    const answer = await peer_conn.createAnswer()
    await peer_conn.setLocalDescription(answer)
    console.log("RECEIVED OFFER:", offer)
    socketio.emit('message', {answer: answer, room: room, userId: userId})

    // Turns on remote video and keeps local video (not used) hidden.
    local_share.style.display = 'none'
    remote_share.style.display = 'block'
}

let handleAnswer = async (answer) => {
    await peer_conn.setRemoteDescription(answer)
    console.log("RECEIVED ANSWER:", answer)
}

let handleCandidate = async (candidate) => {
    await peer_conn.addIceCandidate(candidate)
    console.log("RECEIVED CANDIDATE:", candidate)
}

init()