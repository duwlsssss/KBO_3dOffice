import React, { useEffect, useRef, memo, useMemo, useState } from "react";
import { useLoader, useFrame, useThree, extend } from "@react-three/fiber";
import {
  useGLTF,
  Environment,
  Html,
  OrbitControls,
  useAnimations,
  useHelper,
  Sparkles,
} from "@react-three/drei";
import * as THREE from "three"; // THREE 모듈을 임포트
import { DirectionalLightHelper, SpotLightHelper } from "three";
import NPCIntro from "./NPCIntro";
import NPCInside from "./NPCInside";
import Player from "./PlayerFinal copy 5";
import FocusOnMonitor from "./FocusOnMonitor copy";
import PrintCard from "./PrintCard";
import { Water } from "three-stdlib";
import { RigidBody } from "@react-three/rapier";
import useLoginStore from "../store/logInStore";
import useOverlayStore from "../store/overlayStore";
import useNPCStore from "../store/npcIntroStore";
import useCameraStore from "../store/cameraStore";
import useAudioStore from "../store/audioStore";
import { EffectComposer, SelectiveBloom } from "@react-three/postprocessing";

const red = new THREE.MeshStandardMaterial({
  color: "red",
  transparent: true,
  opacity: 0,
});
const black = new THREE.MeshStandardMaterial({
  color: "black",
  transparent: true,
  opacity: 0,
});
const blue = new THREE.MeshStandardMaterial({
  color: "blue",
  transparent: true,
  opacity: 0,
});
const purple = new THREE.MeshStandardMaterial({
  color: "purple",
  transparent: true,
  opacity: 0,
});

const lightColor = new THREE.MeshStandardMaterial({
  emissive: "yellow",
  emissiveIntensity: 1,
});
const lightColor_ = new THREE.MeshStandardMaterial({
  color: "#FBE67E",
  emissive: "yellow",
  emissiveIntensity: 1,
  transparent: true,
  opacity: 1,
});

extend({ Water });

function Ocean() {
  const ref = useRef();
  const gl = useThree((state) => state.gl);
  const waterNormals = useLoader(
    THREE.TextureLoader,
    "/images/waternormals.jpeg"
  );
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  const geom = useMemo(() => new THREE.CircleGeometry(8, 20), []);
  const config = useMemo(
    () => ({
      textureWidth: 265,
      textureHeight: 265,
      waterNormals,
      sunDirection: new THREE.Vector3(),
      sunColor: "#ffffff",
      waterColor: "#2280cc",
      distortionScale: 5, //물결 왜곡값
      fog: false,
      format: gl.encoding,
    }),
    [waterNormals]
  );
  useFrame(
    (state, delta) => (ref.current.material.uniforms.time.value += delta)
  );
  return (
    <water
      ref={ref}
      args={[geom, config]}
      position={[0, 4.3, 7]}
      rotation-x={-Math.PI / 2}
    />
  );
}

// function Scene() {
//     const ref = useRef();

//     useEffect(() => {
//       if (ref.current) {
//         ref.current.layers.enable(1); // 레이어 1에 메쉬 할당
//       }
//     }, []);

//     const { nodes, materials } = useGLTF('/models/neon.glb')
//     console.log("materials",materials)
//     return (
//       <>
//         <mesh ref={ref} geometry={nodes.Text001.geometry} position={[-2.5, 4, 100]} rotation={[90 * Math.PI / 180,0,0]}>
//             <meshPhysicalMaterial map={materials['Material.014'].map} colot="pink"/>
//             <Sparkles position={[2, 0, 0]} count={10} scale={5} size={6} speed={0.4} />
//         </mesh>
//       </>
//     );
//   }

