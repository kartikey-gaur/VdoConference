import React, { useEffect } from "react";

export function Receiver() {
    const videoRef = React.useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8080");
        //when the socket opens we do the following operation
        socket.onopen = () => {
            socket.send(JSON.stringify({ type: 'receiver' }));
        };

        socket.onmessage = async (event) => {
            let pc: RTCPeerConnection | null = null;
            const message = JSON.parse(event.data);
            if (message.type == 'createOffer') {
                const pc = new RTCPeerConnection();
                pc.setRemoteDescription(message.sdp);

                //triggers when we have some data ready
                pc.onicecandidate = (event) => {
                    console.log(event);
                    socket?.send(JSON.stringify({ type: "iceCandidate", candidate: event.candidate }))
                }

                pc.ontrack = (event) => {
                    const video = document.createElement('video');
                    document.body.appendChild(video);

                    video.srcObject = new MediaStream([event.track]);
                    video.play();
                }

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.send(JSON.stringify({
                    type: "createAnswer",
                    sdp: pc.localDescription
                }));
            }
            else if (message.type == "iceCandidate") {
                if (!pc) {
                    //@ts-ignore
                    pc.addIceCandidate(message.candidate);
                }
            }
        }

    }, []);
    return (
        <div>
            <h1>Receiver</h1>
            <video ref={videoRef}></video>
        </div>
    )
}