//  1.宣告一個變數來追蹤正方形旋轉角度
var cubeRotation = 0.0
//todo create the <video> element that we'll use to retrieve the video frames
var copyVideo = false
main()

//start now
function main() {
    const canvas = document.querySelector('#glcanvas')
    //初始化 GL context
    const gl = canvas.getContext('webgl')
    //當WebGL有效時才繼續執行
    if (gl === null) {
        alert('無法初始化 WebGL，您的瀏覽器不支援。')
        return
    }
    //  !!重複清除
    //  //設定清除顏色
    //   gl.clearColor(0.0, 0.0, 0.0, 1.0);
    //   // 透過清除色來清除色彩緩衝區
    //   gl.clear(gl.COLOR_BUFFER_BIT);

    //Vertex shader program

    //頂點著色器
    // attribute= 則代表我們如何從緩衝區中獲得資料
    // uniforms=執行 program 之前，能夠設定的全域變數
    // vec2, vec3, vec4 （浮點向量）
    // mat2, mat3, mat4 (矩陣)

    /* 定義的屬性（aVertexPosition）的頂點位置值。
        之後這個值與兩個4x4的矩陣（uProjectionMatrix和uModelMatrix）相乘
        乘積賦值給gl_Position
        */

    //The key difference here is that for each vertex, we pass its color using a varying to the fragment shader.
    // vec2
    // 一頂點座標位置計算出頂點陰影
    // 先根據立方位置與朝向，透過頂點法線*法線矩陣=法線
    // 法線*方向向量(光的方向)=頂點反射方向光的量，固定為0
    // 通過獲取環境光+方向光的顏色+像亮光的量=光照值(lighting value)=RGB，用於片段著色器
    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexNormal;
        attribute vec2 aTextureCoord;

        uniform mat4 uNormalMatrix;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        varying highp vec2 vTextureCoord;
        varying highp vec3 vLighting;

        void main(void){
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            vTextureCoord = aTextureCoord;
            // Apply lighting effect
            highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
            highp vec3 directionalLightColor = vec3(1, 1, 1);
            highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
            highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
            highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
            vLighting = ambientLight + (directionalLightColor * directional);
        }
        `

    // 片段著色器
    // 顏色存儲在特殊變量gl_FragColor中，返回到WebGL層
    //3.為了要讓每個 pixel 使用內插的顏色，我們讓 gl_FragColor 取得 vColor的值。
    // 现在的代码不会再使用一个简单的颜色值填充片段颜色，片段的颜色是通过采样器使用最好的映射方式从纹理中的每一个像素计算出来的。
    // vec2
    // 需要依照頂點著色器計算出的光照值來更新
    const fsSource = `
    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;
    uniform sampler2D uSampler;
    void main(void) {
      highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
      gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
    }
      `
    // Initialize a shader program; this is where all the lighting
    // for the vertices and so forth is established.
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource)
    // Collect all the info needed to use the shader program.
    // Look up which attribute our shader program is using
    // for aVertexPosition and look up uniform locations.
    // 4. Next, it's necessary to add the code look up the attribute location for the colors and setup that attribute for the shader program:
    // 包含纹理坐标信息的属性替换之前使用的顶点颜色属性
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
            textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
        },
    }

    // Here's where we call the routine that builds all the
    // objects we'll be drawing.
    const buffers = initBuffers(gl)
    // modelViewMatrix 繞 Z 軸旋轉 squareRotation 的當前值。
    // 要實際製作動畫，我們需要添加隨時間改變
    //  squareRotation 值的代碼。
    //  我們可以通過創建一個新變量來跟踪我們上次動畫的時間（then）來做到這一點，
    //  然後將以下代碼添加到 main 函數的末尾
    //todo 是傳入 <video> 元素。 WebGL 知道如何拉出當前幀並將其用作紋理
    //todo we call initTexture() followed by setupVideo() .
    const texture = initTexture(gl)
    const video = setupVideo('dog.mp4')
    var then = 0
    //  draw the scene repeatedly
    function render(now) {
        now *= 0.001 //convert to seconds
        const deltaTime = now - then
        then = now
        if (copyVideo) {
            //todo render() 的定義中，如果 copyVideo 為真，那麼我們每次在調用 drawScene() function.n 之前調用 updateTexture()。
            updateTexture(gl, texture, video)
        }

        // Draw the scene
        drawScene(gl, programInfo, buffers, texture, deltaTime)
        requestAnimationFrame(render)
    }
    requestAnimationFrame(render)
}

//初始化著色器,讓WebGL知道如何繪製我们的數據

/*兩個著色器，我們需要將它們傳遞給WebGL ,編譯並將它們連接在一起
        通過調用loadShader（），為著色器傳遞類型和來源,，創建了兩個著色器。
        創建一個附加著色器的程序，將它們連接在一起。
        如果編譯或鏈接失敗，代碼將彈出alert。*/

function initShaderProgram(gl, vsSource, fsSource) {
    /*函數loadShader()從文件加載著色器，並將其作為p5著色器對象返回到變量中。
        文件擴展名可以是.glsl或.shader或.vertex。
        應該從preload()內調用它loadShader()。

        loadShader(vertFilename, fragFilename, [callback], [errorCallback])
        vertFilename：它是字符串類型，並且包含包含頂點著色器源代碼的文件的路徑。
        fragFilename：它是字符串類型，它包含包含片段著色器源代碼的文件的路徑。
        callback:它是在loadShader完成後執行的函數。成功後，將將Shader對象作為第一個參數傳遞。它是可選的。
        errorCallback：這是在loadShader內部發生錯誤時執行的函數。如果有錯誤，則將錯誤作為第一個參數傳遞。它是可選的。

        */
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource)
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)

    //創建著色程序
    /*initShaders 目的則是連結 shader 並且加入 program 裡頭，步驟是
        > gl.attachShader(fragment 跟 vertex shader 都要加入)
        > gl.linkProgram 
        > gl.useProgram
        */

    const shaderProgram = gl.createProgram()
    gl.attachShader(shaderProgram, vertexShader)
    gl.attachShader(shaderProgram, fragmentShader)
    gl.linkProgram(shaderProgram)

    // 創建失敗 alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('無法初始化文件' + gl.getProgramInfoLog(shaderProgram))
        return null
    }
    return shaderProgram
}
//  Initialize a texture and load an image.
//  When the image finished loading copy it into the texture.
//todo 因為它不再需要加載圖像文件。 相反，它所做的只是創建一個空的紋理對象，在其中放置一個像素，並設置其過濾以供以後使用
function initTexture(gl, url) {
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    //todo 因為視頻必須通過互聯網下載
    //todo 他們可能需要一點時間才能準備好，所以在紋理中放置一個像素，這樣我們就可以立即使用。
    const level = 0
    const internalFormat = gl.RGBA
    const width = 1
    const hight = 1
    const border = 0
    const srcFormat = gl.RGBA
    const srcType = gl.UNSIGNED_BYTE
    const pixel = new Uint8Array([0, 0, 255, 255]) //opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, hight, border, srcFormat, srcType, pixel)
    //todo  Turn off mips and set  wrapping to clamp to edge so it
    //todo  will work regardless of the dimensions of the video
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    return texture
}
//
function updateTexture(gl, texture, video) {
    const level = 0
    const internalFormat = gl.RGBA
    const srcFormat = gl.RGBA
    const srcType = gl.UNSIGNED_BYTE
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, video)
}
//
function isPowerOf2(value) {
    return (value & (value - 1)) == 0
}
// 創建指定類型著色器，上傳source源碼並編譯
function loadShader(gl, type, source) {
    //调用gl.createShader().创建一个新的着色器。
    const shader = gl.createShader(type)

    //源代码发送到着色器
    gl.shaderSource(shader, source)

    //一旦着色器获取到源代码，就使用gl.compileShader().进行编译。
    gl.compileShader(shader)

    //see if it compiled successfully
    //shader,gl.COMPILE_STATUS
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('AN ERROR OCCURRED COMPILING THE SHADER:' + gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
    }
    return shader
}

//創建對象
/*initBuffers() 的函數*/

//調用gl 的成員函數 createBuffer() 得到了緩衝對象並存儲在頂點緩衝器
function initBuffers(gl) {
    //建立buffer來儲存正方形座標
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    const positions = [
        //  順序很重要

        //  front face
        -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,

        //  back face
        -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
        //  top face
        -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,
        //  bottom face
        -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
        //  right face
        1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,
        //  left face
        -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
    ]

    //創建一個Javascript 數組去記錄每一個正方體的每一個頂點。
    //然後將其轉化為WebGL 浮點型類型的數組，
    //並將其傳到gl對象的方法來建立對象的頂點。(bufferData())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
    // 建立一個數組來存放立方體所有頂點的法線
    const normalBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
    const vertexNormals = [
        // front
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
        // back
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
        // top
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
        // bottom
        0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,

        // right
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
        // left
        -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
    ]
    //将它和gl.ARRAY_BUFFER绑定在一起，然后通过调用bufferData()把我们的顶点法线数组一起传入。
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW)

    const textureCoordBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer)
    const textureCoordinates = [
        // front
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        // back
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        // top
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        // bottom
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        // right
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        // left
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    ]
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW)
    //1.這段程式碼一開始先宣告一個陣列來存放四個四維向量，分別為四個頂點的顏色。接下來，將陣列轉型為浮點數並存入一個新的 WebGL buffer 。
    //2.為了使用這些顏色，我們需要修改 vertex shader，讓他可以從 buffer 中取得正確的顏色。

    // 定義頂點顏色

    // const faceColors = [
    //     [1.0, 1.0, 1.0, 1.0], //front= white,
    //     [1.0, 0.0, 0.0, 1.0], // back=red
    //     [0.0, 1.0, 0.0, 1.0], //top = green
    //     [0.0, 0.0, 1.0, 1.0], // bottom=blue
    //     [1.0, 1.0, 0.0, 1.0], //Right =yellow
    //     [1.0, 0.0, 1.0, 1.0], //left =purple]
    // // 將顏色數組轉換為所有頂點的表格。
    // var colors = []
    // for (var j = 0; j < faceColors.length; ++j) {
    //     const c = faceColors[j]
    //     //  對面的四個頂點，每種顏色重複四次
    //     colors = colors.concat(c, c, c, c)
    // }

    // const colorBuffer = gl.createBuffer()
    // gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)

    const indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)

    const indices = [
        0,
        1,
        2,
        0,
        2,
        3, //front
        4,
        5,
        6,
        4,
        6,
        7, //back
        8,
        9,
        10,
        8,
        10,
        11, //top
        12,
        13,
        14,
        12,
        14,
        15, //bottom
        16,
        17,
        18,
        16,
        18,
        19, //right
        20,
        21,
        22,
        20,
        22,
        23, //left
    ]
    // 現在將元素數組發送到 GL
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)
    // textureCoord: textureCoordBuffer
    return {
        position: positionBuffer,
        normal: normalBuffer,
        textureCoord: textureCoordBuffer,
        indices: indexBuffer,
    }
}

//!!記得加deltaTime-texture
function drawScene(gl, programInfo, buffers, texture, deltaTime) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0) //  設定為全黑
    gl.clearDepth(1.0) // 清除所有東西
    gl.enable(gl.DEPTH_TEST) // Enable 深度測試
    gl.depthFunc(gl.LEQUAL) // 近的東西掩蓋了遠的東西

    // 開始前先初始化畫布

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.

    // 創建一個透視矩陣，一個特殊的矩陣，即
    // 用於模擬相機中的透視失真。
    // 我們的視野是 45 度，有一個寬度/高度
    // 與畫布顯示大小匹配的比例
    // 我們只想看到 0.1 個單位之間的對象
    // 距離相機 100 個單位。

    const fieldOfView = (45 * Math.PI) / 180 // in radians以弧度為單位
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
    const zNear = 0.1
    const zFar = 100.0
    const projectionMatrix = mat4.create()

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    // 注意：glmatrix.js 總是有第一個參數
    // 作為接收結果的目的地。
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    // 將繪圖位置設置為“身份”點，即
    // 場景的中心。
    const modelViewMatrix = mat4.create()

    // Now move the drawing position a bit to where we want to
    // start drawing the square.
    // 現在將繪圖位置稍微移動到我們想要的位置
    // 開始繪製正方形。

    mat4.translate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to translate
        [-0.0, 0.0, -6.0]
    ) // amount to translate

    //  drawScene() 函數以在繪製正方形時將當前旋轉應用於正方形。
    //  平移到正方形的初始繪圖位置後，我們像這樣應用旋轉：
    mat4.rotate(
        modelViewMatrix, //  目標矩陣
        modelViewMatrix, //  哪個矩陣旋轉
        cubeRotation, //  弧度旋轉的量
        [0, 0, 1]
    ) //  繞軸旋轉
    // 由於我們的立方體的每個面都由兩個三角形組成，因此每邊有 6 個頂點，或者立方體中總共有 36 個頂點，儘管其中許多頂點是重複的。
    //  最後，讓我們用 cubeRotation 替換我們的變量 squareRotation 並添加第二個圍繞 x 軸的旋轉：

    mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 0.7, [0, 1, 0])
    // 我們需要更新構建統一矩陣的代碼，以生成並傳遞給著色器一個法線矩陣，該矩陣用於在處理立方體相對於光源的當前方向時轉換法線：
    const normalMatrix = mat4.create()
    mat4.invert(normalMatrix, modelViewMatrix)
    mat4.transpose(normalMatrix, normalMatrix)
    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    // 告訴 WebGL 如何從倉位中拉出倉位
    // 緩衝到 vertexPosition 屬性中。
    {
        const numComponents = 3 //每次迭代提取 3 個值
        const type = gl.FLOAT //緩衝區中的數據是 32 位浮點數
        const normalize = false //不要標準化
        const stride = 0 //從一組值到下一組值需要多少步
        const offset = 0 //0 =使用的 type 和 numComponents多少以上
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset
        )
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)
    }
    //5. 可以修改為在繪製正方形時實際使用這些顏色：

    {
        const numComponents = 2
        const type = gl.FLOAT
        const normalize = false
        const stride = 0
        const offset = 0
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord)
        gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, numComponents, type, normalize, stride, offset)
        gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord)
    }
    {
        // Tell Webgl how to pull out the normals form
        // the normal buffer into the vertexNormal attribute.
        const numComponents = 3
        const type = gl.FLOAT
        const normalize = false
        const stride = 0
        const offset = 0
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal)
        gl.vertexAttribPointer(programInfo.attribLocations.vertexNormal, numComponents, type, normalize, stride, offset)
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal)
    }
    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices)
    // Tell WebGL to use our program when drawing

    gl.useProgram(programInfo.program)

    // Set the shader uniforms
    //轉換法線
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix)
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix)
    gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix)

    // Specify the texture to map onto the faces.

    // Tell WebGL we want to affect texture unit 0
    gl.activeTexture(gl.TEXTURE0)

    // Bind the texture to texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, texture)

    // Tell the shader we bound the texture to texture unit 0
    gl.uniform1i(programInfo.uniformLocations.uSampler, 0)
    // {
    //   const offset = 0;
    //   const vertexCount = 4;
    //   gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    // }
    {
        //
        const vertexCount = 36
        const type = gl.UNSIGNED_SHORT
        const offset = 0
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset)
    }
    //  此代碼使用 requestAnimationFrame 要求瀏覽器調用函數“渲染”每一幀。
    //  requestAnimationFrame 以毫秒為單位傳遞頁面加載後的時間。
    //  我們將其轉換為秒，然後從最後一次減去它以計算 deltaTime，它是自上一幀渲染以來的秒數。
    //  在 draw scene 結束時，我們添加代碼來更新 squareRotation。
    cubeRotation += deltaTime
}
//todo
function setupVideo(url) {
    const video = document.createElement('video')

    var playing = false
    var timeupdate = false
    video.autoplay = true
    video.muted = true
    video.loop = true
    //todo因為如果您將視頻上傳到尚無可用數據的 WebGL，則會產生錯誤
    //todo 這兩個事件確保，視頻中有數據
    video.addEventListener(
        'playing',
        function () {
            playing = true
            checkReady()
        },
        true
    )
    video.addEventListener(
        'timeupdate',
        function () {
            timeupdate = true
            checkReady()
        },
        true
    )
    //todo 將全局變量 copyVideo 設置為 true，以指示開始將視頻複製到紋理是安全的。
    //todo src 屬性設置為 start 並調用 play 開始加載和播放視頻。
    video.src = url
    video.play()

    function checkReady() {
        if (playing && timeupdate) {
            copyVideo = true
        }
    }
    return video
}
