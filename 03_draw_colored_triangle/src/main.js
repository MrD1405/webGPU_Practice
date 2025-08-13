import createGPUBuffer from "./render.js";




const canvas=document.getElementById("canvas");

//kind of like driver that allows talking to the GPU
const adapter=await navigator.gpu.requestAdapter();

let device=await adapter.requestDevice();
if(!device){
    console.error("Failed to create a GPU device");

}

const context=canvas.getContext("webgpu");
if(!context){
    console.error("Failed to get WebGPU context from canvas");

}
//configure the canvas to use webGPU
const canvasConfig={
    device:device,
    format:navigator.gpu.getPreferredCanvasFormat(),
    usage:
        GPUTextureUsage.RENDER_ATTACHMENT,
    alphaMode:'opaque'
}
context.configure(canvasConfig);

//create a texture that will be used to render the output




const shaderResponse=await fetch('./src/shaders.wgsl');
const shaderDesc=await shaderResponse.text();

let shaderModule=device.createShaderModule({
    label:'hardcoded red traingle',
    code:shaderDesc,
});

const positionAttributeDesc={
    shaderLocation:0,
    offset:0,
    format:'float32x3',
}

const positionBufferLayoutDesc={
    attributes:[positionAttributeDesc],
    arrayStride:4*3,
    stepMode:'vertex',
}

const positions=new Float32Array([
    0.0,1.0,0.0,
    -1.0,-1.0,0.0,
    1.0,-1.0,0.0,
]);

const positionBufferDesc={
    size:positions.byteLength,
    usage:GPUBufferUsage.VERTEX,
    mappedAtCreation:true
};

const colorAttributeDesc={
    shaderLocation:1,
    offset:0,
    format:'float32x3',
}
const colorBufferLayoutDesc={
    attributes:[colorAttributeDesc],
    arrayStride:4*3,
    stepMode:'vertex',
}
const colors=new Float32Array([
    1.0,0.0,0.0,
    0.0,1.0,0.0,
    0.0,0.0,1.0,
]);

const colorBuffer=createGPUBuffer(device, colors,GPUBufferUsage.VERTEX);

let positionBuffer=device.createBuffer(positionBufferDesc);
const writeArray=new Float32Array(positionBuffer.getMappedRange());
writeArray.set(positions);
positionBuffer.unmap();
//define the pipeline layout
const pipelineLayoutDesc={bindGroupLayouts:[]};
const pipelineLayout=device.createPipelineLayout(pipelineLayoutDesc);

//output pixel format
const colorFormat={format:'bgra8unorm'
};

//create the render pipeline
const renderPipelineDesc={
    layout:pipelineLayout,
    vertex:{
        module:shaderModule,
        entryPoint:'vs_main',
        buffers:[positionBufferLayoutDesc,colorBufferLayoutDesc],
    },
    fragment:{
        module:shaderModule,
        entryPoint:'fs_main',
        targets:[colorFormat],
    },
    primitive:{
        topology:'triangle-list',
        frontFace:'ccw',
        cullMode:'back',
    }

};
let pipeline=device.createRenderPipeline(renderPipelineDesc);


canvas.width = 640;
canvas.height = 480; 
let colorTexture=context.getCurrentTexture();
//create a texture view that acts like singular image of the texture
let colorTextureView=colorTexture.createView();
//acts as a buffer that holds color information or pixels
let colorAttachment={
    view:colorTextureView,
    clearValue:{r:0.5,g:0.5,b:0.5,a:1},
    loadOp:'clear',
    storeOp:'store'
};

//create a render pass descriptor that describes how to render to the texture
let renderPassDesc={
    colorAttachments:[colorAttachment],
};

let commandEncoder=device.createCommandEncoder();
//create a render pass encoder that will encode the commands to render to the texture
let renderPassEncoder=commandEncoder.beginRenderPass(renderPassDesc);
//renderPassEncoder.setViewPort(0,0,canvas.width,canvas.height,0,1);
renderPassEncoder.setVertexBuffer(0,positionBuffer);
renderPassEncoder.setVertexBuffer(1,colorBuffer);
renderPassEncoder.setPipeline(pipeline);

renderPassEncoder.draw(3,1);
renderPassEncoder.end();
device.queue.submit([commandEncoder.finish()]);

