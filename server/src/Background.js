import './App.css';
import { useEffect, useState } from 'react';

const Background = ({ children }) => {
    const [connected, setConnected] = useState(false);
    const [colorState, setColorState] = useState([0, 0, 0]);
    const [hasFocus, setHasFocus] = useState(document.hasFocus());

    useEffect(() => {
        const intervalId = setInterval(() => {  //assign interval to a variable to clear it.
            setHasFocus(document.hasFocus());
        }, 500)
        
        return () => clearInterval(intervalId); 
    }, []);

    useEffect(() => {
        const getColor = (async() => {
            if(document.hasFocus()){
                try {
                    const response = await fetch('/color')
                    const json = await response.json();
                    setColorState(json)
                    setConnected(true);
                    setTimeout(() => {
                        getColor();
                    }, 500)
                } catch (e) {
                    setConnected(false);
                    setTimeout(() => {
                        getColor();
                    }, 3000)
                }
            } else {
                setTimeout(() => {
                    getColor();
                }, 500)
            }
        });
        getColor();
        setConnected(true);
    }, [])

    return (
        <div id="bkrd" style={{position: 'absolute', width: '100%', height: '100%', padding: '10px', backgroundColor: "rgb(" + colorState.join(',') + ")"}}>
            <h3 style={{ display: 'inline', color: "#000", backgroundColor: "#FFF", padding: 5 }}>{connected ? "Connected :)" : "Not Connected :("}</h3>
            {children}
            {!hasFocus && 
                <>
                    <br />
                    <br />
                    <h5 style={{ display: 'inline', color: "#000", backgroundColor: "#FFF", padding: 5 }}>Focus window to recieve color updates</h5>
                </>
            }
        </div>
    );
}

export default Background;
