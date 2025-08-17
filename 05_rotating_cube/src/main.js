import {vec3,mat4} from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';
import {
    cubePositionOffset,cubeUVOffset,cubeVertexArray,cubeVertexCount,cubeVertexSize
} from './cube.js';

import createGPUBuffer from './gpuBuffer.js';

const canvas=document.getElementById('canvas');
const  adapter = await navigator.gpu.requestAdapter();
if(!adapter){
    console.error("WebGPU not supported");
}

const device = await adapter.requestDevice();
const context =canvas.getContext('webgpu');
if(!context){
    console.error("WebGPU context not supported");
}
const presentationFormat=navigator.gpu.getPreferredCanvasFormat();
context.configure({
    device:device,
    format:presentationFormat,
});

canvas.width=640;
canvas.height=480;

const vertexbuffer=createGPUBuffer(device , cubeVertexArray , GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);


const response=await fetch('./src/shaders.wgsl');
const shaderCode=await response.text();

const vertexShaderModule=device.createShaderModule({
    code:shaderCode,
    entryPoint:'vertexMain',
})

const fragmentShaderModule=device.createShaderModule({
    code:shaderCode,
    entryPoint:'fragmentMain',
    
})

const pipeline= device.createRenderPipeline({
    layout:'auto',
    vertex:{
        module:vertexShaderModule,
        buffers:[
        {
            arrayStride:cubeVertexSize,
            attributes:[{
                shaderLocation:0,
                offset:cubePositionOffset,
                format:'float32x4',
            },{
                shaderLocation:1,
                offset:cubeUVOffset,
                format:'float32x2'
            }]
        }
    ]
    },
    fragment:{
        module:fragmentShaderModule,
        targets:[{
        format:presentationFormat,
    }]
    },
    primitive:{
        topology:'triangle-list',
        cullMode:'back',
    },
    depthStencil:{
        depthWriteEnabled:true,
        depthCompare:'less',
        format:'depth24plus',
    }
})

const depthTexture=device.createTexture({
    size:[canvas.width , canvas.height],
    format:'depth24plus',
    usage:GPUTextureUsage.RENDER_ATTACHMENT,
})

const uniformBufferSize=4*16;
const uniformBuffer=device.createBuffer({
    size:uniformBufferSize,
    usage:GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
})

const uniformBindGroup =device.createBindGroup({
    layout:pipeline.getBindGroupLayout(0),
    entries:[{
        binding:0,
        resource:{
            buffer:uniformBuffer,
        }
    }]
})

const RenderPassDescriptor={
    colorAttachments:[{
        view:undefined,
        clearValue:[0.5,0.5,0.5,1.0],
        loadOp:'clear',
        storeOp:'store',
    }],
    depthStencilAttachment:{
        view :depthTexture.createView(),
        depthClearValue:1.0,
        depthLoadOp:'clear',
        depthStoreOp:'store',
    }
}

const aspectRatio=canvas.width/canvas.height;
let projectionMatrix=mat4.create();
mat4.perspective(projectionMatrix,(2*Math.PI)/5, aspectRatio,1 ,100.0);
const modelViewProjectionMatrix=mat4.create();
//mat4.identity(modelViewProjectionMatrix);


function getTransformationMatrix(){
    const viewMatrix=mat4.create();
    mat4.identity(viewMatrix);
    mat4.translate(viewMatrix,viewMatrix,vec3.fromValues(0,0,-4));
    const now=Date.now()/1000;
    //console.log(viewMatrix)
    mat4.rotate(
        viewMatrix,
        viewMatrix,
        now,
        vec3.fromValues(Math.sin(now), Math.cos(now),0),
       
    );
    mat4.multiply(modelViewProjectionMatrix, projectionMatrix,viewMatrix);
    return modelViewProjectionMatrix;
}

function frame(){
    let  transformationMatrix=mat4.create();
    transformationMatrix=getTransformationMatrix();
    
    device.queue.writeBuffer(uniformBuffer,0,
        transformationMatrix.buffer,
        transformationMatrix.byteOffset,
        transformationMatrix.byteLength
    )
    RenderPassDescriptor.colorAttachments[0].view=context.getCurrentTexture().createView();
    const commandEncoder=device.createCommandEncoder();
    const passEncoder=commandEncoder.beginRenderPass(RenderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.setVertexBuffer(0,vertexbuffer);
    passEncoder.setBindGroup(0,uniformBindGroup);
    passEncoder.draw(cubeVertexCount);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);



