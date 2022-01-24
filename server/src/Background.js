import './App.css';
import { io } from "socket.io-client";
import { useEffect, useState } from 'react';

// const WEBSOCKET_PORT = 1336;

const Background = ({ children }) => {
    const [connected, setConnected] = useState(false);
    const [colorState, setColorState] = useState([0, 0, 0]);

    useEffect(() => {
        let socket;
        var connect = () => {
            socket = io({ transports: ["websocket"] });

            // client-side
            socket.on("connect", () => {
                console.log("Connection is opened...");
                setConnected(true);
            });
            socket.on("forced_color", (message) => {
                var received_msg = JSON.parse(message);
                setColorState(received_msg);
            });
            
            socket.on("disconnect", () => {
                setConnected(false);
                console.log("Connection is closed...");
            });
        };
        connect();
    }, [])

    return (
        <div id="bkrd" style={{position: 'absolute', width: '100%', height: '100%', padding: '10px', backgroundColor: "rgb(" + colorState.join(',') + ")"}}>
            <h3 style={{ display: 'inline', color: "#000", backgroundColor: "#FFF" }}>{connected ? "Connected :)" : "Not Connected :("}</h3>
            {children}
        </div>
    );
}

export default Background;
