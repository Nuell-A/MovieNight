const socket = io();

let localStream, remoteStream, peerConnection;

document.getElementById('shareScreen').onclick = async () => {
    localStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    document.getElementById('localVideo').srcObject = localStream;

    createPeerConnection();

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('signal', { 'description': peerConnection.localDescription });
};

function createPeerConnection() {
    peerConnection = new RTCPeerConnection();

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('signal', { 'candidate': event.candidate });
        }
    };

    peerConnection.ontrack = event => {
        if (!remoteStream) {
            remoteStream = new MediaStream();
            document.getElementById('remoteVideo').srcObject = remoteStream;
        }
        remoteStream.addTrack(event.track);
    };
}

socket.on('signal', async (data) => {
    if (!peerConnection) {
        createPeerConnection();
    }

    if (data.description) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.description));
        if (data.description.type === 'offer') {
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit('signal', { 'description': peerConnection.localDescription });
        }
    } else if (data.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
});
