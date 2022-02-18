var g_redShape;
var g_greenShape;
var g_cursorShape;

function initScene(gl)
{
    g_redShape = createRedShape(gl);
    g_greenShape = createGreenShape(gl);    
}

function drawPickObj(gl) {
    drawBackground(gl);
    
    drawRedShape(gl,0);
    drawGreenShape(gl,0);
}

function drawCursor(gl, x, y)
{
    if(g_cursorShape!=null)
    {
        gl.deleteBuffer(g_cursorShape.positionBuffer);
        gl.deleteBuffer(g_cursorShape.colorBuffer);
    }

    var cursorSize = 0.06;
    g_cursorShape = createCursorShape(gl, x, y, cursorSize);

    setShaderProgramArrayArg(gl,
        programInfo.attribLocations.vertexPosition, 
        g_cursorShape.position, g_cursorShape.position.itemSize);
        
    setShaderProgramArrayArg(gl,
        programInfo.attribLocations.vertexColor, 
        g_cursorShape.color, g_cursorShape.color.itemSize);
        
    gl.useProgram(programInfo.program);
    gl.uniform1f(programInfo.uniformLocations.isReturnWhite, 0);  
        
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function getObjectIdUnderCursor(gl, screenX, screenY, cursorSize)
{
    //bind to FBO
    gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);  

    //
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.disable(gl.BLEND);

    //red shape
    {
        var lowByte = g_redShape.objectId & 255;
        var highByte = (g_redShape.objectId >>> 8) & 255;
        lowByte = lowByte/255;//值域轉爲[0,1]
        highByte = highByte/255;//值域轉爲[0,1]
    
        setShaderProgramArrayArg(gl,
            programInfo2.attribLocations.vertexPosition, 
            g_redShape.position, g_redShape.position.itemSize);
    
        gl.useProgram(programInfo2.program);  
        gl.uniform1f(programInfo2.uniformLocations.lowByte, lowByte);  
        gl.uniform1f(programInfo2.uniformLocations.highByte, highByte);  
    
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); 
    }

    //green shape
    {
        var lowByte = g_greenShape.objectId & 255;
        var highByte = (g_greenShape.objectId >>> 8) & 255;
        lowByte = lowByte/255;//值域轉爲[0,1]
        highByte = highByte/255;//值域轉爲[0,1]
    
        setShaderProgramArrayArg(gl,
            programInfo2.attribLocations.vertexPosition, 
            g_greenShape.position, g_greenShape.position.itemSize);
    
        gl.uniform1f(programInfo2.uniformLocations.lowByte, lowByte);  
        gl.uniform1f(programInfo2.uniformLocations.highByte, highByte);  
    
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); 
    }

    //gl.flush(); 

    //
    var objId = 0;
    var pixelData = new Uint8Array(4 * (cursorSize*2) * (cursorSize*2));
    gl.readPixels(screenX - cursorSize, screenY - cursorSize, 
        cursorSize*2, cursorSize*2, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);

    if (pixelData && pixelData.length) {
        var length = (cursorSize*2) * (cursorSize*2);
        for(var index = 0; index < length; index += 4)
        {
            objId = pixelData[index + 3];//shader中的定義域[0,1]，取出來的值域[0,255]，所以不需要再multiply 255.
            objId += 256 * pixelData[index + 2];
            if(objId!=0)
            {
                //console.log("objId = " + objId);
                break;
            }//if
        }//for
    }//if

    //unbind
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); 

    return objId;    
}//getObjectIdUnderCursor

function drawBackground(gl)
{
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.clearStencil(0);                 // 用0填充 stencil buffer
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);    
}

function drawGreenShape(gl, isHighlight)
{
    setShaderProgramArrayArg(gl,
        programInfo.attribLocations.vertexPosition, 
        g_greenShape.position, g_greenShape.position.itemSize);
        
    setShaderProgramArrayArg(gl,
        programInfo.attribLocations.vertexColor, 
        g_greenShape.color, g_greenShape.color.itemSize);        
        
    gl.useProgram(programInfo.program);
    gl.uniform1f(programInfo.uniformLocations.isReturnWhite, isHighlight);  

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); 
}

