#include <Adafruit_NeoPixel.h>
#include <WiFi.h>
#include <WebServer.h>
#include <WiFiUdp.h>

#define PIN 15

typedef struct
{
    float r; // a fraction between 0 and 1
    float g; // a fraction between 0 and 1
    float b; // a fraction between 0 and 1
} rgb;

typedef struct
{
    float h; // angle in degrees
    float s; // a fraction between 0 and 1
    float v; // a fraction between 0 and 1
} hsv;

static hsv rgb2hsv(rgb in);
static rgb hsv2rgb(hsv in);

/* Put your SSID & Password */
const char *ssid = "THE LAIR";      // Enter SSID here
const char *password = "binaslair"; //Enter Password here

const int NUM_PIXELS = 300;

WebServer server(80);

WiFiUDP udp;
rgb lastRgb;
rgb newRgb;

hsv hsvMod;
float lerpSpeed;

Adafruit_NeoPixel pixels = Adafruit_NeoPixel(NUM_PIXELS, PIN, NEO_GRB + NEO_KHZ800);

void setup()
{
    Serial.begin(115200);

    WiFi.mode(WIFI_STA);        /* Configure ESP32 in STA Mode */
    WiFi.begin(ssid, password); /* Connect to Wi-Fi based on the above SSID and Password */
    while (WiFi.status() != WL_CONNECTED)
    {
        Serial.print("*");
        delay(100);
    }
    Serial.print("\n");
    Serial.print("Connected to Wi-Fi: ");
    Serial.println(WiFi.SSID());
    Serial.print("\n");
    Serial.print("Local IP: ");
    Serial.println(WiFi.localIP());
    delay(100);

    server.on("/", handle_OnConnect);
    server.onNotFound(handle_NotFound);

    server.begin();
    Serial.println("HTTP server started");

    udp.begin(1337);
    Serial.println("Listening on UDP port 1337");

    pixels.begin();
    Serial.println("Pixels Initialized");
}

void loop()
{
    char buffer[50] = "";
    server.handleClient();

    // read udp
    udp.parsePacket();
    if (udp.read(buffer, 50) > 0)
    {
        char messageCharArray[50];
        strcpy(messageCharArray, buffer);

        float incomingData[7];

        char *splitChunk = strtok(messageCharArray, ",");

        for (int i = 0; i < 7; i += 1)
        {
            incomingData[i] = atof(splitChunk);
            splitChunk = strtok(NULL, ",");
        }

        newRgb.r = incomingData[0] / 255;
        newRgb.g = incomingData[1] / 255;
        newRgb.b = incomingData[2] / 255;

        hsvMod.h = incomingData[3];
        hsvMod.s = incomingData[4];
        hsvMod.v = incomingData[5];

        lerpSpeed = incomingData[6];
    }

    set_color(newRgb, hsvMod, lerpSpeed);
}

float lerp(float a, float b, float t)
{
    return a + t * (b - a);
}

rgb lerpRgb(rgb a, rgb b, float t)
{
    rgb tempRgb;
    tempRgb.r = lerp(a.r, b.r, t);
    tempRgb.g = lerp(a.g, b.g, t);
    tempRgb.b = lerp(a.b, b.b, t);
    return tempRgb;
}

void set_color(rgb newRgb, hsv hsvMod, float lerpSpeed)
{
    hsv tempHsv = rgb2hsv(newRgb);
    tempHsv.s = tempHsv.s + (tempHsv.s * hsvMod.s);
    tempHsv.v = tempHsv.v + (tempHsv.v * hsvMod.v);

    if (tempHsv.s < 0.0)
    {
        tempHsv.s = 0.0;
    }
    if (tempHsv.s > 1.0)
    {
        tempHsv.s = 1.0;
    }
    if (tempHsv.s < 0.0)
    {
        tempHsv.s = 0.0;
    }
    if (tempHsv.v > 1.0)
    {
        tempHsv.v = 1.0;
    }

    rgb tempRgb = hsv2rgb(tempHsv);

    rgb lerpedRgb = lerpRgb(lastRgb, tempRgb, lerpSpeed);

    lastRgb.r = lerpedRgb.r;
    lastRgb.g = lerpedRgb.g;
    lastRgb.b = lerpedRgb.b;

    int rToSet = (int)round(lerpedRgb.r * 255);
    int gToSet = (int)round(lerpedRgb.g * 255);
    int bToSet = (int)round(lerpedRgb.b * 255);

    for (int i = 0; i < NUM_PIXELS; i++)
    {
        pixels.setPixelColor(i, pixels.Color(rToSet, gToSet, bToSet));
    }
    pixels.show();
}

