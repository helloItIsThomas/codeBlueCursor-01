precision mediump float;

in vec2 vUV;
in float vAlpha;
// in float vIndex;

uniform sampler2D myTexture;
uniform float time;
uniform vec2 mousePos;
uniform float mouseVelocity;

void main() {
    gl_FragColor = texture2D(myTexture, vUV) * (vAlpha);
    // gl_FragColor = texture2D(myTexture, vUV);
    // gl_FragColor = vec4(1.0, 0.0, mousePosX, 1.0);
}