const Outside = memo(
  ({ visible }) => {
    const isInside = useOverlayStore((state) => state.isInside);
    const playAudio = useAudioStore((state) => state.playAudio);

    const { scene: cloud_scene } = useGLTF("/models/cloud_compressed.glb");
    const { scene: cloud_scene2 } = useGLTF("/models/cloud_compressed2.glb");
    const { scene: cloud_scene_ } = useGLTF("/models/cloud_compressed_.glb");
    const { scene: cloud_scene_2 } = useGLTF("/models/cloud_compressed_2.glb");
    const { scene: flower_scene } = useGLTF("models/neon.glb");

    const { scene: out_scene, animations: out_anim } = useGLTF(
      "/models/office_out_compressed.glb"
    );
    const { actions: out_actions } = useAnimations(out_anim, out_scene);
    // console.log("out actions",out_actions);

    //그림자 넣기
    useEffect(() => {
      out_scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }, [out_scene]);

    useEffect(() => {
      if (!isInside) {
        Object.entries(out_actions).forEach(([key, action]) => {
          if (key !== "door2_close") {
            action.reset().setLoop(THREE.LoopRepeat, Infinity).play();
          }
        });
      }
    }, [isInside]);

    const spotLightRef = useRef();
    useHelper(spotLightRef, SpotLightHelper, 5, "red");

    if (!visible) return null;

    return (
      <>
        <Ocean />
        {/* 외부 모델 */}
        <RigidBody
          type='fixed'
          colliders={false}
          // colliders="trimesh"
          position={[4, -5, -45]}
          rotation={[0, (90 * Math.PI) / 180, 0]}
        >
          <primitive object={out_scene} />
        </RigidBody>
        {/* 구름 */}
        <mesh
          position={[180, -55, -50]}
          rotation={[0, (90 * Math.PI) / 180, 0]}
        >
          <primitive object={cloud_scene} />
        </mesh>
        <mesh position={[60, -85, -70]} rotation={[0, (90 * Math.PI) / 180, 0]}>
          <primitive object={cloud_scene2} />
        </mesh>
        <mesh position={[180, -25, 20]} rotation={[0, (90 * Math.PI) / 180, 0]}>
          <primitive object={cloud_scene_} />
        </mesh>
        <mesh position={[80, -20, 20]} rotation={[0, (90 * Math.PI) / 180, 0]}>
          <primitive object={cloud_scene_2} />
        </mesh>
        {/* 전시 꽃 */}
        {/* <Scene />
            <EffectComposer>
                <SelectiveBloom
                    selectionLayer={1}  
                    luminanceThreshold={0} 
                    intensity={0.5}
                />
            </EffectComposer> */}
        {/* <mesh
                position={[0,4,100]}
            >
                <primitive
                    object={flower_scene}
                />
            </mesh> */}
        <RigidBody type='fixed' name='GoInDoor'>
          <mesh
            position={[-0.7, 10, -37.5]}
            // onClick={() => { console.log("GoInDoor clicked!"); setIsInside(true); }} //orbit 켰을떄
          >
            <boxGeometry args={[17.5, 15, 2]} />
            <primitive attach='material' object={red} />
          </mesh>
        </RigidBody>
        {/*이상한데 올라가는 거 방지*/}
        {/*왼쪽기둥*/}
        <RigidBody colliders='cuboid' type='fixed'>
          <mesh position={[-11.5, 7, -35.5]}>
            <boxGeometry args={[4.2, 15, 10]} />
            <primitive attach='material' object={black} />
          </mesh>
        </RigidBody>
        {/*오른쪽기둥*/}
        <RigidBody colliders='cuboid' type='fixed'>
          <mesh position={[10, 7, -35.5]}>
            <boxGeometry args={[4.2, 15, 10]} />
            <primitive attach='material' object={black} />
          </mesh>
        </RigidBody>
        {/*분수대*/}
        <RigidBody colliders='hull' type='fixed'>
          <mesh position={[0.4, 3, 6.3]}>
            <cylinderGeometry args={[12, 12, 10, 15]} />
            <primitive attach='material' object={black} />
          </mesh>
        </RigidBody>
        {/* 분수대 옆 벤치 */}
        <RigidBody colliders='cuboid' type='fixed'>
          <mesh position={[-9, 3, 31]}>
            <boxGeometry args={[5, 5, 12]} />
            <primitive attach='material' object={black} />
          </mesh>
        </RigidBody>
        {/* 가로등 조명 */}
        {/*검 왼*/}
        <mesh position={[-26.1, 16.5, -20.8]}>
          <cylinderGeometry args={[0.5, 0.5, 3.5, 8]} />
          <primitive attach='material' object={lightColor} />
        </mesh>
        {/* <pointLight 
                position={[-26.1, 16.5, -20.8]} 
                intensity={1000} 
                color={"yellow"} 
            /> */}
        {/*검 오*/}
        <mesh position={[26.1, 16.5, -20.8]}>
          <cylinderGeometry args={[0.5, 0.5, 3.5, 8]} />
          <primitive attach='material' object={lightColor} />
        </mesh>
        {/* <pointLight 
                position={[26.1, 16.5, 8]} 
                intensity={1000} 
                color={"yellow"} 
            /> */}
        {/*갈 4*/}
        <mesh position={[26.85, 13.2, 63.6]}>
          <cylinderGeometry args={[0.5, 0.5, 2, 8]} />
          <primitive attach='material' object={lightColor} />
        </mesh>
        {/* <pointLight 
                position={[26.85, 13.2, 63.6]} 
                intensity={200} 
                color={"yellow"} 
            /> */}
        {/*갈 1*/}
        <mesh position={[26.85, 12.8, 39]}>
          <cylinderGeometry args={[0.5, 0.5, 2, 8]} />
          <primitive attach='material' object={lightColor} />
        </mesh>
        {/* <pointLight 
                position={[26.85, 12.8, 39]} 
                intensity={200} 
                color={"yellow"} 
            /> */}
        {/*갈 2*/}
        <mesh position={[50.85, 12.8, 39]}>
          <cylinderGeometry args={[0.5, 0.5, 2, 8]} />
          <primitive attach='material' object={lightColor} />
        </mesh>
        {/* <pointLight 
                position={[50.85, 12.8, 39]} 
                intensity={200} 
                color={"yellow"} 
            /> */}
        {/*갈 3*/}
        <mesh position={[51.5, 12.8, 63.6]}>
          <cylinderGeometry args={[0.5, 0.5, 2, 8]} />
          <primitive attach='material' object={lightColor} />
        </mesh>
        {/* <pointLight 
                position={[51.5, 12.8, 63.6]} 
                intensity={200} 
                color={"yellow"} 
            /> */}
        {/* 건물 부분 collider */}
        {/* 뒷쪽 */}
        <RigidBody type='fixed' colliders='cuboid'>
          <mesh position={[-0.5, 0, -55]}>
            <boxGeometry args={[52, 25, 24]} />
            <primitive attach='material' object={blue} />
          </mesh>
        </RigidBody>
        {/* 왼 */}
        <RigidBody type='fixed' colliders='cuboid'>
          <mesh position={[-20, 0, -41]}>
            <boxGeometry args={[13, 15, 3]} />
            <primitive attach='material' object={blue} />
          </mesh>
        </RigidBody>
        {/* 오 */}
        <RigidBody type='fixed' colliders='cuboid'>
          <mesh position={[18.5, 0, -41]}>
            <boxGeometry args={[14, 15, 3]} />
            <primitive attach='material' object={blue} />
          </mesh>
        </RigidBody>
        {/* 건물 밖에서 보이는 안 부분 */}
        <mesh position={[-0.7, 10, -43]}>
          <boxGeometry args={[45, 30, 1]} />
          <primitive attach='material' object={lightColor_} />
        </mesh>
        <mesh position={[4, 9, -40]}>
          <boxGeometry args={[15, 30, 1]} />
          <primitive attach='material' object={lightColor_} />
        </mesh>
        <pointLight
          position={[17, 3, -55]}
          intensity={1000}
          color={"yellow"}
          decay={1.7}
        />
        <pointLight
          position={[-18, 3, -55]}
          intensity={1000}
          color={"yellow"}
          decay={1.7}
        />
      </>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.visible === nextProps.visible;
  }
);

const Inside = memo(
  ({ visible }) => {
    const spotLightRef = useRef();
    useHelper(spotLightRef, SpotLightHelper, 5, "red");
    const spotLightRef_ = useRef();
    useHelper(spotLightRef_, SpotLightHelper, 5, "red");

    const isInside = useOverlayStore((state) => state.isInside);
    const playAudio = useAudioStore((state) => state.playAudio);
    const userEmail = useLoginStore((state) => state.userEmail);
    const isPrint = useCameraStore((state) => state.isPrint);
    const setIsPrint = useCameraStore((state) => state.setIsPrint);
    //같은 스토어에서 가져오는 상태여도 개별 셀렉터를 사용하면 각 상태값이 독립적으로 변할떄 불필요한 리렌더링 막음

    const showMonitorPopup = useCameraStore((state) => state.showMonitorPopup);
    const setShowMonitorPopup = useCameraStore(
      (state) => state.setShowMonitorPopup
    );

    const { scene: in_scene, animations: in_amin } = useGLTF(
      "/models/office_final_compressed3_texture.glb"
    );
    // const { scene:in_scene, animations:in_amin } = useGLTF('/models/office_compressed.glb');

    const { actions: in_actions } = useAnimations(in_amin, in_scene);
    // console.log("in actions",in_actions);
    const hasPrintAnimationPlayed = useRef({ print_: false });
    // 애니메이션 재생
    useEffect(() => {
      if (isInside && isPrint && !hasPrintAnimationPlayed.current.print_) {
        // 애니메이션 재생
        playAudio("print", "print");
        const playAnimation = (actionName) => {
          const action = in_actions[actionName];
          if (action) {
            action
              .reset()
              .setLoop(THREE.LoopOnce)
              .play().clampWhenFinished = true;
            action.enabled = true;
            return new Promise((resolve) =>
              action._mixer.addEventListener("finished", () => resolve())
            );
          }
          return Promise.resolve(); //애니메이션 완료시 promise 반환
        };

        // 모든 애니메이션 재생이 완료될 때까지 기다림
        Promise.all([
          playAnimation("Cube.011Action"),
          playAnimation("Cube.046Action"),
          playAnimation("Cube.056Action"),
        ]).then(() => {
          // 모든 애니메이션이 끝났을 때
          hasPrintAnimationPlayed.current.print_ = true;
          setIsPrint(false); // 여기서 isPrint를 false로 설정
          playAudio("showCard", "showCard");
        });
      }
      return () => {
        hasPrintAnimationPlayed.current.print_ = false;
      };
    }, [isPrint, hasPrintAnimationPlayed]);

    useEffect(() => {
      console.log("showMonitorPopup", showMonitorPopup);
    }, [showMonitorPopup]);

    //그림자 넣기
    useEffect(() => {
      in_scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }, [in_scene]);

    const { handleMonitorClick } = FocusOnMonitor();

    useEffect(() => {
      if (isInside) {
        playAudio("inBgSound", "inBgSound"); //안 소리 출력
      }
    }, [isInside]);

    if (!visible) return null;

    return (
      <>
        <RigidBody type='fixed' name='GoOutDoor'>
          <mesh
            position={[-0.6, 7.1, -31]}
            // onClick={() => { console.log("GoOutDoor clicked!"); setIsInside(false);}} //orbit 켰을떄
          >
            <boxGeometry args={[8, 9, 1]} />
            <primitive attach='material' object={blue} />
          </mesh>
        </RigidBody>
        {/* <Text
                color="black"
                fontSize={1}
                letterSpacing={0.02}
                textAlign={'center'}
                anchorX="center"
                anchorY="middle"
                position={[-0.6, 11.5, -33]}
            >
                Go Outside
            </Text> */}
        {/* <TriangleMesh/> */}
        {/* 안에서 떨어지는거 방지 */}
        {/* 오 */}
        <RigidBody type='fixed' colliders='cuboid'>
          <mesh position={[18.45, 6, -33]}>
            <boxGeometry args={[30, 8, 1]} />
            <primitive attach='material' object={black} />
          </mesh>
        </RigidBody>
        {/* 왼 */}
        <RigidBody type='fixed' colliders='cuboid'>
          <mesh position={[-19.65, 6, -33]}>
            <boxGeometry args={[30, 8, 1]} />
            <primitive attach='material' object={black} />
          </mesh>
        </RigidBody>
        {/* 사무실 바닥 collider */}
        <RigidBody type='fixed' colliders='cuboid'>
          <mesh position={[0, 2.05, -80]}>
            <boxGeometry args={[70, 0.9, 150]} />
            <primitive attach='material' object={blue} />
          </mesh>
        </RigidBody>
        <RigidBody
          type='fixed'
          colliders={false}
          // colliders="trimesh"
          scale={[0.1, 0.08, 0.08]}
          rotation={[0, (-90 * Math.PI) / 180, 0]}
          position={[-10, 1.45, -58]}
        >
          <primitive object={in_scene} />
        </RigidBody>
        {/* <RigidBody 
                type="fixed"
                colliders={false}
                // colliders="trimesh"
                scale={[0.1,0.08,0.08]}
                rotation={[0, -90 * Math.PI / 180, 0]} 
                position={[0,1.45,-58]}
            >
                <primitive
                    object={sofa_scene} 
                /> 
            </RigidBody> */}
        {/* 왼쪽 벽 */}
        <RigidBody type='fixed' colliders='cuboid'>
          <mesh position={[-22, 6, -49]}>
            <boxGeometry args={[2, 15, 60]} />
            <primitive attach='material' object={black} />
          </mesh>
        </RigidBody>
        {/* 오른쪽 벽 */}
        <RigidBody type='fixed' colliders='cuboid'>
          <mesh position={[30, 6, -49]}>
            <boxGeometry args={[2, 15, 60]} />
            <primitive attach='material' object={black} />
          </mesh>
        </RigidBody>
        {/* 뒷 벽 */}
        <RigidBody type='fixed' colliders='cuboid'>
          <mesh position={[0, 10, -75]}>
            <boxGeometry args={[65, 15, 2]} />
            <primitive attach='material' object={black} />
          </mesh>
        </RigidBody>
        {/* 소파쪽 스탠드 */}
        {/* <spotLight
                // ref={spotLightRef_}
                position={[-26.5,15,-80]} 
                target-position={[-22,0,-75]}
                angle={30*Math.PI/180}
                penumbra={0.2}
                color={"gold"}
                intensity={1000}
            /> */}
        <pointLight
          position={[-26.5, 10, -80]}
          color={"gold"}
          intensity={1000}
        />
        {/* 메인 책상 스탠드 */}
        {/* <spotLight
                // ref={spotLightRef}
                position={[3.7,11.7,-64.7]} 
                target-position={[3.7,11.0,-64.5]}
                angle={29*Math.PI/180}
                penumbra={0.2}
                color={"gold"}
                intensity={200}
            /> */}
        <pointLight
          position={[3.7, 11.7, -64.7]}
          color={"gold"}
          intensity={800}
        />
        {showMonitorPopup && (
          <Html position={[4.5, 15.5, -64]} transform>
            <div
              onClick={handleMonitorClick}
              style={{
                position: "relative",
                width: "500px",
                height: "auto",
              }}
            >
              <img
                src='/images/monitorPopup.webp'
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </Html>
        )}
        <Html
          position={[0.14, 11.45, -61.4]}
          scale={0.13}
          transform
          occlude='blending'
        >
          <iframe
            src={`https://kimsoffice.netlify.app/MyMyungham?userEmail=${userEmail}`}
            allow='camera;'
            style={{
              width: "1160px",
              height: "860px",
              position: "relative",
              zIndex: 0,
            }}
          />
          <img
            src='/images/pixelScreen2.webp'
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "1170px",
              height: "880px",
              opacity: 0.05,
              zIndex: 1,
              pointerEvents: "none",
            }}
          />
        </Html>
        {/* 메인 책상 */}
        <RigidBody type='fixed' colliders='cuboid'>
          <mesh position={[-0.3, 6.1, -62]}>
            <boxGeometry args={[16.2, 5, 13]} />
            <primitive attach='material' object={black} />
          </mesh>
        </RigidBody>
        {/* 메인 의자 */}
        <RigidBody type='fixed' colliders='cuboid'>
          <mesh position={[2.5, 6, -51.3]}>
            <boxGeometry args={[6, 8, 6]} />
            <primitive attach='material' object={black} />
          </mesh>
        </RigidBody>
        {/* 오른쪽 탁자 */}
        <RigidBody type='fixed' colliders='cuboid'>
          <mesh position={[20, 6, -49]}>
            <boxGeometry args={[9, 8, 15]} />
            <primitive attach='material' object={black} />
          </mesh>
        </RigidBody>
        <mesh position={[0.2, 11, -63.3]} onClick={handleMonitorClick}>
          <boxGeometry args={[10, 10, 5]} />
          <primitive attach='material' object={purple} />
        </mesh>
        <PrintCard />
      </>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.visible === nextProps.visible;
  }
);

