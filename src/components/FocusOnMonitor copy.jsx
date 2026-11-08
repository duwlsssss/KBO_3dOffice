import { useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import { Vector3, Quaternion, Matrix4 } from 'three';
import useCameraStore from '../store/cameraStore';
import usePlayerStore from "../store/playerStore";
import useLoginStore from '../store/logInStore';
import useAudioStore from '../store/audioStore';


const FocusOnMonitor = () => {
  const setIsCharacterVisible = usePlayerStore(state => state.setIsCharacterVisible); //플레이어 가시성 설정
  const isFocused=useCameraStore(state=>state.isFocused);
  const setFocus=useCameraStore(state=>state.setFocus);
  const clearFocus=useCameraStore(state=>state.clearFocus);
  const beforeCamera=useCameraStore(state=>state.beforeCamera);
  const setBeforeCamera=useCameraStore(state=>state.setBeforeCamera);
  const setShowBtns=useLoginStore(state=>state.setShowBtns);
  const playAudio = useAudioStore(state=>state.playAudio);
  const stopAudio = useAudioStore(state=>state.stopAudio);
  const showMonitorPopup = useCameraStore(state=>state.showMonitorPopup);
  const setShowMonitorPopup = useCameraStore(state=>state.setShowMonitorPopup);

  const camera = useThree((state) => state.camera);
 

  // 카메라를 원하는 위치와 방향으로 부드럽게 이동시키는 함수
  const handleMonitorClick = () => {
    playAudio("monitorClick", "monitorClick");
    console.log("monitor click")
    // 목표 위치와 시점을 설정
    const targetPosition = new Vector3(0.23, 11.45, -59.5);
    const targetLookAt = new Vector3(0.23, 11.45, -60);

    // 포커스가 맞춰지지 않은 상태라면, 목표 위치로 카메라 이동
    if(!isFocused){
      if (!beforeCamera.position || !beforeCamera.rotation) {
        // 현재 카메라 상태 저장
        console.log("set Before camera")
        setBeforeCamera(camera.position.clone(), camera.quaternion.clone());

        setIsCharacterVisible(false);
        setShowBtns(false);
        setShowMonitorPopup(false);
        stopAudio("walk");
        setFocus(targetPosition); // 포커스 설정
    
        const targetQuaternion = new Quaternion().setFromRotationMatrix(
          new Matrix4().lookAt(targetPosition, targetLookAt, camera.up)
        );

        // gsap을 사용하여 카메라 위치와 Quaternion을 목표 값으로 애니메이션
        gsap.to(camera.position, {
          x: targetPosition.x,
          y: targetPosition.y,
          z: targetPosition.z,
          duration: 1,
          ease: "power3.out",
        });
        gsap.to(camera.quaternion, {
          x: targetQuaternion.x,
          y: targetQuaternion.y,
          z: targetQuaternion.z,
          w: targetQuaternion.w,
          duration: 1,
          ease: "power3.out",
          onComplete:()=>{
          }
        });
      } 
    } // 이미 포커스가 맞춰진 상태라면, 포커스를 해제하고 원래 카메라 위치로 돌아가기
    else if (isFocused) {
      console.log("Before camera가 있고, isFocused true임")
      setIsCharacterVisible(true);
      gsap.to(camera.position, {
        x: beforeCamera.position.x,
        y: beforeCamera.position.y,
        z: beforeCamera.position.z,
        duration: 1,
        ease: "power3.out",
      });
      gsap.to(camera.quaternion, {
        x: beforeCamera.rotation.x,
        y: beforeCamera.rotation.y,
        z: beforeCamera.rotation.z,
        w: beforeCamera.rotation.w,
        duration: 1,
        ease: "power3.out",
        onComplete: () => {
          setShowBtns(true);
          clearFocus();
          setBeforeCamera(null, null);
          setShowMonitorPopup(true);
        },
      });
    }
  };

  return { handleMonitorClick };
};

export default FocusOnMonitor;
