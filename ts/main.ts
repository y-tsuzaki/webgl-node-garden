$(window).on('load', () => {
    let nodegarden = new WebGLNodeGarden(<HTMLCanvasElement>$('#canvas')[0]);
    nodegarden.init();
});
