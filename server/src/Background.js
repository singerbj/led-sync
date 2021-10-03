import './App.css';
import { useEffect, useState } from 'react';

const Background = ({ children }) => {
    const [connected, setConnected] = useState(false);
    const [colorState, setColorState] = useState([0, 0, 0]);

    useEffect(() => {
        var ws;
        var connect = () => {
            ws = new WebSocket("ws://localhost:1337/");

            ws.onopen = () => {
                console.log("Connection is opened...");
                setConnected(true);
            };

            ws.onmessage = (evt) => {
                var received_msg = JSON.parse(evt.data);
                setColorState(received_msg);
            };

            ws.onclose = () => {
                setConnected(false);
                console.log("Connection is closed...trying again in 3 seconds.");
                setTimeout(() => {
                    connect();
                }, 3000);
            };
        };
        connect();

        return () => {
            ws.close();
        };
    }, [])

    return (
        <div id="bkrd" style={{position: 'absolute', width: '100%', height: '100%', padding: '10px', backgroundColor: "rgb(" + colorState.join(',') + ")"}}>
            <h3 style={{ display: 'inline', color: "#000", backgroundColor: "#FFF" }}>{connected ? "Connected :)" : "Not Connected :("}</h3>
            {children}
        </div>
    );
}

export default Background;
