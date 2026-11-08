import React, { useRef, useState, useEffect } from 'react';
import {useThree,useFrame} from "@react-three/fiber"
import { useGLTF, useAnimations, Html} from '@react-three/drei';
import { gsap } from 'gsap';
import useCameraStore from '../store/cameraStore';
import usePlayerStore from  "../store/playerStore";
import useNpcInsideStore from  "../store/npcInsideStore";
import * as THREE from 'three';
import { RigidBody, CapsuleCollider, vec3 } from '@react-three/rapier';
import useAudioStore from '../store/audioStore';


const NPCInside = () => {
 
  const isFocused=useCameraStore(state=>state.isFocused);
  const setFocus=useCameraStore(state=>state.setFocus);
  const clearFocus=useCameraStore(state=>state.clearFocus);
  const beforeCamera=useCameraStore(state=>state.beforeCamera);
  const setBeforeCamera=useCameraStore(state=>state.setBeforeCamera);

  const npcPosition = useNpcInsideStore(state => state.npcPosition);
  const setNpcPositionIn = useNpcInsideStore(state => state.setNpcPositionIn);
  const setForOriginRot = useNpcInsideStore(state => state.setForOriginRot); 

  const playerPosition = usePlayerStore(state => state.playerPosition); // 플레이어 위치 추적
  const isCharacterVisible = usePlayerStore(state => state.isCharacterVisible);
  const setIsCharacterVisible = usePlayerStore(state => state.setIsCharacterVisible); //플레이어 가시성 설정

  const [showSphere,setShowSphere]=useState(true);

  const { scene, animations } = useGLTF("/models/npc_motion_compressed_.glb");
  const { actions } = useAnimations(animations, scene);
  const [currentAnimation, setCurrentAnimation] = useState("standing_55");

  // console.log("actions",actions); //에니메이션 종류 확인 

  const { playAudio, stopAudio, resumeAudio } = useAudioStore(); //소리 상태 관리

  const [showSpeechBubble, setShowSpeechBubble] = useState(false); // 말풍선 표시 상태

  const npcInRef = useRef();
  const npcInRigidBody = useRef();

  const sbRef = useRef();

  // const [beforeCamera, setBeforeCamera] = useState(null)
  const camera = useThree((state) => state.camera)

  //그림자
  useEffect(()=>{
    scene.traverse((obj)=>{
        if(obj.isMesh){
            obj.castShadow=true;
            obj.receiveShadow=true;
        }
    });
  },[scene]);

  // 에니메이션 바뀔 때 효과 
  useEffect(()=>{
    if (actions[currentAnimation]) {
      actions[currentAnimation].reset().fadeIn(0.2).play();
    }
    return()=>{
      if (actions[currentAnimation]) {
        actions[currentAnimation].fadeOut(0.2).stop();
      }
    }
  },[actions,currentAnimation]);

  //npc 대사

  const [showMessage,setShowMessage] = useState(false); // 말풍선 표시 후 조금있다가 메시지 표시 위함 
  const [showOptions, setShowOptions] = useState(false); // 초기 메시지 클릭을 관리하기 위한 상태 

  const [dialogState, setDialogState] = useState({
    message: "궁금한게 있으면 저에게 물어보세요",
    options: [
      { 
        text: "명함은 어떻게 만드나요 ??", 
        descriptions: [
          "모니터를 클릭해 보세요",
          "그럼 프로필 촬영부터 할 거에요", 
          "그 다음, 원하는 명함 색상, 패턴을 골라보세요",
          "개성있는 명함을 만들 수 있어요 ><",
        ], 
        currentIndex: 0
      },
      { 
        text: "명함을 다른 사람에게 공유할 수 있나요??", 
        descriptions: ["출력된 명함의 qr코드를 찍어보세요", "명함 저장과 공유가 가능해요 !!"], 
        currentIndex: 0
      },
      { 
        text: "김씨네 명함 사무소에 대해 더 알고싶어요", 
        descriptions: ["김명사는 대학생용 명함을 만들어주는 곳이에요", "김씨 3인이 만들어서 김명사랍니다 ~~"], 
        currentIndex: 0
      },
    ],
    currentOptionIndex: null // 현재 선택된 옵션 인덱스
  });

  // 사용자가 선택한 옵션 인덱스 설정
  const handleOptionSelect = (index) => {
    playAudio("sbNext", "sbNext");
    // 옵션을 선택할 때 해당 옵션의 첫 번째 설명부터 보여주기 위해 currentIndex를 0으로 설정
    setDialogState((prevDialog) => {
      console.log("option index",index);
      const updatedOptions = prevDialog.options.map((option, idx) =>
        idx === index ? { ...option, currentIndex: 0 } : option
      );

      // 옵션 선택 시 현재 옵션의 첫 번째 설명 바로 표시
      setShowOptions(false); // 옵션 리스트 숨기기
      setShowMessage(true); // 메시지 표시하기
      return {
        ...prevDialog,
        currentOptionIndex: index,
        options: updatedOptions,
      };
    });
  };

  useEffect(() => {
    // currentOptionIndex가 변경된 후에 실행되어야 하는 로직을 여기에 작성
    console.log("현재 선택된 옵션 인덱스:", dialogState.currentOptionIndex);
    console.log("current showOptions", showOptions);
    // console.log("npcInRigidBody",npcInRigidBody);
  }, [dialogState.currentOptionIndex,showOptions]);

  const handleNextDescription = () => {
    playAudio("sbNext", "sbNext");
    console.log("handleNextDescription")
    setDialogState((prevDialog) => {
      const { currentOptionIndex, options } = prevDialog;
      const currentOption = options[currentOptionIndex];
      const nextIndex = currentOption.currentIndex + 1;
      
      if (nextIndex < currentOption.descriptions.length) {
        console.log("Next description", currentOption.descriptions[nextIndex]);
        // 다음 설명이 있으면 currentIndex 업데이트
        return {
          ...prevDialog,
          options: options.map((option, idx) =>
            idx === currentOptionIndex ? { ...option, currentIndex: nextIndex } : option
          ),
        };
      } else {
        // 모든 설명을 보여줬다면, 옵션 선택 상태로 리셋
        return {
          ...prevDialog,
          currentOptionIndex: null,
        };
      }
    });
  };

  const handleBackClick=() => {
    playAudio("sbStart", "sbStart");
    console.log("inside NPC speech end")
    setShowSpeechBubble(false);
    setIsCharacterVisible(true);
    setCurrentAnimation((prev) => prev==="communication_77" ? "standing_55" : "communication_77")
    setForOriginRot(true);
    setShowSphere(true);
    setShowMessage(false); // 글자 출력 종료

    if (isFocused&&beforeCamera) {
      gsap.to(camera.position, {
        x: beforeCamera.position.x,
        y: beforeCamera.position.y,
        z: beforeCamera.position.z,
        duration: 0.8,
        ease: "power1.out",
        onUpdate: () => {
          camera.lookAt(playerPosition.x, playerPosition.y+4, playerPosition.z);
        },
        onComplete: () => {
          clearFocus(); // 카메라 포커스 해제
          setBeforeCamera(null, null);
        },
      });
    }
  }

  //볼 클릭하면 npc 대화시작
  const handleBallClick = () => {
    playAudio("sbStart", "sbStart");
    console.log("ball click");
    setShowSphere(false);
    setShowSpeechBubble(true);
    setCurrentAnimation((prev) => prev === "standing_55" ? "communication_77" : "standing_55");
    setIsCharacterVisible(false); // 플레이어를 숨김
    setShowOptions(false);
    
    // NPC의 위치를 THREE.Vector3 객체로 변환
    const npcPosVector = new THREE.Vector3(npcPosition.x, npcPosition.y, npcPosition.z);
    
    // Determine the forward vector of the NPC based on its rotation
    const forward = new THREE.Vector3(0, 0, -1); // Assuming the NPC's forward is along the negative z-axis
    forward.applyQuaternion(npcInRef.current.quaternion); // Use the NPC's current rotation

    // Calculate a point in front of the NPC where the camera should move to
    const distanceFromNPC = 9.5; // Distance from the NPC to the camera
    const targetPosition = npcPosVector.clone().add(forward.multiplyScalar(-distanceFromNPC)); // add 함수를 사용하기 전에 clone 메소드로 복제
    const targetLookAt = new THREE.Vector3(npcPosition.x, npcPosition.y+3 , npcPosition.z);

    if (!isFocused&&!beforeCamera.position) {
        // 현재 카메라 상태 저장
        setBeforeCamera(camera.position.clone(), null);
        setFocus({ x: targetPosition.x, y: targetPosition.y, z: targetPosition.z }); // 포커스 설정

        // Camera를 NPC가 바라보는 방향으로 부드럽게 이동시킵니다.
        gsap.to(camera.position, {
            x: targetPosition.x,
            y: targetPosition.y+5,
            z: targetPosition.z,
            duration: 0.5,
            ease: "power1.out",
            onUpdate: () => {
              camera.lookAt(targetLookAt);
          },
        });
    }
};

//말풍선 나오고 0.5초 후 메세지 시작
useEffect(()=>{
  setTimeout(()=>{
    if(showSpeechBubble) setShowMessage(true);
  },800);
},[showSpeechBubble]);

// useEffect(()=>{
//   console.log("isCharacterVisible changed in npcInside",isCharacterVisible);
// },[isCharacterVisible]);

useEffect(() => {
  if (npcInRigidBody.current) {
    const npcPos = vec3(npcInRigidBody.current.translation());
    setNpcPositionIn(npcPos.x, npcPos.y, npcPos.z);
  }
  else{
    console.log("npcInRigidBody.current 문제 생김",npcInRigidBody.current)
  }
}, [npcInRigidBody]);


  const [angle,setAngle]=useState(0);

  useFrame((state, delta) => {
      if (npcInRef.current &&npcInRigidBody.current&&!isFocused) {
        try {
          //npc가 플레이어 방향으로 회전
          // console.log(`npc position x ${npcPosition.x}  y ${npcPosition.y}  z ${npcPosition.z}`);

          // 플레이어 위치와 NPC 위치 사이의 차이 벡터를 계산
          const dx = playerPosition.x - npcPosition.x;
          const dz = playerPosition.z - npcPosition.z;
  
          // atan2 함수를 사용하여 플레이어 방향으로의 회전 각도를 계산
          const angle = Math.atan2(dx, dz);
          setAngle(angle);
  
          // NPC의 Y축 회전을 직접 설정
          npcInRef.current.rotation.y = angle;
          // //말풍선
          if (sbRef.current) {
            sbRef.current.rotation.y = angle;
          }

        } catch (err) {
          alert(err.name);
          alert(err.message);
          alert(err.stack);
          alert(err);
      }
    }
  })

  return (
    <>
        <RigidBody 
          type="kinematicPosition"
          name="NPC"
          colliders={false}
          ref={npcInRigidBody}
          position={[11, 6, -48]}
        >
          <CapsuleCollider 
            args={[1.5, 2]} 
          />
          <primitive 
            object={scene}
            ref={npcInRef}
            scale={2.6}
            position={[0, -3.4, 0]}
          />
        </RigidBody>
        {/* showSphere 상태가 true일 때 */}
        {showSphere && (
          <Html
          position={[npcPosition.x, npcPosition.y + 5.7, npcPosition.z]}
          transform 
          rotation={[0, angle, 0]}
          >
          <div 
            style={{
              position: 'relative',
              width: '100px',
              height: '85px',
              cursor: "url('/images/clicker.webp'), pointer" 
            }}
            onClick={handleBallClick} 
          >
            <img src="/images/sbIcon.webp" style={{ width: '100%', height: '100%' }} />
          </div>
           </Html>
        )}
        {/*말풍선*/}
        {showSpeechBubble && (
        <Html position={[npcPosition.x, npcPosition.y + 6.7, npcPosition.z]} rotation={[0,angle,0]} transform>
          <div 
            style={{
              position: 'relative',
              width: '500px', // 말풍선의 폭
              height: '250px', // 말풍선의 높이
            }}
            onClick={() => {
            playAudio("sbNext", "sbNext");
            // 옵션이 선택되지 않았으면 옵션 리스트를 보여주기 호출
            if (dialogState.currentOptionIndex === null) {
              setShowOptions(true);
            } else {
            // 옵션이 선택되었으면 다음 설명으로 넘어가기 호출
              handleNextDescription();
            }
          }}
         >
          <img src="/images/sb5.png" style={{ width: '100%', height: '100%' }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            textAlign: 'center',
            fontSize: '16px'
            }}
          >
            {showMessage && (
              <>
                <div className='npc-speech-bubble'>
                {/* 옵션 리스트 표시 조건 */}
                {showOptions && (
                  <div className='npc-options-btns-container'>
                  {dialogState.options.map((option, index) => (
                    <button className='npc-option-btn' key={index} onClick={() => handleOptionSelect(index)}>
                      {option.text}
                    </button>
                  ))}
                  </div>
                )}
                {/* 옵션을 선택하지 않았고, 옵션 리스트를 보여주는 상태가 아닐 때 초기 메시지 표시 */}
                {dialogState.currentOptionIndex === null && !showOptions && <div className="speech-bubble-text-inside">{dialogState.message}</div>}
                {/* 옵션 선택했고, 옵션 리스트를 표시하지 않을 때, 현재 옵션의 설명을 표시 */}
                {dialogState.currentOptionIndex !== null && !showOptions && (
                <div 
                  key={`${dialogState.currentOptionIndex}-${dialogState.options[dialogState.currentOptionIndex]?.currentIndex}`}
                  className="speech-bubble-text-inside"
                >
                  {dialogState.options[dialogState.currentOptionIndex]?.descriptions[dialogState.options[dialogState.currentOptionIndex]?.currentIndex]}
                </div>
                )}
                </div>
                <button className="npc-back-btn" onClick={handleBackClick}>❌</button>
              </>
            )}
          </div>
        </div>
        </Html>
        )}
    </>
  );
}

export default NPCInside;
