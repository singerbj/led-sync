import './App.css';
import { rgbToHsv, hsvToRgb } from "./Convert";
import { useEffect, useState } from 'react';

const Background = ({ children, hsvMod }) => {
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

    const getModifiedColor = (colorState) => {
        const hsv = rgbToHsv(colorState[0], colorState[1], colorState[2]);
        if(hsvMod){
            hsv[1] = hsv[1] + (hsv[1] * hsvMod.s);
            hsv[2] = hsv[2] + (hsv[2] * hsvMod.v);

            if(hsv[1] < 0){
                hsv[1] = 0;
            }
            if(hsv[1] > 1){
                hsv[1] = 1;
            }
            if(hsv[2] < 0){
                hsv[2] = 0;
            }
            if(hsv[2] > 1){
                hsv[2] = 1;
            }
        }

        return hsvToRgb(hsv[0], hsv[1], hsv[2])
    };

    const modifiedColorState = getModifiedColor(colorState);
    return (
        <div id="bkrd" style={{position: 'absolute', width: '100%', height: '100%', padding: '10px', backgroundColor: "rgb(" + modifiedColorState.join(', ') + ")"}}>
            <h3 style={{ display: 'inline', color: "#000", backgroundColor: "#FFF", padding: 5 }}>{connected ? "Connected :)" : "Not Connected :("}</h3>
            <br /><br />
            <h5 style={{ display: 'inline', color: "#000", backgroundColor: "#FFF", padding: 5 }}>{"Color before mods: " + colorState.map((i) => i.toFixed(2)).join(', ')}</h5>
            <br /><br />
            <h5 style={{ display: 'inline', color: "#000", backgroundColor: "#FFF", padding: 5 }}>{"Color after mods: " + modifiedColorState.map((i) => i.toFixed(2)).join(', ')}</h5>
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
