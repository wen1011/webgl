function createRedShape(gl) {
    const positionBuffer = gl.createBuffer();//不用的時候可以通過gl.deleteBuffer(buffer);刪除
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
        0.5, 0.5,
        -0.5, 0.5,
        0.5, -0.5,
        -0.5, -0.5,
    ];
    gl.bufferData(gl.ARRAY_BUFFER,
                    new Float32Array(positions),
                    gl.STATIC_DRAW);
    positionBuffer.itemSize = 2;


    const colors = [
    1.0, 0.0, 0.0, 1.0,    // 
    1.0, 0.0, 0.0, 1.0,    // red
    1.0, 0.0, 0.0, 1.0,    // 
    1.0, 0.0, 0.0, 1.0,    // 
    ];
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    colorBuffer.itemSize = 4;

    return {
        position: positionBuffer,
        color: colorBuffer,
        objectId:1001
    };
}

function createGreenShape(gl) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
        0.6, 0.5,
        0, 0.5,
        0.6, -0.5,
        0, -0.5,
    ];
    gl.bufferData(gl.ARRAY_BUFFER,
                    new Float32Array(positions),
                    gl.STATIC_DRAW);
    positionBuffer.itemSize = 2;

    const colors = [
        0.0, 1.0, 0.0, 1.0,    // 
        0.0, 1.0, 0.0, 1.0,    // 
        0.0, 1.0, 0.0, 1.0,    // 
        0.0, 1.0, 0.0, 1.0,    // 
    ];
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    colorBuffer.itemSize = 4;

    return {
        position: positionBuffer,
        color: colorBuffer,
        objectId:1002
    };
}

function createCursorShape(gl, x, y, cursorSize)
{
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    let left = x - cursorSize;
    let right = x + cursorSize;
    let top = y + cursorSize;
    let bottom = y - cursorSize; 
    const positions = [
        right, top,
        left, top,
        right, bottom,
        left, bottom
    ];
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW);
    positionBuffer.itemSize = 2;

    const colors = [
        0.0, 0.0, 1.0, 1.0,    // 
        0.0, 0.0, 1.0, 1.0,    // 
        0.0, 0.0, 1.0, 1.0,    // 
        0.0, 0.0, 1.0, 1.0,    // 
    ];
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    colorBuffer.itemSize = 4;

    return {
        position: positionBuffer,
        color: colorBuffer,
    };
}