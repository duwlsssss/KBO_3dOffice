import {Canvas,useLoader, useThree} from '@react-three/fiber'
import React, { Suspense, useMemo, useState, lazy, useEffect } from 'react'
import { Physics } from '@react-three/rapier'
import { useGLTF, useTexture, Stats, Html,Preload,useProgress,Loader} from '@react-three/drei'
import * as THREE from 'three';
import "./App.css"
import Element3D from "./components/Element3D"
import { PerspectiveCamera } from '@react-three/drei/core/PerspectiveCamera';
import useCameraStore from "./store/cameraStore"
import { useControls,Leva } from 'leva';
import Overlay from './components/Overlay'
import useOverlayStore from './store/overlayStore';
import useNPCStore from './store/npcIntroStore';
import useLoginStore from './store/logInStore';
import useAudioStore from './store/audioStore';
import { gsap } from 'gsap';

// Draco 디코더를 CDN(gstatic) 대신 로컬에서 불러온다 - 오프라인 전시 환경에서도 압축 모델을 열 수 있도록
useGLTF.setDecoderPath('/draco/');


function SetCameraPosition() {
  const { camera } = useThree();
  const { start } = useOverlayStore((state) => ({ start: state.start }));
  const { setIsNpcVisible, setShowSpeechBubble } = useNPCStore();
  const { playAudio } = useAudioStore();
  const { animationRestart, resetAnimationRestart } = useLoginStore();

  useEffect(() => {
    if (start) {
      console.log("카메라 에니메이션 시작");
      playAudio("outBgSound", "outBgSound");
      gsap.to(camera.position, {
        x: 0,
        y: 7.3,
        z: 110,
        ease: "power1.out",
        duration: 2,
        onComplete: () => {
          camera.lookAt(0, 7.3, 105);
          setShowSpeechBubble(true);
        }
      });
    }
  }, [start,playAudio,setShowSpeechBubble]);
  
  useEffect(() => {
    if (animationRestart) {
      console.log("카메라 에니메이션 재시작");
      gsap.to(camera.position, {
        x: 0,
        y: 40,
        z: 100,
        ease: "power1.out",
        duration: 0.3,
        onUpdate:()=>{ camera.lookAt(0, 40, 0)},
        onComplete:()=>{}
      });
    }
  }, [playAudio,setShowSpeechBubble,animationRestart,resetAnimationRestart]);

  return null;
}

//초기 카메라 설정
function CameraOrientation() {
  const { camera } = useThree(); 

  useEffect(() => {
    camera.lookAt(0, 40, 0);
    camera.updateProjectionMatrix(); 
  }, [camera]);

  return null;
}

function App() {
 
  // const { axesHelperEnabled, statsEnabled, physicsDebugEnabled, PerfEnabled } = useControls({
  //   axesHelperEnabled: true,
  //   statsEnabled: false,
  //   physicsDebugEnabled: true,
  //   // PerfEnabled: false,
  // });

  const { start } = useOverlayStore((state) => ({ start: state.start }));

  useGLTF.preload('/models/office_final_compressed3_texture.glb');
  useGLTF.preload("/models/office_out_compressed.glb");
  useGLTF.preload("/models/npc_motion_compressed.glb");
  useGLTF.preload("/models/npc_motion_compressed_.glb");
  useGLTF.preload("/models/cloud_compressed.glb");
  useGLTF.preload("/models/cloud_compressed2.glb");
  useGLTF.preload("/models/cloud_compressed_.glb");
  useGLTF.preload("/models/cloud_compressed_2.glb");
  useGLTF.preload("/models/user_final_compressed.glb");

  return (
    <>
      <Canvas style={{ zIndex: 0 }} shadows camera={{ position:[0,40,110], fov: 75, near: 0.1, far: 1000 }}>
        <Suspense fallback={null}>
          {/*<Physics debug={physicsDebugEnabled} timeStep={"vary"}> */}
          <Physics timeStep={"vary"}> 
            {/*{axesHelperEnabled && <axesHelper args={[500, 500, 500]} />}*/}
             {/*{statsEnabled && <Stats />}*/}
            {/* {PerfEnabled && <Perf position="top" />} */}
            <CameraOrientation/> 
            <Element3D />
            <SetCameraPosition/>
          </Physics>
          {/* <Preload all /> */}
        </Suspense>
      </Canvas>
      <Overlay/>
    </>
  );
}


export default App;
