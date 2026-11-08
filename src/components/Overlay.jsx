import {useState,useCallback} from "react"
import { GoogleLogin } from '@react-oauth/google';
import useLoginStore from '../store/logInStore';
import useNPCStore from  "../store/npcIntroStore";
import useOverlayStore from "../store/overlayStore";
import useCameraStore from "../store/cameraStore";
import useNpcInsideStore from "../store/npcInsideStore";
import usePlayerStore from "../store/playerStore";
import useAudioStore from '../store/audioStore';

function Overlay(){

  const clearFocus = useCameraStore(state=>state.clearFocus);
  const isLoggedIn = useLoginStore(state => state.isLoggedIn);
  const showLogin = useLoginStore(state=>state.showLogin);
  const logout = useLoginStore(state => state.logout);
  const logoutPlay = useLoginStore(state => state.logoutPlay);
  const loginWithGoogle = useLoginStore(state=>state.loginWithGoogle)
  const showBtns = useLoginStore(state=>state.showBtns);
  const start=useOverlayStore(state => state.start);
  const setStart=useOverlayStore(state => state.setStart);
  const isInside=useOverlayStore(state => state.isInside);
  const setIsOutside=useOverlayStore(state => state.setIsOutside);
  const setBeforeStart=useOverlayStore(state => state.setBeforeStart);

  const setForOriginRot=useNpcInsideStore(state => state.setForOriginRot);
  const isIntroductionEnd = useNPCStore(state => state.isIntroductionEnd);
  const setNpcPosition=useNPCStore(state =>  state.setNpcPosition);
  const setShowSpeechBubble=useNPCStore(state =>  state.setShowSpeechBubble);
  const setIsNpcVisible=useNPCStore(state =>  state.setIsNpcVisible);
  const setIsIntroductionEnd=useNPCStore(state =>  state.setIsIntroductionEnd);
  const hasDisappeared=useNPCStore(state =>  state.hasDisappeared);
  const setHasDisappeared=useNPCStore(state =>  state.setHasDisappeared);
  const setPlayerPosition=usePlayerStore(state =>  state.setPlayerPosition);
  const setIsCharacterVisible=usePlayerStore(state =>  state.setIsCharacterVisible);

  const {isElement3DLoaded, setIsElement3DLoaded} = useCameraStore();

  const playAudio = useAudioStore(state=>state.playAudio); 
  const stopAllAudios = useAudioStore(state=>state.stopAllAudios); 

  const isSoundOn = useAudioStore(state=>state.isSoundOn); 
  const toggleSound  = useAudioStore(state=>state.toggleSound); 

  const [showLogOutPopup, setShowLogoutPopup] = useState(false); // 팝업 표시 여부


  // 구글 로그인 로드 성공시 호출할 함수
  // 사용자 정보가 담긴 token을 credential에 담아 발급해줌
  const handleGoogleLogIn=async(googleData)=>{
    try {
      console.log("googleData",googleData);
      // console.log("loginInfo",jwtDecode(googleData.googleData));
      // console.log(api.defaults.baseURL);
      await loginWithGoogle(googleData.credential);
      playAudio("sbNext", "sbNext");
    } catch (error) {
      console.error("Login Error", error); // error 전체를 로깅
    }
  };

  // useEffect(()=>{
  //   console.log("showBtns State",showBtns);
  // },[showBtns]);

  //로그아웃 처리
  const handleLogout = () => {
    if(isIntroductionEnd){ //플레이 중 로그아웃 버튼 누름
      clearFocus();
      setBeforeStart(); // start false로 
      setIsOutside();
      setForOriginRot(false); // 안 npc
      setIsIntroductionEnd(false); //player 없앰
      setNpcPosition(0,4,100);
      setIsNpcVisible(false);
      setShowSpeechBubble(false); //밖 npc
      if(hasDisappeared){setHasDisappeared(false);}
      setPlayerPosition(0,4,105); 
      setIsCharacterVisible(false);
      stopAllAudios(); // 모든 소리 없앰
      logoutPlay(); // animationRestart 
      console.log('Logged out successfully-play');
    }else{
      logout(); 
      console.log('Logged out successfully-conversation');
    }
    setShowLogoutPopup(false); // 로그아웃 후 팝업 숨김
  };

  // "아니오" 클릭 시 팝업 숨김
  const handleNoClick = () => {
    playAudio("sbNext","sbNext");
    setShowLogoutPopup(false);
  };

  // 사운드 상태 변경
  const handleSound = () => {
    toggleSound();
  };


  //시작 버튼 누름
  const handleStartClick = () => {
    setStart();
    setIsElement3DLoaded(false);
  };


  // //intro.gif 출력 후 멈춤
  // const [gifEnded, setGifEnded] = useState(false);

  // useEffect(() => {
  //   if (!start && isElement3DLoaded) {
  //     const timer = setTimeout(() => {
  //       setGifEnded(true);
  //     }, 6000); 
      
  //     return () => clearTimeout(timer);
  //   }
  // }, [start, isElement3DLoaded]);
  

  return (
    <>
      {!start&&isElement3DLoaded&&(
      <div className='start-overlay-container'>
        <img className="gif" src="/images/intro_2.gif" alt="Intro"/>
        <button className="start-btn" onClick={handleStartClick}>
          START
        </button>
      </div>)}
      {/*로그인 버튼*/}
      {showLogin && (
        <div className='login-overlay'>
          <button className='login-button' >
            <img className="loginBtn-img" src="/images/loginBtn.webp" alt="Login"/>
          </button>
          <GoogleLogin
            onSuccess={handleGoogleLogIn}
            onError={() => console.error("Login Failed..")}
            type="standard"
            size="medium"
            text="signin"
            width="100"
          />
        </div>
      )}
      {isLoggedIn && (
          <>
            {showBtns&&(
            <div className="overlay-btns-container">
              {/* 사운드 on/off 버튼 */}
              <button className="btn" onClick={handleSound}>
                <img className="soundImg" src={isSoundOn ? "/images/SoundOnIcon.webp" : "/images/SoundOffIcon.webp"} alt="Sound Toggle" />
              </button>
              {/* 로그아웃 버튼 */}
              <button className="btn" onClick={() => { setShowLogoutPopup(true);}}>
                <img className="logoutImg" src="/images/logoutIcon.webp" alt="Logout"></img>
              </button>
            </div>
            )}
            {showLogOutPopup && (
              <>
                <div className="popup-overlay"></div>
                <div className="logout-save-popup">
                  <img src="/images/logOut.png" style={{ position: 'absolute', width: '100%', height: '100%' }} />
                  <div className="logout-buttons-container">
                    <button className="yes" onClick={() => {
                      setTimeout(() => playAudio("sbNext", "sbNext"), 0);
                      handleLogout();
                    }}/>
                    <button className="no" onClick={()=>{playAudio("sbNext","sbNext"); handleNoClick();}}/>
                  </div>
                  <button className="x" onClick={handleNoClick}/>
                </div>
              </>
            )}
          </>
        )
      }
    </>
  )
};

export default Overlay;