function Element3D() {
  const isInside = useOverlayStore((state) => state.isInside);
  const isIntroductionEnd = useNPCStore((state) => state.isIntroductionEnd);
  const setIsElement3DLoaded = useCameraStore(
    (state) => state.setIsElement3DLoaded
  );
  const setIsNpcVisible = useNPCStore((state) => state.setIsNpcVisible);
  const hasDisappeared = useNPCStore((state) => state.hasDisappeared);
  const animationRestart = useLoginStore((state) => state.animationRestart);

  useEffect(() => {
    console.log("Element3D가 화면에 렌더링되었습니다.");
    setIsElement3DLoaded(true);
    setIsNpcVisible(true);
  }, []);

  useEffect(() => {
    if (animationRestart) {
      console.log("Element3D를 화면에 다시 렌더링");
      setIsElement3DLoaded(true);
      setIsNpcVisible(true);
    }
  }, [animationRestart]);

  //조명 헬퍼
  const directionalLightRef = useRef();
  useHelper(directionalLightRef, DirectionalLightHelper, 5, "red");

  //움직임 설명 팝업 띄우기
  const [showMovePopup, setShowMovePopup] = useState(false);
  useEffect(() => {
    if (isIntroductionEnd) {
      setShowMovePopup(true);
      setTimeout(() => {
        setShowMovePopup(false);
      }, 5000);
    }
  }, [isIntroductionEnd]);

  return (
    <>
      {/* 밖안 둘다 로드 돼야함 */}
      {/* <OrbitControls/> */}
      <Environment
        files='/images/pink-sunrise.hdr'
        ground={{ height: -100, radius: 200, scale: 200 }}
      />
      <ambientLight intensity={1.5} color='#ffffff' />
      <directionalLight
        castShadow
        // ref={directionalLightRef}
        intensity={2}
        position={[100, 300, -40]}
        color={"#ffffff"}
        shadow-camera-left={200}
        shadow-camera-right={-120}
        shadow-camera-top={130}
        shadow-camera-bottom={-130}
        shadow-camera-near={1}
        shadow-camera-far={1000}
        shadow-mapSize-width={1500}
        shadow-mapSize-height={1500}
      />
      {/*colliders*/}
      {/* 외부 바닥 */}
      <RigidBody type='fixed' colliders='cuboid'>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[250, 1, 260]} />
          <primitive attach='material' object={black} />
        </mesh>
      </RigidBody>
      {/*계단 자연스럽게 오르게*/}
      <RigidBody type='fixed' colliders='cuboid'>
        <mesh
          position={[-0.7, -1.4, -29.5]}
          rotation={[(-50 * Math.PI) / 180, 0, 0]}
        >
          <boxGeometry args={[18, 10, 2]} />
          <primitive attach='material' object={blue} />
        </mesh>
      </RigidBody>
      {/* 들어갔다 나갔다 할때 추락 방지 */}
      <RigidBody type='fixed' colliders='cuboid'>
        <mesh position={[-0.8, 2.07, -40.5]}>
          <boxGeometry args={[25.5, 1, 14.3]} />
          <primitive attach='material' object={purple} />
        </mesh>
      </RigidBody>
      <Outside visible={!isInside} />
      <Inside visible={isInside} />
      <NPCIntro visible={!isInside} hasDisappeared={hasDisappeared} />
      {isInside && <NPCInside />}
      {isIntroductionEnd && <Player />}
      {showMovePopup && (
        <Html position={[16, 2, 92]} transform>
          <div
            style={{
              position: "relative",
              width: "800px",
              height: "auto",
            }}
          >
            <img
              src='/images/movePopup.webp'
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </Html>
      )}
    </>
  );
}

export default Element3D;
