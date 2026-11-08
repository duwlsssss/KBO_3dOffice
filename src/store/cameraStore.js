import {create} from 'zustand'

const useCameraStore = create((set) => ({
  isFocused: false,
  focusTarget: null,
  beforeCamera: { position: null, rotation: null }, //모니터쪽에서 사용할 카메라 위치, 회전 저장용 변수
  isPrint:false,
  isDoorOpen: false,
  hasPrintAnimationPlayed: false,
  isElement3DLoaded:false,
  setFocus: (focusTarget) => set(() => ({ isFocused: true, focusTarget })),
  clearFocus: () => set(() => ({ isFocused: false, focusTarget: null })),
  setBeforeCamera: (position, rotation) => set(() => ({ beforeCamera: { position, rotation } })),
  setIsPrint:(isPrint) => set(() => ({ isPrint })),
  setIsDoorOpen: (isDoorOpen) => set(() => ({ isDoorOpen })),
  setHasPrintAnimationPlayed: (played) => set({ hasPrintAnimationPlayed: played }),
  setIsElement3DLoaded: (loaded) => set(() => ({ isElement3DLoaded: loaded })),
  showMonitorPopup: true,
  setShowMonitorPopup: (showMonitorPopup) => set(() => ({ showMonitorPopup })),
}));

export default useCameraStore;