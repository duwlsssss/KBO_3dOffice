import React,{useEffect,useState, useMemo, useCallback } from "react"
import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Vector3, Quaternion, Matrix4 } from 'three';
import { gsap } from 'gsap';
import useCameraStore from '../store/cameraStore';
import usePlayerStore from "../store/playerStore";
import useLoginStore from "../store/logInStore";
import useAudioStore from '../store/audioStore';

import api from '../api/axios'
import QRCode from 'qrcode.react';

const PrintCard = () => {

    const isFocused=useCameraStore(state=>state.isFocused);
    const clearFocus=useCameraStore(state=>state.clearFocus);
    const beforeCamera=useCameraStore(state=>state.beforeCamera);
    const setBeforeCamera=useCameraStore(state=>state.setBeforeCamera);
    const isPrint=useCameraStore(state=>state.isPrint);
    const setIsPrint=useCameraStore(state=>state.setIsPrint);
    const setIsCharacterVisible = usePlayerStore(state => state.setIsCharacterVisible); //플레이어 가시성 설정
    const playerPosition = usePlayerStore(state => state.playerPosition);
    const userEmail =useLoginStore(state=>state.userEmail);
    const userName = useLoginStore(state=>state.userName);
    const setShowBtns=useLoginStore(state=>state.setShowBtns);
    
    const playAudio = useAudioStore(state=>state.playAudio); //소리 상태 관리

    const camera = useThree((state) => state.camera);

    const [receivedData, setReceivedData] = useState(null);

    const [cardImage, setCardImage] = useState('/images/kimLogo_padded_w.webp');//이미지 저장
    const [showQR,setShowQR]=useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    // 기본 카드 스타일을 상수로 선언
    const baseCardStyles = {
      back: {
        position: 'relative',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      },
      front: {
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      },
    };
    const [infoItemStyle, setInfoItemStyle] = useState({
      position: 'absolute',
      fontSize:'1.3rem',
    });
    const [mbtiUrl,setMbtiUrl]=useState('');
    const [patternUrl,setPatternUrl]=useState('');
    const [frameUrl,setFrameUrl]=useState('');

    //서버에서 이미지 가져오기 
    const fetchImages = async () => {
      try {
        const response = await api.get('/images', {
          params: {
            tags: userEmail
          }
          });
        if (response.data && response.data.length > 0) {
          //http://localhost:8000/images/?tags=rladuwls0814@gmail.com
          // 이미지 데이터 배열 중 처음 이미지의 URL을 사용 (오름차순 정렬시)
          // const lastImageIndex = response.data.length - 1;
          // setCardImage(response.data[lastImageIndex].url);
          // 이미지 데이터 배열 중 처음 이미지의 URL을 사용 (내림차순 정렬됨)
          setCardImage(response.data[0].url);
        }
        else {
          // 데이터가 비어있을 경우 기본 이미지 설정
          setCardImage('/images/kimLogo_padded_.webp');
        }
      } catch (error) {
        console.error('Error fetching images:', error);
        setCardImage('/images/kimLogo_padded_.webp'); // 에러 발생 시 기본 이미지
    }};
    
    // 자식 창에서 보낸 데이터 수신
    useEffect(() => {
      const receiveMessage = (event) => {
        // React DevTools 메시지 무시
        if (event.data.source === 'react-devtools-bridge' 
        || event.data.source === 'react-devtools-content-script'
        || event.data.source ==='react-devtools-backend-manager'
        ) {
          return;
        }
        // event.data에 전달된 데이터가 있음
        console.log('받은 데이터:', event.data);
        setReceivedData(event.data);
        fetchImages();
      };

      window.addEventListener('message', receiveMessage);

      return () => {
        window.removeEventListener('message', receiveMessage);
      };
    }, []);
  
    //인쇄 누르고 카메라 설정
    useEffect(() => {
      if (receivedData) {
        //카드 설정
        const card=receivedData.data;
        setInfoItemStyle(prev => ({
          ...prev,
          fontFamily: getFontFamily(card.fontOption),
        }));

        setPatternUrl(card.patternOption ? `/images/pattern/${card.patternOption}.webp` : '');
        setFrameUrl(card.frameOption ? `/images/frame/${card.frameOption}.webp` : '');
        setMbtiUrl(card.MBTI ? `/images/mbti/${card.MBTI}.webp` : '');

        setIsPrint(true)
        setIsFlipped(false); // receivedData가 있을 때 카드를 앞면으로 초기화
        const tl = gsap.timeline();
        // 목표 위치와 시점을 설정
        const targetPos = new Vector3(-5.5, 13, -58);
        const targetAt = new Vector3(-5.5, 2, -70);
        // 목표 Quaternion 계산
        const targetQuat = new Quaternion().setFromRotationMatrix(
          new Matrix4().lookAt(targetPos, targetAt, camera.up)
        );
        tl.to(camera.position, {
          x: targetPos.x,
          y: targetPos.y,
          z: targetPos.z,
          duration: 1,
          ease: "power2.out",
        }).to(camera.quaternion, {
          x: targetQuat.x,
          y: targetQuat.y,
          z: targetQuat.z,
          w: targetQuat.w,
          duration: 1,
          ease: "power2.out",
        },"<");
        // 목표 위치와 시점을 설정
        const targetPosition = new Vector3(0, 11.7, -57);
        const targetLookAt = new Vector3(0, 11.7, -58);
        // 목표 Quaternion 계산
        const targetQuaternion = new Quaternion().setFromRotationMatrix(
          new Matrix4().lookAt(targetPosition, targetLookAt, camera.up)
        );
        
        tl.to(camera.position, {
          x: targetPosition.x,
          y: targetPosition.y,
          z: targetPosition.z,
          duration: 1,
          ease: "power2.out",
        },"+=3.2").to(camera.quaternion, {
          x: targetQuaternion.x,
          y: targetQuaternion.y,
          z: targetQuaternion.z,
          w: targetQuaternion.w,
          duration: 1,
          ease: "power2.out",
          onStart: () => {
              setShowQR(false); //팝업 출력 후 QR 코드 숨김
          }
        },"<");
      } else {
        handleBackClick(); //원래 위치로 돌아감
      }

      
      

    },[receivedData]);

    const handleBackClick=(e)=>{
      if (e) e.stopPropagation();
      if (playerPosition) {
        setIsCharacterVisible(true);
        setShowBtns(true);
        setReceivedData(null);
        const targetPosition = new Vector3(playerPosition.x, playerPosition.y + 8, playerPosition.z + 10); 
        const targetLookAt = new Vector3(playerPosition.x, playerPosition.y + 4, playerPosition.z); // 캐릭터를 바라보는 방향

        // Quaternion을 사용하여 카메라 회전 목표 계산
        const targetQuaternion = new Quaternion().setFromRotationMatrix(
          new Matrix4().lookAt(targetPosition, targetLookAt, camera.up)
        );
        gsap.to(camera.position, {
          x: targetPosition.x,
          y: targetPosition.y,
          z: targetPosition.z,
          duration: 1,
          ease: "power3.inOut",
        });

        gsap.to(camera.quaternion, {
          x: targetQuaternion.x,
          y: targetQuaternion.y,
          z: targetQuaternion.z,
          w: targetQuaternion.w,
          duration: 1,
          ease: "power3.inOut",
          onComplete: () => {
            clearFocus();
            setBeforeCamera(null, null);
          },
        });
    }}      
    
    // //isFocused 상태가 변경될때 상태 출력 
    // useEffect(() => {
    //   console.log("isFocused has changed:", isFocused);
    // }, [isFocused]);

    // //beforeCamera 상태가 변경될때 상태 출력 
    // useEffect(() => {
    //   console.log("beforeCamera has changed:", beforeCamera);
    // }, [beforeCamera]);

    // 카드 및 이미지 URL을 메모이제이션
    const { backImageUrl, frontImageUrl } = useMemo(() => {
      if (receivedData) {
        const card=receivedData.data;
        return {
          backImageUrl: card.backgroundOption ? getBackImageUrl(card.backgroundOption): '/images/back/GreyA.webp',
          frontImageUrl: card.backgroundOption ? `/images/front/${card.backgroundOption}.webp` : '/images/front/GreyAurora.webp'
        };
      }
      return { backImageUrl: '', frontImageUrl: '' };
    }, [receivedData]);

    // 카드 스타일을 메모이제이션
    const cardStyles = useMemo(() => ({
      back: {
        ...baseCardStyles.back,
        backgroundImage: `url('${backImageUrl}')`,
        transform: isFlipped ? 'rotateX(0deg)' : 'rotateX(180deg)',
      },
      front: {
        ...baseCardStyles.front,
        backgroundImage: `url('${frontImageUrl}')`,
        transform: isFlipped ? 'rotateX(-180deg)' : 'rotateX(0deg)',
      }
    }), [backImageUrl, frontImageUrl, isFlipped]);


  // 폰트 옵션에 따라 폰트 패밀리를 반환하는 함수
  function getFontFamily(fontOption) {
    switch (fontOption) {
      case 1:
        return "HakgyoansimBombanghakR";
      case 2:
        return "Ownglyph_meetme-Rg";
      case 3:
        return "SUITE-Regular";
      case 4:
        return "Dovemayo_wild";
      case 5:
        return "HakgyoansimButpenB";
      default: //디폴트
      return "sans-serif";
    }
  }

 // 이 함수는 각 배경 옵션에 따른 URL을 반환
 function getBackImageUrl(backgroundOption) {
  switch (backgroundOption) {
    case 'BlueCheck':
      return `/images/back/Blue.webp`;
    case 'GreenMilitary':
      return `/images/back/GreenM.webp`;
    case 'GreenBerry':
      return `/images/back/GreenB.webp`; 
    case 'Grey':
      return `/images/back/Grey.webp`;
    case 'GreyAurora':
      return `/images/back/GreyA.webp`;
    case 'PinkAurora':
    case 'PinkCheck':
    case 'Pink':
      return `/images/back/Pink.webp`;
    case 'RedMelt':
      return `/images/back/RedM.webp`;
    case 'PurpleAurora':
      return `/images/back/PurpleA.webp`;
    case 'PurpleCheck':
      return `/images/back/PurpleC.webp`;
    case 'SkyMelt':
      return `/images/back/SkyM.webp`;
    case 'SKy':
      return `/images/back/SkyM.webp`;
    case 'SkyCloud':
      return `/images/back/SkyC.webp`;
    case 'Yellow':
      return `/images/back/Yellow.webp`;
    default:
      return '/images/back/Grey.webp'; // 기본 이미지-단색 그레이
  }
}



  //카드 뒤집기 애니메이션 
  const handleCardClick = () => {
    playAudio("flipCard","flipCard");

    //뒷면->앞면 (t->f)
    if (isFlipped) {
      //바로 QR 코드를 숨김
      setTimeout(() => {
        setShowQR(false);
        }, 300); 
    }

    //앞면->뒷면 (f->t)
    if (!isFlipped) {
      // 애니메이션이 조금 진행된 후 QR 코드를 보여줌
      setTimeout(() => {
      setShowQR(true);
      }, 200); 
    }

    // 카드의 뒤집힌 상태를 토글
    setIsFlipped(!isFlipped);
    
  };
    
  // //이메일 받음 - 개인 qr 사이트 이동용
  // useEffect(()=>{
  //     console.log(`userName : ${userName}`);
  //     console.log(`userEmail : ${userEmail} type: ${typeof userEmail}`);
  //     console.log(`모바일 사이트 주소 https://kimsofficebc.netlify.app/?userEmail=${userEmail}`);
  // },[userEmail,userName]);

  // useEffect(()=>{
  //   console.log("isPrint state in PrintCard", isPrint);
  // },[isPrint])

    return (
      <>
        {(!isPrint&&receivedData) && (
          <Html transform occlude position={[0,11.5,-60]} scale={0.2}>
            <div className='print-canvas' onClick={(e)=>e.stopPropagation()}>
            <img src="/images/popup_.webp" alt="Background" style={{ position: 'absolute', width: '100%', height: '100%' }} />
              <div className="back" onClick={handleBackClick}></div>
              <div className="card" onClick={handleCardClick}>
                <div className="cardFront" style={cardStyles.front}>
                  <div className="info-container">
                    <div className="info-item date" style={infoItemStyle}>
                      {receivedData?.data?.updatedAt ? new Date(receivedData.data.updatedAt).toLocaleDateString() : ''}
                    </div>
                    <div className="info-item name" style={infoItemStyle}>이름</div>
                    <div className="info-item nameValue" style={infoItemStyle}> {receivedData?.data?.name || ''}</div>
                    <div className="info-item engName" style={infoItemStyle}> {receivedData?.data?.engName || ''}</div>
                    <div className="info-item school" style={infoItemStyle}>학교</div>
                    <div className={`info-item ${receivedData?.data?.studentNum ? 'schoolValue' : 'schoolValueWithoutNum'}`} style={infoItemStyle}>
                      {receivedData?.data?.school || ''}
                    </div>
                    <div className="info-item studentNumValue" style={infoItemStyle}> {receivedData?.data?.studentNum || ''}</div>
                    <div className="info-item major" style={infoItemStyle}>전공</div>
                    <div className="info-item majorValue" style={infoItemStyle}> {receivedData?.data?.major || ''}</div>
                    <div className="info-item session" style={infoItemStyle}>진로</div>
                    <div className="info-item sessionValue" style={infoItemStyle}> <span className="highlight">{receivedData?.data?.session || ''}</span></div>
                    <div className="info-item MBTI" style={infoItemStyle}>mbti</div></div>
                    <div className="info-item email" style={infoItemStyle}>이메일</div>
                    <div className="info-item emailValue" style={infoItemStyle}>{receivedData?.data?.email || ''}</div>
                    <div className="info-item IG" style={infoItemStyle}>Insta</div>  
                    <div className="info-item IGValue" style={infoItemStyle}>{receivedData?.data?.ig ? `@${receivedData.data.ig}` : ''}</div>  
                    {frameUrl && <img className='frame' src={frameUrl} alt="Frame"/>} 
                    {cardImage && 
                      <img src={cardImage} 
                      alt="Profile" 
                      className={receivedData?.data?.frameShapeoption === "Rec" ? "cardImageRectGrey" : "cardImageCircleGrey"}
                      style={infoItemStyle} 
                    />}
                    {mbtiUrl&& <img src={mbtiUrl} alt="mbti" className="MBTIValue" style={infoItemStyle} />}
                  </div>
                  <div className="cardBack" style={cardStyles.back}>
                    {patternUrl &&<img className="pattern" src={patternUrl} alt="Pattern"/>}
                    {showQR && (
                        <div className="QR">
                          <QRCode value={`https://kimsofficebc.netlify.app/?userEmail=${userEmail}`} size={70} />
                        </div>
                    )} 
                    <div className="info-item moto" style={infoItemStyle}> {receivedData?.data?.moto || ''}</div>
                </div>                 
                </div>
              <div className="description"><span style={{ color: '#00bca9' }}>{userName}</span> 님의 명함이 출력되었습니다 !</div>
            </div>
          </Html>
        )}
      </>
  );
}

export default PrintCard;                                                      