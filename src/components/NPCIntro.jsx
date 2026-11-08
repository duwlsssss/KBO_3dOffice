import React, { useRef, useState, useEffect, memo } from 'react';
import {useFrame} from "@react-three/fiber"
import { useGLTF, useAnimations, Html} from '@react-three/drei';
import usePlayerStore from  "../store/playerStore";
import useNPCStore from  "../store/npcIntroStore";
import * as THREE from 'three';
import { RigidBody, CapsuleCollider, vec3 } from '@react-three/rapier';
import useLoginStore from '../store/logInStore';
import useAudioStore from '../store/audioStore';

const NPCIntro = ({visible,hasDisappeared}) => {
 
  const [currentPointIndex, setCurrentPointIndex] = useState(0);//npc 사무실 안으로 들어가는 경로 
  const [currentRotationIndex, setCurrentRotationIndex] = useState(0);//npc 사무실 안으로 들어가는 경로 회전

  //npc 대사
  const introMessage = [
    "안녕하세요 !! 저는 김명사 안내원이에요",
    "김명사는 대학생을 위한 명함 사무소에요",
    "개성이 담긴 명함을 만들 수 있어요 ^^",
    "명함을 만드려면 로그인부터 해야해요",
    "아래 버튼을 클릭해 로그인해주세요",
    "전 바빠서 이만 사무실로 가야해요 ∙∙∙",
    "명함을 만들고싶으면 사무실로 오세요 !!!",
  ];

  const [message, setMessage] = useState(introMessage[0]);
  const [showMessage, setShowMessage] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isNpcVisible = useNPCStore(state => state.isNpcVisible);
  const setIsNpcVisible = useNPCStore(state => state.setIsNpcVisible);
  const isIntroductionEnd = useNPCStore(state => state.isIntroductionEnd);
  const setIsIntroductionEnd = useNPCStore(state => state.setIsIntroductionEnd);
  const setHasDisappeared = useNPCStore(state => state.setHasDisappeared);
  const setNpcPosition = useNPCStore(state => state.setNpcPosition);
  const setIsCharacterVisible=usePlayerStore(state =>state.setIsCharacterVisible);


  const { scene, animations } = useGLTF("/models/npc_motion_compressed.glb");
  const { actions } = useAnimations(animations, scene);
  const [currentAnimation, setCurrentAnimation] = useState("standing_55");

  // console.log("actions",actions); //에니메이션 종류 확인 

  const {showSpeechBubble, setShowSpeechBubble} = useNPCStore();

  //로그인 관련 
  const { isLoggedIn,userName } = useLoginStore();
  const { showLogin, setShowLogin } = useLoginStore(state => ({
    showLogin: state.showLogin,
    setShowLogin: state.setShowLogin
  }));
  const { justLoggedOut, resetJustLoggedOut } = useLoginStore();
  const { animationRestart, resetAnimationRestart } = useLoginStore();
  // const three=useThree();
  // console.log("three",three);//정보 출력

  const {playAudio} = useAudioStore(); //소리 상태 관리

  const npcRef = useRef();
  const npcRigidBody = useRef(null);


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


 
  useEffect(() => {
    if(!isLoggedIn) {
       // 로그아웃 상태에서 대화를 처음부터 시작해야 하는 경우
      if(animationRestart){
        console.log("대화 다시시작");
        setShowMessage(true);
        setCurrentIndex(0); // 대화 인덱스를 처음으로 설정
        setMessage(introMessage[0]); // 첫 번째 메시지로 설정
        setCurrentAnimation("standing_kk"); // NPC 애니메이션 초기화
        resetAnimationRestart(); // 애니메이션 재시작 후 상태 초기화
      }
      else if(!animationRestart && currentIndex === 4) {
        // 로그인하지 않았고, 애니메이션 재시작 상태가 아니며, 현재 대화 인덱스가 4인 경우
        setShowLogin(true); //로그인 버튼 표시
      }
      if(justLoggedOut && !animationRestart) {
        setCurrentIndex(4); // "로그인해줘" 메시지로 이동
        setMessage(introMessage[4]);
        resetJustLoggedOut();
      }
    }else{
      // 로그인 상태에서는 로그인 버튼을 숨김
      setShowLogin(false); 
    }

  }, [isLoggedIn, currentIndex, animationRestart, justLoggedOut]);

  const handleNextClick = () => {
    // console.log("next click!!");
    playAudio("sbNext","sbNext");
   
    let nextIndex = currentIndex + 1;

    // console.log(`Next Index: ${nextIndex}, Message: ${introMessage[nextIndex]}`);

    if (nextIndex >= introMessage.length) {
      nextIndex = 0; // 다시 처음으로 돌아갔을 때
    }

    // "아래 버튼을 클릭해 로그인해줘" 메시지인 경우
    if (currentIndex === 4) {
      if (!isLoggedIn) {
        // 로그인이 되어있지 않다면, 현재 메시지에서 머무르도록 하고, 다음으로 넘어가지 않음
        console.log("계속 진행하려면 로그인하셈");
        return; // 여기서 함수 실행을 멈추고, 다음 메시지로 넘어가지 않음
      }
      else if(isLoggedIn){
        nextIndex = currentIndex + 1; //로그인 상태이면 다음 메시지로
      }
    }

    if (nextIndex === 0) {
      console.log("Speech End");
      setIsIntroductionEnd(true);
    }

    setMessage(introMessage[nextIndex]);
    setCurrentIndex(nextIndex); // 다음 인덱스로 업데이트
    ;}

    
  //말풍선 나오고 0.5초 후 메세지 시작
  useEffect(()=>{
    if(showSpeechBubble){
    // console.log("showSpeechBubble 로드됨",showSpeechBubble);
    setCurrentAnimation("communication_77")//말하는 애니메이션으로 변경
    setTimeout(()=>{
    setShowMessage(true);
    },500);
  }
  },[showSpeechBubble]);


  useEffect(() => {
    if (isIntroductionEnd) {
      setCurrentAnimation((prev) => prev==="communication_77" ? "walking_55" : "communication_77")
      setIsCharacterVisible(true);
      setShowSpeechBubble(false);
    }
  },[isIntroductionEnd]);

  useEffect(() => {
    if (visible) {
      setCurrentPointIndex(0);
      setCurrentRotationIndex(0);
    }
  }, [visible]);

  const pathPoints = [
    { x: 0, y: 4, z: 30 },
    { x: 20, y: 4, z: 7 },
    { x: 0, y: 4, z: -14 },
    { x: 0, y: 4, z: -29 },
    { x: 0, y: 5.2, z: -29 },
    { x: 0, y: 5.2, z: -31.5 },
    { x: 0, y: 6.5, z: -31.5 },
    { x: 0, y: 6.5, z: -34 },
    { x: 0, y: 6.5, z: -34 },
    { x: 0, y: 6.5, z: -35 },
  ];
  const rotations = [
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)), // 앞을 바라봄(-z)
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 3*Math.PI / 4, 0)), // 오른쪽 대각선을 바라봄
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -3*Math.PI/4, 0)), // 왼쪽 대각선을 바라봄
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)), // 앞을 바라봄
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)), // 앞을 바라봄
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)), // 앞을 바라봄
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)), // 앞을 바라봄
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)), // 앞을 바라봄
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)), // 앞을 바라봄
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)), // 앞을 바라봄
  ];


  const vec = new THREE.Vector3()
  useFrame((state,delta) => {
    if (npcRef.current&&npcRigidBody.current) {
        try {
          // console.log("isNpcVisible",isNpcVisible);
          // console.log(`npcIntro 위치 ${currentPosition.x} ${currentPosition.y}, ${currentPosition.z}`);
          if(isIntroductionEnd){ 
            const currentPosition = vec3(npcRigidBody.current.translation());
            setNpcPosition(currentPosition.x, currentPosition.y, currentPosition.z);
            const targetPosition = pathPoints[currentPointIndex];
            const targetRotation = rotations[currentRotationIndex];
            const direction = vec.set(
              targetPosition.x - currentPosition.x,
              targetPosition.y - currentPosition.y,
              targetPosition.z - currentPosition.z
            ).normalize();

            const speed=20
            const moveDistance = speed * delta; // 프레임당 이동 거리

            const moveX = currentPosition.x + direction.x * moveDistance;
            const moveY = currentPosition.y + direction.y * moveDistance;
            const moveZ = currentPosition.z + direction.z * moveDistance;

            npcRigidBody.current.setNextKinematicRotation(targetRotation, true);
            npcRigidBody.current.setNextKinematicTranslation(vec.set(moveX, moveY, moveZ),true);

            // 목표 위치에 충분히 가까워졌는지 확인
            if (Math.hypot(moveX - targetPosition.x, moveZ - targetPosition.z) < 1) {
              const nextIndex = (currentPointIndex + 1) % pathPoints.length;

              if (nextIndex === 0) { //마지막 위치임
                console.log("npc가 문 엶")
                playAudio("doorOpen", "doorOpen"); 
                setIsNpcVisible(false);
                setHasDisappeared(true);
              }
              setCurrentPointIndex(nextIndex);
              setCurrentRotationIndex(nextIndex);
          }
        } 
        } catch (err) {
          alert(err.name);
          alert(err.message);
          alert(err.stack);
          alert(err);
      }
    }
  })

  if (!visible||hasDisappeared) return null; // visible이 false거나 hasDisappeared이 true면 렌더링하지 않음

  return (
    <>
        {isNpcVisible&&(
          <RigidBody 
            type="kinematicPosition"
            name="NPC"
            colliders={false}
            ref={npcRigidBody}
            position={[0, 4, 100]}
            // rotation={[0,Math.PI,0]}
            // position={[0, 6.5, -34]}
          >
            <CapsuleCollider 
              args={[1.5, 1]} 
            />
            <primitive 
              object={scene}
              ref={npcRef}
              scale={2.6}
              position={[0, -3.4, 0]}
            />
          </RigidBody>
        )}
        {/*말풍선*/}
        {showSpeechBubble && (
          <>
            <Html position={[0, 16.5, 85]} transform>
              <img src="/images/sb5.png" style={{ width: '100%', height: '100%' }} onClick={handleNextClick}/>
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
              <div className='speech-bubble'>
                {showMessage&&(<div key={message} className="speech-bubble-text">
                  {(currentIndex === 4&&isLoggedIn) ? (
                      <div className="userNameTyping">
                      반가워요 <span style={{ color: '#00bca9' }}>{userName}</span> 님 *^^*
                      </div>
                    ): message }
                </div>)}
              </div>
            </div>
            </Html>
          </>
        )}
    </>
  );
}


export default NPCIntro; 
