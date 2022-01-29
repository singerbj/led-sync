import './App.css';
import { useEffect, useState } from 'react';
import { SketchPicker } from 'react-color';
import Background from './Background';
import Slider from 'react-input-slider';

const DEFAULT_RGB_STATE = { r: 100, g: 100, b: 100 };
const DEFAULT_HSV_MOD_STATE = { h: 1, s: 1, vs: 1 };
const DEFAULT_LERP_SPEED = 0.9;
const SLIDER_STYLE = {
  track: {
    backgroundColor: 'grey'
  },
  active: {
    backgroundColor: 'white'
  },
};

const App = () => {
  const [loading, setLoading] = useState(true);
  const [rgb, setRgb] = useState(DEFAULT_RGB_STATE);
  const [hsvMod, setHsvMod] = useState(DEFAULT_HSV_MOD_STATE);
  const [lerpSpeed, setLerpSpeed] = useState(DEFAULT_LERP_SPEED);
  const [hsvCount, setHsvCount] = useState(0);
  const [lerpCount, setLerpCount] = useState(0);

  useEffect(() => {
    (async () => {
      const rbgArray = await getForcedColor();
      const hsvModArray = await getHsvMod();
      setRgb({ r: rbgArray[0], g: rbgArray[1], b: rbgArray[2]});
      setHsvMod({ h: hsvModArray[0], s: hsvModArray[1], v: hsvModArray[2]});
      setLerpSpeed(await getLerpSpeed());
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if(hsvCount > 0){
      sendHsvMod();
    }
  }, [hsvCount]);

  useEffect(() => {
    if(lerpCount > 0){
      sendLerpSpeed();
    }
  }, [lerpCount]);
  

  const getForcedColor = async () => {
    const response = await fetch("/color", {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    return response.json();
  };

  const sendForcedColor = async () => {
    const response = await fetch("/color", {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([rgb.r, rgb.g, rgb.b]) 
    });
    return response.json();
  };

  const resetColorToAuto = async () => {
    const response = await fetch("/color", {
      method: 'PUT', 
      headers: {
        'Content-Type': 'application/json'
      },
      body: false
    });
    return response.json();
  }

  const getHsvMod = async () => {
    const response = await fetch("/hsv", {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    return response.json();
  };

  const sendHsvMod = async () => {
    const response = await fetch("/hsv", {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([hsvMod.h, hsvMod.s, hsvMod.v]) 
    });
    return response.json();
  };

  const getLerpSpeed = async () => {
    const response = await fetch("/lerp", {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    return response.json();
  };

  const sendLerpSpeed = async () => {
    const response = await fetch("/lerp", {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(lerpSpeed) 
    });
    return response.json();
  };

  if(loading){
    return <Background></Background>;
  }

  return (
    <>
      <div>
        <Background>
            <br />
            <br />
            <SketchPicker
              color={{ ...rgb, a: 100}}
              onChangeComplete={(color) => {
                setRgb(color.rgb);
                sendForcedColor(color.rgb);
              }}
            />
            <br />
            <br />
            <br />
            <button onClick={() => {
              resetColorToAuto();
            }}>Auto Detect Based on Video Capture</button>
            <br /><br /><br /><br />
            <div style={{ display: 'inline', color: "#000", backgroundColor: "#FFF" }}>H: {hsvMod.h}</div>
            <br /><br />
            <Slider
              styles={SLIDER_STYLE}
              axis="x"
              xmax={5}
              xmin={-5}
              xstep={0.01}
              x={hsvMod.h}
              onChange={({ x }) => setHsvMod(hsvMod => ({ ...hsvMod, h: parseFloat(x.toFixed(2), 10) }))}
              onDragEnd={() => {
                setHsvCount((i) => i + 1)
              }}
            />
            <br /><br />
            <div style={{ display: 'inline', color: "#000", backgroundColor: "#FFF" }}>S: {hsvMod.s}</div>
            <br /><br />
            <Slider
              styles={SLIDER_STYLE}
              axis="x"
              xmax={5}
              xmin={-5}
              xstep={0.01}
              x={hsvMod.s}
              onChange={({ x }) => setHsvMod(hsvMod => ({ ...hsvMod, s: parseFloat(x.toFixed(2), 10) }))}
              onDragEnd={() => {
                setHsvCount((i) => i + 1)
              }}
            />
            <br /><br />
            <div style={{ display: 'inline', color: "#000", backgroundColor: "#FFF" }}>V: {hsvMod.v}</div>
            <br /><br />
            <Slider
              styles={SLIDER_STYLE}
              axis="x"
              xmax={5}
              xmin={-5}
              xstep={0.01}
              x={hsvMod.v}
              onChange={({ x }) => setHsvMod(hsvMod => ({ ...hsvMod, v: parseFloat(x.toFixed(2), 10) }))}
              onDragEnd={() => {
                setHsvCount((i) => i + 1)
              }}
            />
            <br /><br />
            <div style={{ display: 'inline', color: "#000", backgroundColor: "#FFF" }}>Lerp Speed: {lerpSpeed}</div>
            <br /><br />
            <Slider
              styles={SLIDER_STYLE}
              axis="x"
              xmax={1}
              xmin={0.01}
              xstep={0.01}
              x={lerpSpeed}
              onChange={({ x }) => setLerpSpeed(parseFloat(x.toFixed(2), 10))}
              onDragEnd={() => {
                setLerpCount((i) => i + 1)
              }}
            />
        </Background>
      </div>
    </>
  );
}

export default App;
