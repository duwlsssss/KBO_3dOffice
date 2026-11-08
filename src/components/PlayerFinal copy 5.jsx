import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Text } from '@react-three/drei';
import * as THREE from 'three';
import usePlayerStore from "../store/playerStore"
import { RigidBody, CapsuleCollider, CuboidCollider, useRapier, vec3 } from '@react-three/rapier';
import { usePersonControls } from "../hooks/usePlayerControls";
import useCameraStore from '../store/cameraStore';
import useNpcInsideStore from '../store/npcInsideStore'
import useNPCStore from '../store/npcIntroStore'
import { gsap } from 'gsap';
import useOverlayStore from '../store/overlayStore';
import useAudioStore from '../store/audioStore';

let walkDirection = new THREE.Vector3();
let rotateAngle = new THREE.Vector3(0, 1, 0);
let rotateQurternion = new THREE.Quaternion();

const SPEED = 0.3;
// const SPEED = 3; //개발용

const vec = new THREE.Vector3()

const Player = () => {

    const setIsInside = useOverlayStore(state => state.setIsInside);
    const setIsOutside = useOverlayStore(state => state.setIsOutside);
    const isIntroductionEnd = useNPCStore(state=>state.isIntroductionEnd);

    const playAudio = useAudioStore(state=>state.playAudio);
    const stopAudio = useAudioStore(state=>state.stopAudio);
    
    const npcPosition = useNpcInsideStore(state=>state.npcPosition);

    const isFocused = useCameraStore(state=>state.isFocused);

    const playerPosition = usePlayerStore(state => state.playerPosition);
    const setPlayerPosition = usePlayerStore(state => state.setPlayerPosition);
    const isCharacterVisible = usePlayerStore(state => state.isCharacterVisible);

    const camera = useThree((state) => state.camera)

    const [isCameraAnimated, setIsCameraAnimated] = useState(false);//플레이어 시점 이동시 부드러운 카메라 전환을 위함

    const rapier = useRapier(null);
    const characterRef = useRef();
    const characterCollider = useRef(null);
    const characterController = useRef();
    const characterRigidBody = useRef(null);

    const lastDirection = useRef(0);
    const updateDirection = (forward, backward, left, right) => {
        var directionOffset = 0; //front
        if (forward) {
            if (left) {
                directionOffset = Math.PI / 4;
            } else if (right) {
                directionOffset = -Math.PI / 4;
            }
            else{
                directionOffset=0;
            }
        } else if (backward) {
            if (left) {
                directionOffset = Math.PI*3 / 4;
            } else if (right) {
                directionOffset = -Math.PI*3 / 4;
            }
            else {
                directionOffset = Math.PI; //s
            }
        } else if (right) {
            directionOffset = -Math.PI/2; //a
        }
        else if (left) {
            directionOffset = Math.PI / 2; //d
        }else {
            //if no key input
            return lastDirection.current;
        }
        // Update current direction to last direction
        lastDirection.current = directionOffset;
        return directionOffset;
    };

    const refState = useRef({
        grounded: false,
        jumping: false,
        velocity: vec3()
    });

    const currentAction = useRef(null);

    const { forward, backward, left, right, jump } = usePersonControls();


    const { scene, animations } = useGLTF("/models/user_final_compressed.glb");
    const { actions } = useAnimations(animations, scene);
    // console.log("actions", actions)


    useEffect(() => {
        const isLoaded = scene && actions && Object.keys(actions).length > 0;
        if (isLoaded) {
            actions.breathe_77.play();
        }
    }, [scene]);

    //shadow
    useEffect(() => {
        scene.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }, []);

    // useEffect(() => {
    //     console.log(`Forward: ${forward}, Backward: ${backward}, Left: ${left}, Right: ${right}`);
    //   }, [forward, backward, left, right]);


    const [isWalking, setIsWalking] = useState(false); // 움직임 상태


    useEffect(() => {
        const isMoving = forward || backward || left || right;
        const action = isMoving ? "walking_77" : "breathe_77";

        if (!currentAction.current || currentAction.current !== action) { //현재 액션과 다음 액션이 다르면 
            if (actions[action]) {
                if (currentAction.current) {
                    actions[currentAction.current].fadeOut(0.2);
                }
                currentAction.current = action;
                actions[action].reset().fadeIn(0.2).play();
            }
        }

        // 움직임 상태에 따른 소리 재생/중지
        if (isMoving && !isWalking) {
            playAudio("walk", "walk");
            setIsWalking(true);
        } else if (!isMoving && isWalking) {
            stopAudio("walk");
            setIsWalking(false);
        }
        
    }, [forward, backward, left, right, isWalking]);

    useEffect(() => {
        const { world } = rapier
        const c = world.createCharacterController(0.1)
        c.setUp({ x: 0.0, y: 1.0, z: 0.0 });
        c.enableAutostep(2, 0.005, true); //5보다 높은 장애물, 0.005보다 작은 너비의 장애물은 못 올라감
        c.setApplyImpulsesToDynamicBodies(true);
        c.enableSnapToGround(3);
        characterController.current = c;
    }, [rapier]);

    //컴포넌트 마운트 될때 카메라 이동 부드럽게 
    useEffect(() => {
        // isIntroductionEnd가 방금 false에서 true로 변경된 경우에만
        if (isIntroductionEnd){
            console.log("캐릭터 시점으로 이동");
            const playerPos = vec3(characterRigidBody.current.translation());
            // console.log(`x: ${playerPos.x} y: ${playerPos.y} z: ${playerPos.z}`);
            gsap.to(camera.position, {
                x: playerPos.x,
                y: playerPos.y+8,
                z: playerPos.z+10,
                duration: 1,
                ease:'power2.out',
                onUpdate: () => {
                    camera.lookAt(playerPos.x, playerPos.y+4, playerPos.z);
                },
                onComplete: () => {
                    setIsCameraAnimated(true);
                }
            });
        }
    }, [isIntroductionEnd]);

    // useEffect(()=>{
    //     console.log("isCameraAnimated state in Player",isCameraAnimated);
    // },[isCameraAnimated]);
    

    //visible 조정
    useEffect(() => {
        if (characterRef.current) {
            characterRef.current.visible = isCharacterVisible;
        }
    }, [isCharacterVisible]);

    useFrame((state, delta) => {
        if ( characterCollider.current && characterRigidBody.current && characterController.current&&!isFocused &&isCameraAnimated) {
            try {
                const position = vec3(characterRigidBody.current.translation());
                const movement = vec3();
                // console.log(`Current Position: x=${position.x}, y=${position.y}, z=${position.z}`);

                // Calculate rotation angle from state.camera direction
                let angleYCameraDirection = Math.atan2(
                    state.camera.position.x - position.x,
                    state.camera.position.z - position.z
                );

                // Calculate movement direction offset based on input
                let newDirectionOffset = updateDirection(forward, backward, left, right,jump);

                // Update the model's rotation angle
                rotateQurternion.setFromAxisAngle(
                    rotateAngle,
                    angleYCameraDirection + newDirectionOffset
                );
                scene.quaternion.rotateTowards(rotateQurternion, 0.2);

                //Calculate final direction
                state.camera.getWorldDirection(walkDirection);
                walkDirection.y = 0;
                walkDirection.normalize();
                walkDirection.applyAxisAngle(rotateAngle, newDirectionOffset);


                //move model & camera
                const { velocity } = refState.current;

                if (forward || backward || left || right) {
                    const moveX = walkDirection.x * SPEED ;
                    const moveZ = walkDirection.z * SPEED ;
                    // console.log("moveX",moveX);
                    // console.log("moveZ",moveZ);

                    vec.set(moveX, 0, moveZ);
                    movement.add(vec);
                }
   
                if (refState.current.grounded && jump) {
                    velocity.y = 1;
                }

                if (!refState.current.grounded) {
                    // Apply gravity
                    velocity.y -= (9.807)/100;
                }
                movement.add(velocity);

                // console.log("before",position.x,position.y,position.z)

                characterController.current.computeColliderMovement(characterCollider.current, movement);
                refState.current.grounded = characterController.current.computedGrounded();

                let correctedMovement = characterController.current.computedMovement();
                position.add(vec3(correctedMovement));

                characterRigidBody.current.setNextKinematicTranslation(position);

                // console.log("after",position.x,position.y,position.z)

                for (let i = 0; i < characterController.current.numComputedCollisions(); i++) {
                    let collision = characterController.current.computedCollision(i);
                    let collider = collision.collider; // 충돌한 콜라이더 객체
                    // colliderSet에서 충돌한 콜라이더의 정보를 얻음
                    let colliderInfo = collider.colliderSet.get(collider.handle);
                    // 충돌한 콜라이더의 _shape 정보
                    let shape = colliderInfo._shape;
                    // shape의 halfExtents 값을 확인하여 문 크기 검사
                    if (shape.type === 1 && // Box 타입인지 확인
                    shape.halfExtents.x === 8.75 && // halfExtents의 x값
                    shape.halfExtents.y === 7.5 && // halfExtents의 y값
                    shape.halfExtents.z === 1) {   // halfExtents의 z값
                    console.log("GoInDoor와 충돌 감지");
                    setIsInside(); 
                    stopAudio("outBgSound"); //밖 소리 멈춤
                    playAudio("doorOpen", "doorOpen"); 
                    }
                    else if (shape.type === 1 &&
                    shape.halfExtents.x === 4 && 
                    shape.halfExtents.y === 4.5 && 
                    shape.halfExtents.z === 0.5) {   
                    console.log("GoOutDoor와 충돌 감지");
                    setIsOutside();
                    stopAudio("inBgSound"); //안 소리 멈춤
                    playAudio("doorOpen", "doorOpen"); // 나가는 문과 충돌시 소리만 출력
                    playAudio("outBgSound", "outBgSound");
                    }
                }
                
                // 플레이어 위치에 따라 카메라 위치 업데이트
                camera.position.set(position.x, position.y + 8, position.z + 10);
                camera.lookAt(position.x, position.y + 4, position.z);
                camera.updateProjectionMatrix();

                //npc가 플레이어 방향으로 회전하게 위치 저장
                setPlayerPosition(position.x, position.y, position.z);
            } catch (err) {
                alert(err.name);
                alert(err.message);
                alert(err.stack);
                alert(err);
            }
        }
    })

    // //charater size
    // useEffect(() => {
    //     if (scene) {
    //         const box = new THREE.Box3().setFromObject(scene);
    //         const size = vec.set();
    //         box.getSize(size);
    //         console.lg("Model Height:", size.y,"Model width:", size.x);
    //     }
    // }, [scene]);


    return (
        <>
            <RigidBody
                name="Player"
                ref={characterRigidBody}
                type="kinematicPosition"
                colliders={false}
                rotation={[0,90*Math.PI/2,0]}
                enabledRotations={[false, false, false]}
                position={[0, 4, 105]} //시작위치
            >
                <CapsuleCollider
                    args={[1.5, 2]}
                    ref={characterCollider}
                />
                <primitive
                    object={scene}
                    ref={characterRef}
                    scale={2.6}
                    position={[0, -3.4, 0]} 
                />
            </RigidBody>
        </>
    );
};


export default Player;


