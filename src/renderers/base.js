import TextureBuffer from './textureBuffer';
import { NUM_LIGHTS } from '../scene.js';
import { vec3, vec4, mat4 } from 'gl-matrix';

export const MAX_LIGHTS_PER_CLUSTER = NUM_LIGHTS;

export default class BaseRenderer {
  constructor(xSlices, ySlices, zSlices) {
    // Create a texture to store cluster data. Each cluster stores the number of lights followed by the light indices
    this._clusterTexture = new TextureBuffer(xSlices * ySlices * zSlices, MAX_LIGHTS_PER_CLUSTER + 1);
    this._xSlices = xSlices;
    this._ySlices = ySlices;
    this._zSlices = zSlices;

    this._frustums = [];

  }

  updateClusters(camera, viewMatrix, scene) {
    // TODO: Update the cluster texture with the count and indices of the lights in each cluster
    // This will take some time. The math is nontrivial...

    for (let z = 0; z < this._zSlices; ++z) {
      for (let y = 0; y < this._ySlices; ++y) {
        for (let x = 0; x < this._xSlices; ++x) {
          let i = x + y * this._xSlices + z * this._xSlices * this._ySlices;
          // Reset the light count to 0 for every cluster
          this._clusterTexture.buffer[this._clusterTexture.bufferIndex(i, 0)] = 0;
        }
      }
    }

    let cellDepth = (camera.far - camera.near) / this._zSlices;

    for(let i = 0; i < NUM_LIGHTS; i++){

        let light = scene.lights[i];
        let posLightWorld = vec4.fromValues(light.position[0], light.position[1], light.position[2], 1.0);
        
        let radius = light.radius + 5;
        // if(posLightCam[2] + radius < camera.near || posLightCam[2] - radius > camera.far){
        //   continue;
        // }


        let posLightCam = vec4.create();
        vec4.transformMat4(posLightCam,posLightWorld, viewMatrix);
        posLightCam[2] = -posLightCam[2];

        let minXPos = posLightCam[0] - radius;
        let minYPos = posLightCam[1] - radius;
        let minZPos = posLightCam[2] - radius;

        let maxXPos = posLightCam[0] + radius;
        let maxYPos = posLightCam[1] + radius;
        let maxZPos = posLightCam[2] + radius;


        //projection matrix
        let m00 = 1.0 / (Math.tan(camera.fov / 2.0 * Math.PI / 180.0) * camera.aspect);
        let m11 = 1.0 / Math.tan(camera.fov / 2.0 * Math.PI / 180.0);

        //console.log("m00 is " +  m00);


        //console.log("m11 is " +  m11);
        //console.log(projectionMatrix);

        //console.log(camera.fov);
        //console.log(camera.aspect);

        let minXClip =  minXPos * m00;
        let maxXClip =  maxXPos * m00;

        let minYClip = minYPos * m11;
        let maxYClip = maxYPos * m11;

        let zMinIndex = Math.min(Math.max(Math.floor(minZPos / cellDepth), 0),this._zSlices -1);      
        let zMaxIndex = Math.max(Math.min(Math.ceil(maxZPos / cellDepth), this._zSlices -1),0);

        let xMinIndex = Math.min(Math.max(Math.floor((minXClip + 1.0) / 2.0 * this._xSlices), 0), this._xSlices-1 );
        let xMaxIndex = Math.max(Math.min(Math.ceil((maxXClip + 1.0) / 2.0 * this._xSlices), this._xSlices -1),0);

        let yMinIndex = Math.min(Math.max(Math.floor((minYClip + 1.0) / 2.0 * this._ySlices), 0), this._ySlices -1);
        let yMaxIndex = Math.max(Math.min(Math.ceil((maxYClip + 1.0) / 2.0 * this._ySlices), this._ySlices -1), 0);

      

         //console.log("Light " + i + " belongs x  from " + xMinIndex + " to "+ xMaxIndex);
         //console.log("Light " + i + " belongs y  from " + yMinIndex + " to "+ yMaxIndex);

        for (let z = zMinIndex; z <= zMaxIndex; ++z) {
          for (let y = yMinIndex; y <= yMaxIndex; ++y) {
            for (let x = xMinIndex; x <= xMaxIndex; ++x) {
              let index = x + y * this._xSlices + z * this._xSlices * this._ySlices;
              if (this._clusterTexture.buffer[this._clusterTexture.bufferIndex(index, 0)] < MAX_LIGHTS_PER_CLUSTER) {
                let numLights = this._clusterTexture.buffer[this._clusterTexture.bufferIndex(index, 0)];
                numLights++;
                this._clusterTexture.buffer[this._clusterTexture.bufferIndex(index, 0)] = numLights;
                this._clusterTexture.buffer[this._clusterTexture.bufferIndex(index, Math.floor(numLights / 4.0)) + numLights % 4.0] = i;
              }
            }
          }
        }

    }


    this._clusterTexture.update();




  

  
  }
}