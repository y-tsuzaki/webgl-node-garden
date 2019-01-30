class WebGLNodeGarden {
  private _canvas: HTMLCanvasElement;
  public constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
  }

  private _renderer: THREE.WebGLRenderer;
  public get renderer(): THREE.WebGLRenderer {
    return this._renderer;
  }
  private _composer: THREE.EffectComposer;
  private _camera: THREE.PerspectiveCamera;
  private _scene: THREE.Scene;
  private _controls: THREE.OrbitControls; // for DEBUG

  private _nodes: THREE.Points;
  private _lines: Array<THREE.Line>; // TODO: ノード間の接続のための線ってなんていうんだっけ

  public stats: any;

  public readonly NODES_MAX = 512;

  public init(): void {
    let width = window.innerWidth;
    let height = window.innerHeight;

    // init renderer
    this._renderer = new THREE.WebGLRenderer({ antialias: true , canvas: this._canvas});
    this._renderer.setClearColor(0x000011);
    var pixelRatio = window.devicePixelRatio;
    this._renderer.setSize(width, height);
    this._renderer.setPixelRatio(pixelRatio);


    this._composer = new THREE.EffectComposer(this._renderer);


    var params = {
      exposure: 1,
      bloomStrength: 1.0,
      bloomThreshold: 0,
      bloomRadius: 0
    };
    var bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.renderToScreen = true;
    bloomPass.threshold = params.bloomThreshold;
    bloomPass.strength = params.bloomStrength;
    bloomPass.radius = params.bloomRadius;

    // init camera
    let fov = 60;
    let near = 1;
    let far = 100000;
    let aspect = window.innerWidth / window.innerHeight;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far); //あとでOrthographicCameraに変える
    this._camera.position.set(0, 20, 40);
    this._camera['onResized'] = (w: number, h: number) => {
      let aspect = w / h;
      this._camera.aspect = aspect;
      this._camera.updateProjectionMatrix();
    };
    //init scene
    this._scene = new THREE.Scene();
    var renderPass = new THREE.RenderPass(this._scene, this._camera);
    this._composer.setSize(window.innerWidth, window.innerHeight);
    this._composer.addPass(renderPass);
    this._composer.addPass(bloomPass);

    // init GUI 
    // var gui = new dat.GUI();
    // gui.add(params, 'exposure', 0.1, 2).onChange(function (value) {
    //   this._renderer.toneMappingExposure = Math.pow(value, 4.0);
    // });
    // gui.add(params, 'bloomThreshold', 0.0, 1.0).onChange(function (value) {
    //   bloomPass.threshold = Number(value);
    // });
    // gui.add(params, 'bloomStrength', 0.0, 3.0).onChange(function (value) {
    //   bloomPass.strength = Number(value);
    // });
    // gui.add(params, 'bloomRadius', 0.0, 1.0).step(0.01).onChange(function (value) {
    //   bloomPass.radius = Number(value);
    // });

    //set OrbitControls
    // controls
    this._controls = new THREE.OrbitControls(this._camera, this._renderer.domElement);
    this._controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    this._controls.dampingFactor = 0.25;
    this._controls.screenSpacePanning = false;
    this._controls.minDistance = 100;
    this._controls.maxDistance = 5000;
    this._controls.maxPolarAngle = Math.PI / 2;

    this._controls.target.set(0, 5, 0);

    //init light

    let ambilLight = new THREE.AmbientLight(0xCCCCCC);
    this._scene.add(ambilLight);

    //init nodes object
    // 配置する範囲
    const SIZE = 1000;
    // 配置する個数
    const LENGTH = 100000;
    let geometry = new THREE.Geometry(); // TODO: BuffereGeometoryとの違いは？
    for (let i = 0; i < LENGTH; i++) {
      geometry.vertices.push(new THREE.Vector3(
        SIZE * (Math.random() - 0.5),
        SIZE * (Math.random() - 0.5),
        SIZE * (Math.random() - 0.5),
      ));
    }
    let material = new THREE.PointsMaterial({
      size:1,
      color: 0xAAAAAA,
    });

    this._nodes = new THREE.Points(geometry, material);

    this._scene.add(this._nodes);

    this.setResizeEvent();
    this.doUpdate();

    // Stats
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
  }
  private analyser: any;

  //
  private oldUpdateTime: number;
  public doUpdate(): void {
    if (this.stats) {
      this.stats.begin();
    }

    if (!this.oldUpdateTime) {
      this.oldUpdateTime = new Date().getTime();
    }
    let now = new Date().getTime();
    let delta = now - this.oldUpdateTime;
    this.oldUpdateTime = now;
    if (delta < 0) {
      throw new Error();
    }

    requestAnimationFrame(() => {
      this.doUpdate();
    });

    if (!this._scene) {
      return;
    }
    this.onUpdate(delta);

    let doUpdateSubRoutine = (obj: THREE.Object3D) => {
      if (obj['onUpdate'] instanceof Function) {
        obj['onUpdate'](delta);
      }

      for (let child of obj.children) {
        doUpdateSubRoutine(child);
      }
    };
    doUpdateSubRoutine(this._scene);

    this._composer.render();

    if (this.stats) {
      this.stats.end();
    }
  }

  public onUpdate(delta: number): void {
    this._controls.update();
    //this._scene.rotateY(delta / 1000 * 0.05 * Math.PI);
  }

  //
  private setResizeEvent(): void {
    let doResizeSubRoutine = (obj: THREE.Object3D, width: number, height: number) => {
      if (obj['onResized'] instanceof Function) {
        obj['onResized'](width, height);
      }

      for (let child of obj.children) {
        doResizeSubRoutine(child, width, height);
      }
    };

    $(window).on('resize', (e) => {
      let w = window.innerWidth;
      let h = window.innerHeight;

      this._renderer.setSize(w, h);
      this._composer.setSize(w, h);
      if (this._scene) {
        doResizeSubRoutine(this._scene, w, h);
      }
      if (this._camera) {
        if (this._camera['onResized'] instanceof Function) {
          this._camera['onResized'](w, h);
        }
      }
    });
  }
}