#version 300 es

in vec2 a_position;
in vec2 a_texCoord;

uniform sampler2D u_noiseTexture;

layout(std140) uniform Camera {
    mat4 projectionMatrix;
    mat4 viewMatrix;
    vec3 lightDirection;
    float time;
};

float getHeight(sampler2D noiseTexture, vec2 p, float time,
    out vec3 normal) {
    vec4 h1 = texture(noiseTexture, vec2(p.x * 0.45 + p.y * 0.1, p.x * 0.04 - p.y * 0.53) + vec2(0.00131, 0.00027) * time);
    vec4 h2 = texture(noiseTexture, vec2(p.x * 0.13 + p.y * 0.84, p.x * 0.78 - p.y * 0.01) + vec2(-0.000424, 0.00091) * time);

    return (h1.r - 0.5) * 0.88 + (h2.r - 0.5) * 0.37;
}

out vec2 v_texCoord;
out vec3 v_normal;

void main() {
    float h = getHeight(u_noiseTexture, a_texCoord, time, v_normal);

    vec4 p = vec4(a_position.x, h, a_position.y, 1.0);
    gl_Position = projectionMatrix * viewMatrix * p;
    v_texCoord = a_texCoord;
}
