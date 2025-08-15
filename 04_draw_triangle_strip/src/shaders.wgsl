struct VertexOutput{
    @builtin(position) clip_position:vec4<f32>,
    @location(0) color:vec4<f32>
};

@group(0) @binding(0)
var<uniform> offset:vec3<f32>;

@vertex
fn vs_main( @builtin(vertex_index) VertexIndex :u32 ) -> VertexOutput{

    var pos: array<vec2<f32>,9>=array<vec2<f32>,9>(
        vec2<f32>(-0.63,  0.80),
        vec2<f32>(-0.65,  0.20),
        vec2<f32>(-0.20,  0.60),
        vec2<f32>(-0.37, -0.07),
        vec2<f32>( 0.05,  0.18),
        vec2<f32>(-0.13, -0.40),
        vec2<f32>( 0.30, -0.13),
        vec2<f32>( 0.13, -0.64),
        vec2<f32>( 0.70, -0.30)     
        
    );

    var color:array<vec3<f32>,9>= array<vec3<f32>,9>(
         vec3<f32>(1.0, 0.0, 0.0),
        vec3<f32>(0.0, 1.0, 0.0),
        vec3<f32>(0.0, 0.0, 1.0),
        vec3<f32>(1.0, 0.0, 0.0),
        vec3<f32>(0.0, 1.0, 0.0),
        vec3<f32>(0.0, 0.0, 1.0),
        vec3<f32>(1.0, 0.0, 0.0),
        vec3<f32>(0.0, 1.0, 0.0),
        vec3<f32>(0.0, 0.0, 1.0),
    );


    var out:VertexOutput;
    out.clip_position=vec4<f32>(pos[VertexIndex],0.0,1.0);
    out.color=vec4<f32>(color[VertexIndex],1.0);
    return out;
}

@fragment
fn fs_main(@location(0) color:vec4<f32>) -> @location(0) vec4<f32>{
    return color;
} 
