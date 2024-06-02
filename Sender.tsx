import { useEffect, useState } from "react"

export function Sender() {
    const [socket, setSocket] = useState<WebSocket | null>(null)

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8080");
        //when the socket opens we do the following operation
        socket.onopen = () => {
            socket.send(JSON.stringify({ type: "sender" }));
        };
        setSocket(socket);
    }, []);

    async function startSendingVideo() {
        if (!socket) return ;
        //create an offer at the beginning
        const pc = new RTCPeerConnection;
        pc.onnegotiationneeded = async () => {
            console.log("onnegotiationneeded") ;
            const offer = await pc.createOffer(); //gives us sdp
            await pc.setLocalDescription(offer);
            socket?.send(JSON.stringify({
                type: "createOffer",
                sdp: pc.localDescription
            }));
        }
        //now we need to send the offer to the other browser
        //logic to open someone's camera when needed


        pc.onicecandidate = (event) => {
            console.log(event);
            socket?.send(JSON.stringify({ type: "iceCandidate", candidate: event.candidate }))
        }

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type == "createAnswer") {
                pc.setRemoteDescription(data.sdp);
            }
            else if (data.type == "iceCandidate") {
                pc.addIceCandidate(data.candidate);
            }
        }

        const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: false});
        pc.addTrack(stream.getVideoTracks()[0]);
        //pc.addTrack(stream.getAudioTracks()[0]);
    }

    return (
        <div>
            <h1> ready to share the vdo, go live</h1>
            <button onClick={startSendingVideo}>Start sending the video</button>
        </div>
    )
}
//from here we need to send the server that i am the
//sender firstly adn then we can relay other webRTC messages