import './App.css';
import { useEffect, useState } from 'react';
import { SketchPicker } from 'react-color';
import Background from './Background';
import Slider from 'react-input-slider';

const DEFAULT_RGB_STATE = { r: 100, g: 100, b: 100 };
const DEFAULT_HSV_MOD_STATE = { h: 0, s: 0, v: 0 };
const DEFAULT_LERP_SPEED = 1.0;
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
  const [rgbCount, setRgbCount] = useState(0);
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
    if(rgbCount > 0){
      sendForcedColor();
    }
  }, [rgbCount]);

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
                setRgbCount((i) => i + 1)
              }}
            />
            <br />
            <br />
            <br />
            <button onClick={() => {
              resetColorToAuto();
            }}>Auto Detect Color Based on Video Capture</button>
            <br /><br /><br /><br />
            {/* <div style={{ display: 'inline', color: "#000", backgroundColor: "#FFF", padding: 5 }}>H: {hsvMod.h}</div>
            <br />
            <button onClick={() => {
              setHsvMod(hsvMod => ({ ...hsvMod, h: DEFAULT_HSV_MOD_STATE.h }))
              setHsvCount((i) => i + 1)
            }}>Reset</button>
            <br /><br />
            <Slider
              styles={SLIDER_STYLE}
              axis="x"
              xmax={1}
              xmin={-1}
              xstep={0.01}
              x={hsvMod.h}
              onChange={({ x }) => setHsvMod(hsvMod => ({ ...hsvMod, h: parseFloat(x.toFixed(2), 10) }))}
              onDragEnd={() => {
                setHsvCount((i) => i + 1)
              }}
            />
            <br /><br /> */}
            <div style={{ display: 'inline', color: "#000", backgroundColor: "#FFF", padding: 5 }}>Saturation  Modifier: {(hsvMod.s > 0 ? "+" : "") + hsvMod.s}</div>
            <br /><br />
            <button onClick={() => {
              setHsvMod(hsvMod => ({ ...hsvMod, s: DEFAULT_HSV_MOD_STATE.s }))
              setHsvCount((i) => i + 1)
            }}>Reset</button>
            <br /><br />
            <Slider
              styles={SLIDER_STYLE}
              axis="x"
              xmax={1}
              xmin={-1}
              xstep={0.01}
              x={hsvMod.s}
              onChange={({ x }) => setHsvMod(hsvMod => ({ ...hsvMod, s: parseFloat(x.toFixed(2), 10) }))}
              onDragEnd={() => {
                setHsvCount((i) => i + 1)
              }}
            />
            <br /><hr/><br />
            <div style={{ display: 'inline', color: "#000", backgroundColor: "#FFF", padding: 5 }}>Value Modifier: {(hsvMod.v > 0 ? "+" : "") + hsvMod.v}</div>
            <br /><br />
            <button onClick={() => {
              setHsvMod(hsvMod => ({ ...hsvMod, v: DEFAULT_HSV_MOD_STATE.v }))
              setHsvCount((i) => i + 1)
            }}>Reset</button>
            <br /><br />
            <Slider
              styles={SLIDER_STYLE}
              axis="x"
              xmax={1}
              xmin={-1}
              xstep={0.01}
              x={hsvMod.v}
              onChange={({ x }) => setHsvMod(hsvMod => ({ ...hsvMod, v: parseFloat(x.toFixed(2), 10) }))}
              onDragEnd={() => {
                setHsvCount((i) => i + 1)
              }}
            />
            <br /><hr/><br />
            <div style={{ display: 'inline', color: "#000", backgroundColor: "#FFF", padding: 5 }}>Lerp Speed: {lerpSpeed}</div>
            <br /><br />
            <button onClick={() => {
              setLerpSpeed(DEFAULT_LERP_SPEED)
              setLerpCount((i) => i + 1)
            }}>Reset</button>
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
