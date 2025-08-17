const canvas=document.getElementById('canvas');
const  adapter = await navigator.gpu.requestAdapter();
if(!adapter){
    console.error("WebGPU not supported");
}

const device = await adapter.requestDevice({requiredFeatures:['bgra8unorm-storage']});
const context =canvas.getContext('webgpu');
if(!context){
    console.error("WebGPU context not supported");
}
const presentationFormat=navigator.gpu.getPreferredCanvasFormat();
context.configure({
    device:device,
    format:presentationFormat,
});

canvas.width=1080;
canvas.height=720;




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
   
})



const uniformBufferSize=32;


const kOffsetOffset=6;
const kColorOffset=0;
const kScaleOffset=4;
const objectInfos=[];

for(let i=0;i<100;i++){

    const uniformBuffer=device.createBuffer({
        size:uniformBufferSize,
        usage:GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    const uniformValues=new Float32Array(uniformBufferSize/4);
    uniformValues.set([rand(),rand(),rand(),1.0],kColorOffset);
    uniformValues.set([rand(-0.9,0.9),rand(-0.9,0.9)],kOffsetOffset);

    const bindGroup=device.createBindGroup({
        layout:pipeline.getBindGroupLayout(0),
        entries:[
            {
                binding:0,
                resource:{
                    buffer:uniformBuffer,
                }
            }
        ]

    })
    objectInfos.push({
        scale:rand(0.2,0.5),
        uniformBuffer,
        uniformValues,
        bindGroup
    })
}


const renderPassDescriptor={
    colorAttachments:[{
        view:undefined,
        clearValue:[0.5,0.5,0.5,1.0],
        loadOp:'clear',
        storeOp:'store',
    }],
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
    
    renderPassDescriptor.colorAttachments[0].view=context.getCurrentTexture().createView();
    const commandEncoder=device.createCommandEncoder();
    const passEncoder=commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    
    
    for(const {scale , uniformBuffer ,uniformValues ,bindGroup} of objectInfos){
    
        uniformValues.set([scale/aspectRatio,scale],kScaleOffset);
        device.queue.writeBuffer(uniformBuffer,0,uniformValues);
        passEncoder.setBindGroup(0,bindGroup);
        passEncoder.draw(3);
    }
    
    
    passEncoder.end();

    
    device.queue.submit([commandEncoder.finish()]);
    //requestAnimationFrame(frame);
}

function rand(min,max){
    if(min===undefined){
        min=0;
        max=1;
    }
    else if(max===undefined){
        max=min;
        min=0;
    }
    return min+Math.random()*(max-min);
}
requestAnimationFrame(frame);

