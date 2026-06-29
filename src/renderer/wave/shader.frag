#version 300 es
precision highp float;

uniform sampler2D u_waveTexture;

in vec2 v_texCoord;
out vec4 outColor;

void main() {
    outColor = vec4(0.0, 0.5, 1.0, 1.0);
    outColor = vec4(v_texCoord, 0.0, 1.0);
    outColor = texture(u_waveTexture, v_texCoord);
    if (outColor.a <= 0.0) {
        discard;
    }
}
