import { useEffect, useRef, useState } from "react";
import * as BABYLON from "@babylonjs/core";
import ResetButton from "./Helpers";
import { getSameVertexIndices } from "./Helpers";
import cats from '../src/cats.png'

const App = () => {
  // Ref to hold the canvas element
  const meshRef = useRef(null);

  // State for tracking whether dragging is in progress and the selected face
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFace, setSelectedFace] = useState(null);

  const [reset, setReset] = useState(false);

  // Refs for storing the current values of isDragging and selectedFace
  const isDraggingRef = useRef();
  const selectedFaceRef = useRef();

  // Update the refs with the current state values
  isDraggingRef.current = isDragging;
  selectedFaceRef.current = selectedFace;

  // Effect hook to initialize BabylonJS scene
  useEffect(() => {
    const canvas = meshRef.current;
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);

    // Create a box mesh
    let box = new BABYLON.MeshBuilder.CreateBox('myBox', {
      size: 1.2,
      updatable: true,
      faceUV: [
        new BABYLON.Vector4(0, 0, 1/6, 1),
        new BABYLON.Vector4(2/6, 0, 3/6, 1),
        new BABYLON.Vector4(1/6, 0, 2/6, 1),
        new BABYLON.Vector4(3/6, 0, 4/6, 1),
        new BABYLON.Vector4(4/6, 0, 5/6, 1),
        new BABYLON.Vector4(5/6, 0, 1, 1)
      ],
      wrap: true
    });

    const boxCatMat = new BABYLON.StandardMaterial();
    boxCatMat.emissiveTexture = new BABYLON.Texture(cats);
    box.material = boxCatMat;

    // Get the positions and indices of the box vertices
    let positions = box.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const indices = box.getIndices();
    const sharedIndices = getSameVertexIndices(indices, positions);

    // Create an ArcRotateCamera
    const camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 0, new BABYLON.Vector3(0, 0, 0), scene);
    camera.setPosition(new BABYLON.Vector3(0, 0, 5));
    camera.attachControl(canvas, true);

    // Add event listener for window resize to adjust the canvas size
    window.addEventListener("resize", function () {
      engine.resize();
    });

    // Render loop to continuously render the scene
    engine.runRenderLoop(() => {
      scene.render();
    });

    let clickCounter = 0;

    // Event listener for pointer down on the scene
    scene.onPointerDown = () => {
      const hit = scene.pick(scene.pointerX, scene.pointerY);
      if (clickCounter === 0 && hit.pickedMesh) {
        clickCounter++;
        if (hit.pickedMesh) {
          setIsDragging(true);
          const selectedFace = hit.faceId / 2;
          const facet = 2 * Math.floor(selectedFace);
          const normal = hit.getNormal();

          // Store the selected face information in the state
          setSelectedFace({selectedFace, facet, normal, position: {
              x: scene.pointerX,
              y: scene.pointerY,
            },
          });
        }
      } else if (clickCounter === 1) {
        // Second click indicates the end of dragging
        clickCounter = 0;
        camera.attachControl(canvas, true);
        setIsDragging(false);
        setSelectedFace(null);
      }
    };

    // Helper function to unproject screen coordinates to world coordinates
    const unproject = ({ x, y }) =>
      BABYLON.Vector3.Unproject(
        new BABYLON.Vector3(x, y, 0),
        engine.getRenderWidth(),
        engine.getRenderHeight(),
        BABYLON.Matrix.Identity(),
        scene.getViewMatrix(),
        scene.getProjectionMatrix()
      );

    // Event listener for pointer move on the scene
    scene.onPointerMove = () => {
      if (isDraggingRef.current && selectedFaceRef.current) {
        // Disable camera control during dragging
        camera.detachControl();
        const { facet, normal, position } = selectedFaceRef.current;
        const offset = unproject({
          x: scene.pointerX,
          y: scene.pointerY,
        }).subtract(unproject(position));

        // Get the vertices affected by the dragging
        const vertices = Array.from(new Set(indices.slice(3 * facet, 3 * facet + 6).reduce((acc, cur) => {
              acc.push(cur);
              acc.push(...sharedIndices[cur]);
              return acc;
            }, []))
        );

        // Update the positions of the affected vertices
        vertices.forEach((vertex) => {
          for (let j = 0; j < 3; j++) {
            positions[3 * vertex + j] += 5 * BABYLON.Vector3.Dot(offset, normal) * normal.asArray()[j];
          }
        });

        // Update the box mesh with the new positions
        box.setVerticesData(BABYLON.VertexBuffer.PositionKind, positions, true);

        // Update the selectedFace state with the new position
        setSelectedFace({...selectedFaceRef.current, position: {
            x: scene.pointerX,
            y: scene.pointerY
          }
        });
      }
    };

    // Clean up BabylonJS scene and engine on unmount
    return () => {
      scene.dispose();
      engine.dispose();
    };
  }, [reset]);

  return (
    <>
      <canvas ref={meshRef} style={{ width: "100vw", height: "100vh" }} />
      <ResetButton onClick={() => setReset(!reset)} />
    </>
  );
};

export default App;
