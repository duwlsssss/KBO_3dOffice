import {create} from 'zustand';

const useAudioStore = create((set, get) => ({
  audios: {
    outBgSound: null,
    inBgSound: null,
    startBtn :null,
    sbStart: null,
    sbNext: null, 
    monitorClick:null,
    walk:null,
    print:null,
    doorOpen:null,
    showCard:null,
    flipCard:null,
    // 오디오 객체 저장
  },
  currentBgAudioType: null,
  isSoundOn: true,
  playAudio: (type, path) => {
    if (!get().isSoundOn) return; // 사운드가 꺼져있다면, 재생하지 않음

    const audios = get().audios; // 현재 상태에서 오디오 객체를 가져옴
    let audio = audios[type];
    if (audio) {
      audio.pause(); //이전 오디오 재생중이면 정지
      // 이전에 추가된 ended 이벤트 리스너가 있다면 제거
      audio.removeEventListener('ended', audios[type].onEnded);
    }

    audio = new Audio(`/sounds/${path}.mp3`);
    audio.load();

    audio.addEventListener('canplaythrough', () => {
      audio.play();
    });
    audio.addEventListener('error', () => {
      console.error(`Error loading ${type} audio from path: ${path}`);
    });


    if (["inBgSound", "outBgSound", "walk"].includes(type)) {
      const onEnded = () => get().playAudio(type, path);
      audio.addEventListener('ended', onEnded);
      audio.onEnded = onEnded;
    }

    // 배경음악 타입인 경우 상태 업데이트
    if (type === "inBgSound" || type === "outBgSound") {
      set({ currentBgAudioType: type });
    }

    set(state => ({
      audios: { ...state.audios, [type]: audio }
    }));
  },

  stopAudio: (type) => {
    const audio = get().audios[type]; // 현재 상태에서 오디오 객체를 가져옴
    if (audio) {
      audio.pause();
    }
  },
  // 오디오 재생 재개 함수 (이전에 일시정지한 위치에서 재생을 재개)
  resumeAudio: (type) => {
    const audio = get().audios[type];; // 현재 상태에서 오디오 객체를 가져옴
    // 오디오가 일시 정지된 상태면 재생 재개
    if (audio) {
      audio.play();
    }
  },
  resumeBgAudio: () => {
    const { currentBgAudioType } = get();
    if (currentBgAudioType && get().isSoundOn) {
      get().playAudio(currentBgAudioType, currentBgAudioType);
    }
  },
  // 모든 오디오 중지
  stopAllAudios: () => {
    const audios = get().audios;
    Object.keys(audios).forEach(key => {
      if (audios[key]) {
        audios[key].pause();
      }
    });
  },
  toggleSound: () => {
    set(state => {
      const newState = !state.isSoundOn;
      if (!newState) {
        // 사운드 OFF: 모든 오디오 중지
        Object.values(state.audios).forEach(audio => {
          if (audio) audio.pause();
        });
      } else if (state.currentBgAudioType) {
        // 사운드 ON: 현재 배경음악 재생
        const currentAudio = state.audios[state.currentBgAudioType];
        if (currentAudio) currentAudio.play();
      }
      return { ...state, isSoundOn: newState };
    });
  },
}));

export default useAudioStore;
