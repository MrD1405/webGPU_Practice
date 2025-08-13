const outputLabel=document.getElementById("outputLabel");
const canvas=document.getElementById("canvas");
console.log(navigator.gpu);
if(navigator.gpu){
    outputLabel.innerHTML="WebGPU is supported!";
}
else{
    outputLabel.innerHTML="WebGPU is not supported in this browser.";
}
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
let colorTexture=context.getCurrentTexture();
//create a texture view that acts like singular image of the texture
let colorTextureView=colorTexture.createView();
//acts as a buffer that holds color information or pixels
let colorAttachment={
    view:colorTextureView,
    clearValue:{r:1,g:0,b:0,a:1},
    loadOp:'clear',
    storeOp:'store'
};

//create a render pass descriptor that describes how to render to the texture
let renderPassDesc={
    colorAttachments:[colorAttachment],
}

commandEncoder=device.createCommandEncoder();
//create a render pass encoder that will encode the commands to render to the texture
let renderPassEncoder=commandEncoder.beginRenderPass(renderPassDesc);
renderPassEncoder.setViewPort(0,0,canvas.width,canvas.height,0,1);
renderPassEncoder.end();
device.queue.submit([commandEncoder.finish()]);