function drawRedShape(gl, isHighlight)
{
    setShaderProgramArrayArg(gl,
        programInfo.attribLocations.vertexPosition, 
        g_redShape.position, g_redShape.position.itemSize);
        
    setShaderProgramArrayArg(gl,
        programInfo.attribLocations.vertexColor, 
        g_redShape.color, g_redShape.color.itemSize);
        
    gl.useProgram(programInfo.program);
    gl.uniform1f(programInfo.uniformLocations.isReturnWhite, isHighlight);  

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); 
}

//這裏draw layout設定不合理， 雖然不影響演示pick object的實現，等有時間，再完善demo.
function drawCursorLocation(gl, x, y, screenX, screenY)
{
    drawPickObj(gl);

    var objectId = getObjectIdUnderCursor(gl,screenX, screenY, 4);
    if( objectId != 0 )
    {
        if(objectId == g_redShape.objectId)
        {
            drawBackground(gl);
            drawRedShape(gl,1);
            drawGreenShape(gl,0);
        } else if(objectId == g_greenShape.objectId){
            drawBackground(gl);
            drawRedShape(gl,0);
            drawGreenShape(gl,1);
        }
    }    
    
    //這裏cursor size的設定不是很好， 雖然不影響演示pick object的實現，等有時間，再完善demo.
    drawCursor(gl,x,y);
}

var rttFramebuffer;  
var rttTexture;  
  
function initTextureFramebuffer(canvasWidth,canvasHeight) {  
    //create frame buffer  
    rttFramebuffer = gl.createFramebuffer();  
    gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);  
    rttFramebuffer.width = canvasWidth;  
    rttFramebuffer.height = canvasHeight;  
  
    //create texture  
    rttTexture = gl.createTexture();  
    gl.bindTexture(gl.TEXTURE_2D, rttTexture);  
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);  
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);  
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    //gl.generateMipmap(gl.TEXTURE_2D);//如果texture的width和height，不符合width=height=2^n等式generate mip map會失敗。  
  
    //把texture的圖片數據指針註銷（交給frame buffer管理）  
    gl.texImage2D(gl.TEXTURE_2D, //指定目標紋理，這個值必須是gl.TEXTURE_2D  
    0, // 執行細節級別。0是最基本的圖像級別，n表示第N級貼圖細化級別  
    gl.RGBA, //internalFormat, 指定紋理中的顏色組件。可選的值有GL_ALPHA,GL_RGB,GL_RGBA,GL_LUMINANCE, GL_LUMINANCE_ALPHA 等幾種。  
    rttFramebuffer.width, rttFramebuffer.height, //紋理圖像的寬、高度，必須是2的n次方。紋理圖片至少要支持64個材質元素的寬、高度  
    0, //邊框的寬度。必須爲0。  
    gl.RGBA, //源數據的顏色格式, 不需要和internalFormat取值必須相同。  
    gl.UNSIGNED_BYTE, //源數據分量的數據類型。  
    null);//內存中指向圖像數據的指針  
  
    //create render buffer  
    var renderbuffer = gl.createRenderbuffer();  
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);  
    //設置當前工作的渲染緩衝的存儲大小  
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, //這兩個參數是固定的  
    rttFramebuffer.width, rttFramebuffer.height);  
  
    //texture綁定到frame buffer中  
    //https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/framebufferTexture2D  
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,   
    gl.TEXTURE_2D, //target  
    rttTexture, //source, A WebGLTexture object whose image to attach.  
    0);//A GLint specifying the mipmap level of the texture image to be attached. Must be 0.  
  
  
    //把render buffer綁定到frame buffer上  
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,   
    gl.RENDERBUFFER, //renderBufferTarget, A GLenum specifying the binding point (target) for the render buffer.  
    renderbuffer);//A WebGLRenderbuffer object to attach.  
  
    //unbind  
    gl.bindTexture(gl.TEXTURE_2D, null);  
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);  
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);  
}  