  main();

  //start now
  function main() {
      const canvas = document.querySelector('#glcanvas');
  //初始化 GL context
  const gl = canvas.getContext('webgl');
  //當WebGL有效時才繼續執行
  if (gl === null) {
      alert("無法初始化 WebGL，您的瀏覽器不支援。");
      return;
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

//todo 2. The key difference here is that for each vertex, we pass its color using a varying to the fragment shader.
  const vsSource=`
  attribute vec4 aVertexPosition;
  attribute vec4 aVertexColor;


  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying lowp vec4 vColor;

  void main(void){
      gl_Position=uProjectionMatrix* uModelViewMatrix* aVertexPosition;
      vColor=aVertexColor;
  }
  `;

  // 片段著色器
  // 顏色存儲在特殊變量gl_FragColor中，返回到WebGL層
  //todo 3.為了要讓每個 pixel 使用內插的顏色，我們讓 gl_FragColor 取得 vColor的值。;
  const fsSource = `
  varying lowp vec4 vColor;

  void main(void) {
    gl_FragColor = vColor;
  }
`;
    // Initialize a shader program; this is where all the lighting
    // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    // Collect all the info needed to use the shader program.
    // Look up which attribute our shader program is using
    // for aVertexPosition and look up uniform locations.
    //todo 4. Next, it's necessary to add the code look up the attribute location for the colors and setup that attribute for the shader program:
    const programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      },
    };

    // Here's where we call the routine that builds all the
    // objects we'll be drawing.
    const buffers = initBuffers(gl);

    // Draw the scene
    drawScene(gl, programInfo, buffers);

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
  const vertexShader= loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader=loadShader(gl, gl.FRAGMENT_SHADER,fsSource);

  //創建著色程序
  /*initShaders 目的則是連結 shader 並且加入 program 裡頭，步驟是
  > gl.attachShader(fragment 跟 vertex shader 都要加入)
  > gl.linkProgram 
  > gl.useProgram
  */

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // 創建失敗 alert
  if (!gl.getProgramParameter(shaderProgram,gl.LINK_STATUS)){
  alert("無法初始化文件"+gl.getProgramInfoLog(shaderProgram));
  return null;
  }
  return shaderProgram;

  }
  // 創建指定類型著色器，上傳source源碼並編譯
  function loadShader(gl,type,source) {

  //调用gl.createShader().创建一个新的着色器。
  const shader=gl.createShader(type);


  //源代码发送到着色器
  gl.shaderSource(shader,source);


  //一旦着色器获取到源代码，就使用gl.compileShader().进行编译。
  gl.compileShader(shader);

  //see if it compiled successfully
  //!!shader,gl.COMPILE_STATUS
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
      alert("AN ERROR OCCURRED COMPILING THE SHADER:"+gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
  }
  return shader;
  }



  //創建對象
  /*initBuffers() 的函數*/

  //調用gl 的成員函數 createBuffer() 得到了緩衝對象並存儲在頂點緩衝器
  function initBuffers(gl){
      //建立buffer來儲存正方形座標
      const positionBuffer= gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);
      const positions=[ 1.0,  1.0, -1.0, 1.0,1,-1,-1,-1];
          
      
      //創建一個Javascript 數組去記錄每一個正方體的每一個頂點。
      //然後將其轉化為WebGL 浮點型類型的數組，
      //並將其傳到gl對象的方法來建立對象的頂點。(bufferData())
      gl.bufferData(gl.ARRAY_BUFFER,
          new Float32Array(positions),
          gl.STATIC_DRAW);
         
         
          //todo 1.這段程式碼一開始先宣告一個陣列來存放四個四維向量，分別為四個頂點的顏色。接下來，將陣列轉型為浮點數並存入一個新的 WebGL buffer 。
          //todo 2.為了使用這些顏色，我們需要修改 vertex shader，讓他可以從 buffer 中取得正確的顏色。


     const colors = [
    1.0,  1.0,  1.0,  1.0,    // white
    1.0,  0.0,  0.0,  1.0,    // red
    0.0,  1.0,  0.0,  1.0,    // green
    0.0,  0.0,  1.0,  1.0,    // blue
  ];

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    color: colorBuffer,
  };
}

  function drawScene(gl, programInfo, buffers) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  //  設定為全黑
    gl.clearDepth(1.0);                 // 清除所有東西
    gl.enable(gl.DEPTH_TEST);           // Enable 深度測試
    gl.depthFunc(gl.LEQUAL);            // 近的東西掩蓋了遠的東西

  // 開始前先初始化畫布

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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

    const fieldOfView = 45 * Math.PI / 180;   // in radians以弧度為單位
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    // 注意：glmatrix.js 總是有第一個參數
    // 作為接收結果的目的地。
    mat4.perspective(projectionMatrix,
                    fieldOfView,
                    aspect,
                    zNear,
                    zFar);

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    // 將繪圖位置設置為“身份”點，即
    // 場景的中心。
    const modelViewMatrix = mat4.create();

    // Now move the drawing position a bit to where we want to
    // start drawing the square.
    // 現在將繪圖位置稍微移動到我們想要的位置
    // 開始繪製正方形。

    mat4.translate(modelViewMatrix,     // destination matrix
                  modelViewMatrix,     // matrix to translate
                  [-0.0, 0.0, -6.0]);  // amount to translate

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    // 告訴 WebGL 如何從倉位中拉出倉位
    // 緩衝到 vertexPosition 屬性中。
    {
      const numComponents = 2;//每次迭代提取 3 個值
      const type = gl.FLOAT;//緩衝區中的數據是 32 位浮點數
      const normalize = false;//不要標準化
      const stride = 0;//從一組值到下一組值需要多少步
      const offset = 0;//0 =使用的 type 和 numComponents多少以上
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.vertexAttribPointer(
          programInfo.attribLocations.vertexPosition,
          numComponents,
          type,
          normalize,
          stride,
          offset);
      gl.enableVertexAttribArray(
          programInfo.attribLocations.vertexPosition);
    }
//todo 5. 可以修改為在繪製正方形時實際使用這些顏色：

{
  const numComponents = 4;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  gl.vertexAttribPointer(
      programInfo.attribLocations.vertexColor,
      numComponents,
      type,
      normalize,
      stride,
      offset);
  gl.enableVertexAttribArray(
      programInfo.attribLocations.vertexColor);
}

    // Tell WebGL to use our program when drawing

    gl.useProgram(programInfo.program);

    // Set the shader uniforms

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);

    {
      const offset = 0;
      const vertexCount = 4;
      gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }
  }



