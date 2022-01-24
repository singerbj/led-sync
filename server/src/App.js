import './App.css';
import { useEffect, useState } from 'react';
import { SketchPicker } from 'react-color';
import Background from './Background';

const DEFAULT_RGB_STATE = { r: 100, g: 100, b: 100 };

const App = () => {
  const [rgb, setRgb] = useState(DEFAULT_RGB_STATE);
  const [loading, setLoading] = useState(true);

  const getCurrentColor = async () => {
    try{ 
      const response = await fetch("/color");
      const json = await response.json();
      setRgb({
        r: json[0],
        g: json[1],
        b: json[2]
      });
    } catch (e){
      setRgb(DEFAULT_RGB_STATE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentColor();
  }, [])

  useEffect(() => {
    sendForcedColor();
  }, [rgb]);

  const sendForcedColor = async () => {
    const response = await fetch("/color", {
      method: 'PUT', // *GET, POST, PUT, DELETE, etc.
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([rgb.r, rgb.g, rgb.b]) 
    });
    return response.json();
  };

  const resetColorToAuto = async () => {
    const response = await fetch("/color", {
      method: 'PUT', // *GET, POST, PUT, DELETE, etc.
      headers: {
        'Content-Type': 'application/json'
      },
      body: false
    });
    return response.json();
  }

  return (
    <>
      <div id="bkrd" style={{ display: !loading ? 'hidden' : '', position: 'absolute', width: '100%', height: '100%', padding: '10px'}}>
        <h3 style={{ display: 'inline', color: "#000", backgroundColor: "#FFF" }}>Loading...</h3>
      </div>
      <div style={{ display: loading ? 'hidden' : ''}}>
        <Background>
            <br />
            <br />
            <SketchPicker
              color={{ ...rgb, a: 100}}
              onChangeComplete={(color) => {
                setRgb(color.rgb);
              }}
            />
            <br />
            <br />
            <br />
            {/* <button onClick={() => {
              sendForcedColor();
            }}>Set Forced Color</button>
            <br /> */}
            <button onClick={() => {
              resetColorToAuto();
            }}>Auto Detect Based on Video Capture</button>
        </Background>
      </div>
    </>
  );
}

export default App;
