
uniform vec2 u_resolution;
uniform vec2 u_offset;

in vec2 v_texCoord;

out vec4 outColor;

void main() {
    vec2 p = v_texCoord * u_resolution + u_offset;
    vec2 period = vec2(0.0);
    float alpha = 0.0;
    vec2 gradient;

    float n = psrdnoise(p, period, alpha, gradient) / 2.0 + 0.5;

    outColor = vec4(n, n, n, 1.0);
}
