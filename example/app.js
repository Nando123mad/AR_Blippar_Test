// ====== Imports ======

import OnirixSDK from "https://sdk.onirix.com/0.3.0/ox-sdk.esm.js";

// ====== Onirix SDK ======

let OX = new OnirixSDK("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjExMjU3LCJwcm9qZWN0SWQiOjI2Njk5LCJyb2xlIjozLCJpYXQiOjE2NTIzMDI1MDl9.wQxsRC-zFQ06Qw90uS5Lqd-AxsOEOQXzDncwpje8GbE");

var renderer, scene, camera, model;

AFRAME.registerComponent('onirix-sdk', {
    init: function() {

        renderer = this.el.renderer;
        scene = this.el.sceneEl;
        camera = document.getElementById('camera');
        
        let config = {
            mode: OnirixSDK.TrackingMode.Image,
            renderCanvas: this.el.canvas
        }
        
        OX.init(config).then( _ => {
        
            // Force resize to setup camera projection and renderer size
            onResize();
        
            // All loaded, so hide loading screen
            document.getElementById("loading-screen").style.display = 'none';
        
            OX.subscribe(OnirixSDK.Events.OnDetected, function (id) {
                console.log("Detected Image: " + id);
                // Diplay 3D model
                if (!model) {
                    model = document.createElement('a-entity');
                    model.setAttribute('gltf-model', '#Model');
                    scene.appendChild(model);
                } else {
                    model.setAttribute('visible', true);
                }
                
                // It is useful to synchronize scene background with the camera feed
                scene.object3D.background = new THREE.VideoTexture(OX.getCameraFeed());
            });
        
            OX.subscribe(OnirixSDK.Events.OnPose, function (pose) {
                updatePose(pose);
            });
        
            OX.subscribe(OnirixSDK.Events.OnLost, function (id) {
                console.log("Lost Image: " + id);
                // Hide 3D model
                model.setAttribute('visible', false);
                scene.object3D.background = null;
            });
        
            OX.subscribe(OnirixSDK.Events.OnResize, function () {
                onResize();
            });
        
        }).catch((error) => {

            console.error(error);
        
            // An error ocurred, chech error type and display it
            document.getElementById("loading-screen").style.display = 'none';
        
            switch (error.name) {
        
                case 'INTERNAL_ERROR':
                    document.getElementById("error-title").innerText = 'Internal Error';
                    document.getElementById("error-message").innerText = 'An unespecified error has occurred. Your device might not be compatible with this experience.';
                    break;
        
                case 'CAMERA_ERROR':
                    document.getElementById("error-title").innerText = 'Camera Error';
                    document.getElementById("error-message").innerText = 'Could not access to your device\'s camera. Please, ensure you have given required permissions from your browser settings.';
                    break;
        
                case 'SENSORS_ERROR':
                    document.getElementById("error-title").innerText = 'Sensors Error';
                    document.getElementById("error-message").innerText = 'Could not access to your device\'s motion sensors. Please, ensure you have given required permissions from your browser settings.';
                    break;
        
                case 'LICENSE_ERROR':
                    document.getElementById("error-title").innerText = 'License Error';
                    document.getElementById("error-message").innerText = 'This experience does not exist or has been unpublished.';
                    break;
        
            }
        
            document.getElementById("error-screen").style.display = 'flex';
        
        });
    }
});

AFRAME.scenes[0].setAttribute('onirix-sdk','');


function updatePose(pose) {
    // When a new pose is detected, update the 3D camera
    let modelViewMatrix = new THREE.Matrix4();
    modelViewMatrix = modelViewMatrix.fromArray(pose);
    camera.object3D.matrixAutoUpdate = false;
    camera.object3D.matrix = modelViewMatrix;
    camera.object3D.matrixWorldNeedsUpdate = true;
}

function onResize() {
    // When device orientation changes, it is required to update camera params.
    const width = renderer.domElement.width;
    const height = renderer.domElement.height;
    const cameraParams = OX.getCameraParameters();
    camera.object3DMap.camera.fov = cameraParams.fov;
    camera.object3DMap.camera.aspect = cameraParams.aspect;
    camera.object3DMap.camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}