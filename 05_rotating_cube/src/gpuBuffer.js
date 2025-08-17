function createGPUBuffer(device,buffer,usage){
    const bufferDesc={
        size:buffer.byteLength,
        usage:usage,
        mappedAtCreation:true,
    }
    console.log('Buffer description:', buffer.byteLength);
    let gpuBuffer=device.createBuffer(bufferDesc);
    if(buffer instanceof Float32Array){
        const writeArrayNormal=new Float32Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(buffer);
    }
    else if(buffer instanceof Uint16Array){
        const writeArrayNormal=new Uint16Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(buffer);
    }
    else if(buffer instanceof Uint8Array){
        const writeArrayNormal=new Uint8Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(buffer);
    }
    else if(buffer instanceof Uint32Array){
        const writeArrayNormal=new Uint32Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(buffer);
    }
    else{
        const writeArrayNormal=new Float32Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(buffer);
        console.error('Unhandled buffer type:', typeof buffer);
    }
    gpuBuffer.unmap();
    return gpuBuffer;
}


export default createGPUBuffer;
