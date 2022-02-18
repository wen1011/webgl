var programInfo;
var programInfo2;

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

function setShaderProgramArrayArg(gl, destPositionInShader, srcArray, elementSize)
{
    gl.bindBuffer(gl.ARRAY_BUFFER, srcArray);

    gl.vertexAttribPointer(
        destPositionInShader,
        elementSize,// pull out 2 values per iteration //Must be 1, 2, 3, or 4.
        gl.FLOAT,// the data in the buffer is 32bit floats
        false,// don't normalize
        0,//stride, how many bytes to get from one set of values to the next
        0);//how many bytes inside the buffer to start from

    gl.enableVertexAttribArray(destPositionInShader);    
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function initProgram(gl)
{
    const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    varying lowp vec4 vColor;

    void main() {
      gl_Position = aVertexPosition;
      vColor = aVertexColor;
    }
    `;

    const fsSource = `
    precision highp float;
    varying lowp vec4 vColor;
    uniform float isReturnWhite;
    void main() {
        if(isReturnWhite > .0)
          gl_FragColor = vec4(isReturnWhite, isReturnWhite, isReturnWhite, 1);
        else
          gl_FragColor = vColor;
    }
    `;
    
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },    
        uniformLocations: {    
            isReturnWhite: gl.getUniformLocation(shaderProgram, 'isReturnWhite')
        }
    };
}


function initProgram2(gl)
{
    const vsSource = `
    attribute vec4 aVertexPosition;

    void main() {
      gl_Position = aVertexPosition;
    }
    `;

    const fsSource = `
    precision highp float;

    uniform float highByte;
    uniform float lowByte;
    void main() {
      gl_FragColor = vec4(0, 0, highByte, lowByte );
    }
    `;
    
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    programInfo2 = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition')
        },    
        uniformLocations: {    
            highByte: gl.getUniformLocation(shaderProgram, 'highByte'),
            lowByte: gl.getUniformLocation(shaderProgram, 'lowByte')
        }
    };
}