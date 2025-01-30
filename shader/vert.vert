in vec2 aPosition;
in vec2 aUV;
in vec2 aPositionOffset;
in float aAlpha;
in float aSize;

out vec2 vUV;
out float vAlpha;
uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

void main() {
    // Scale the position by the size
    vec2 scaledPosition = aPosition * aSize;
    
    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    gl_Position = vec4((mvp * vec3(scaledPosition + aPositionOffset, 1.0)).xy, 0.0, 1.0);

    vUV = aUV;
    vAlpha = aAlpha;
}