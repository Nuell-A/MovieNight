const socketio = io(); // Using the same host/serve so no params needed. 
const room = "screen-share";
// HTML Attributes
var video_element = document.getElementById("localVideo");
var share_button = document.getElementById("shareScreen");
var remote_video_element = document.getElementById("remoteVideo")
// Attributes 
var local_video;




// SocketIO Test

/*socketio.on("message", (data => {
    console.log(data.name)
    socketio.emit("response", "We received " + data.name)
}));*/
console.log("SocketIO init...");

socketio.on('connect', () => {
    socketio.emit('join', { room: room });
});

socketio.on('message', async (data) => {
    if (data.offer) {
        await handleOffer(data.offer);
    } else if (data.answer) {
        await handleAnswer(data.answer);
    } else if (data.candidate) {
        await handleCandidate(data.candidate);
    }
});

var pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

pc.onicecandidate = (event) => {
    if (event.candidate) {
        socketio.emit('message', { candidate: event.candidate, room: room });
    }
};

pc.ontrack = (event) => {
    remote_video_element.srcObject = event.streams[0];
};

//WebRTC Test
share_button.addEventListener('click', () => {
    socketio.emit("sharebt_clicked", "Sharing starting");
    startShare();
});

async function startShare() {
    local_video = await navigator.mediaDevices.getDisplayMedia({video: true, audio: true});
    video_element.srcObject = local_video;
    local_video.getTracks().forEach(track => pc.addTrack(track, local_video));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketio.emit('message', { offer: offer, room: room });
}

async function handleOffer(offer) {
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socketio.emit('message', { answer: answer, room: room });
}

async function handleAnswer(answer) {
    console.log(answer);
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
}

async function handleCandidate(candidate) {
    try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
        console.error('Error adding received ICE candidate:', error);
    }
}