void handle_OnConnect()
{
    Serial.println("Responding to HTTP request");
    server.send(200, "text/html", SendHTML());
}

void handle_NotFound()
{
    server.send(404, "text/plain", "Not found");
}

String SendHTML()
{
    String ptr = "<!DOCTYPE html> <html>\n";
    ptr += "<head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, user-scalable=no\">\n";
    ptr += "<title>LED Control</title>\n";
    ptr += "<style>html { font-family: Helvetica; display: inline-block; margin: 0px auto; text-align: center;}\n";
    ptr += "body{margin-top: 50px;} h1 {color: #444444;margin: 50px auto 30px;} h3 {color: #444444;margin-bottom: 50px;}\n";
    ptr += ".button {display: block;width: 80px;background-color: #3498db;border: none;color: white;padding: 13px 30px;text-decoration: none;font-size: 25px;margin: 0px auto 35px;cursor: pointer;border-radius: 4px;}\n";
    ptr += ".button-on {background-color: #3498db;}\n";
    ptr += ".button-on:active {background-color: #2980b9;}\n";
    ptr += ".button-off {background-color: #34495e;}\n";
    ptr += ".button-off:active {background-color: #2c3e50;}\n";
    ptr += "p {font-size: 14px;color: #888;margin-bottom: 10px;}\n";
    ptr += "</style>\n";
    ptr += "</head>\n";
    ptr += "<body>\n";
    ptr += "<h1>led-sync</h1>\n";
    ptr += "<h3>:)</h3>\n";

    ptr += "</body>\n";
    ptr += "</html>\n";
    return ptr;
}

hsv rgb2hsv(rgb in)
{
    hsv out;
    float min, max, delta;

    min = in.r < in.g ? in.r : in.g;
    min = min < in.b ? min : in.b;

    max = in.r > in.g ? in.r : in.g;
    max = max > in.b ? max : in.b;

    out.v = max; // v
    delta = max - min;
    if (delta < 0.00001)
    {
        out.s = 0;
        out.h = 0; // undefined, maybe nan?
        return out;
    }
    if (max > 0.0)
    {                          // NOTE: if Max is == 0, this divide would cause a crash
        out.s = (delta / max); // s
    }
    else
    {
        // if max is 0, then r = g = b = 0
        // s = 0, h is undefined
        out.s = 0.0;
        out.h = NAN; // its now undefined
        return out;
    }
    if (in.r >= max)                   // > is bogus, just keeps compilor happy
        out.h = (in.g - in.b) / delta; // between yellow & magenta
    else if (in.g >= max)
        out.h = 2.0 + (in.b - in.r) / delta; // between cyan & yellow
    else
        out.h = 4.0 + (in.r - in.g) / delta; // between magenta & cyan

    out.h *= 60.0; // degrees

    if (out.h < 0.0)
        out.h += 360.0;

    return out;
}

rgb hsv2rgb(hsv in)
{
    float hh, p, q, t, ff;
    long i;
    rgb out;

    if (in.s <= 0.0)
    { // < is bogus, just shuts up warnings
        out.r = in.v;
        out.g = in.v;
        out.b = in.v;
        return out;
    }
    hh = in.h;
    if (hh >= 360.0)
        hh = 0.0;
    hh /= 60.0;
    i = (long)hh;
    ff = hh - i;
    p = in.v * (1.0 - in.s);
    q = in.v * (1.0 - (in.s * ff));
    t = in.v * (1.0 - (in.s * (1.0 - ff)));

    switch (i)
    {
    case 0:
        out.r = in.v;
        out.g = t;
        out.b = p;
        break;
    case 1:
        out.r = q;
        out.g = in.v;
        out.b = p;
        break;
    case 2:
        out.r = p;
        out.g = in.v;
        out.b = t;
        break;

    case 3:
        out.r = p;
        out.g = q;
        out.b = in.v;
        break;
    case 4:
        out.r = t;
        out.g = p;
        out.b = in.v;
        break;
    case 5:
    default:
        out.r = in.v;
        out.g = p;
        out.b = q;
        break;
    }
    return out;
}