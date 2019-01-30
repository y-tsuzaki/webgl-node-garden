class WebGLNodeGarden {
    constructor(canvas) {
        this.NODES_MAX = 512;
        this._canvas = canvas;
    }
    get renderer() {
        return this._renderer;
    }
    init() {
        let width = window.innerWidth;
        let height = window.innerHeight;
        this._renderer = new THREE.WebGLRenderer({ antialias: true, canvas: this._canvas });
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
        let fov = 60;
        let near = 1;
        let far = 100000;
        let aspect = window.innerWidth / window.innerHeight;
        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(0, 20, 40);
        this._camera['onResized'] = (w, h) => {
            let aspect = w / h;
            this._camera.aspect = aspect;
            this._camera.updateProjectionMatrix();
        };
        this._scene = new THREE.Scene();
        var renderPass = new THREE.RenderPass(this._scene, this._camera);
        this._composer.setSize(window.innerWidth, window.innerHeight);
        this._composer.addPass(renderPass);
        this._composer.addPass(bloomPass);
        this._controls = new THREE.OrbitControls(this._camera, this._renderer.domElement);
        this._controls.enableDamping = true;
        this._controls.dampingFactor = 0.25;
        this._controls.screenSpacePanning = false;
        this._controls.minDistance = 100;
        this._controls.maxDistance = 5000;
        this._controls.maxPolarAngle = Math.PI / 2;
        this._controls.target.set(0, 5, 0);
        let ambilLight = new THREE.AmbientLight(0xCCCCCC);
        this._scene.add(ambilLight);
        const SIZE = 1000;
        const LENGTH = 100000;
        let geometry = new THREE.Geometry();
        for (let i = 0; i < LENGTH; i++) {
            geometry.vertices.push(new THREE.Vector3(SIZE * (Math.random() - 0.5), SIZE * (Math.random() - 0.5), SIZE * (Math.random() - 0.5)));
        }
        let material = new THREE.PointsMaterial({
            size: 1,
            color: 0xAAAAAA,
        });
        this._nodes = new THREE.Points(geometry, material);
        this._scene.add(this._nodes);
        this.setResizeEvent();
        this.doUpdate();
        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);
    }
    doUpdate() {
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
        let doUpdateSubRoutine = (obj) => {
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
    onUpdate(delta) {
        this._controls.update();
    }
    setResizeEvent() {
        let doResizeSubRoutine = (obj, width, height) => {
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
$(window).on('load', () => {
    let nodegarden = new WebGLNodeGarden($('#canvas')[0]);
    nodegarden.init();
});
