#version 300 es

in vec2 a_position;
in vec2 a_texCoord;

uniform sampler2D u_noiseTexture;


layout(std140) uniform Camera {
    mat4 projectionMatrix;
    mat4 viewMatrix;
};

out vec2 v_texCoord;

void main() {

    float h = texture(u_noiseTexture, a_texCoord).r -0.5;

    vec4 p = vec4(a_position.x, h-0.5, a_position.y, 1.0);
    gl_Position = projectionMatrix * viewMatrix * p;
    v_texCoord = a_texCoord;
}
