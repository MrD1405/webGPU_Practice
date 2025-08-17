struct Uniforms{
    modelViewProjectionMatrix:mat4x4f,
}
@group(0) @binding(0) var<uniform> uniforms:Uniforms;
struct VertexOutput{
    @builtin(position) position:vec4f,
    @location(0) fragUV:vec2f,
    @location(1) fragPosition:vec4f
}

@vertex
fn vertexMain(@location(0) position:vec4f , @location(1) uv :vec2f)-> VertexOutput{
    var out:VertexOutput;
    out.position=uniforms.modelViewProjectionMatrix*position;
    out.fragUV=uv;
    out.fragPosition=0.5 *(position + vec4f(1.0,1.0,1.0,1.0));
    return out;
}

@fragment
fn fragmentMain(@location(0) fragUV:vec2f , @location(1) fragPosition:vec4f ) -> @location(0) vec4f{
    return fragPosition;
}