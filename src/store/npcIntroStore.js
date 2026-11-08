import {create} from 'zustand';

const useNPCStore = create(set => ({
  npcPosition: { x: 0, y: 0, z: 0 },
  setNpcPosition: (x, y, z) => set(() => ({ npcPosition: { x, y, z } })),
  isNpcVisible: false, // npc 초기 가시성 상태
  setIsNpcVisible: (isNpcVisible) => set(() => ({ isNpcVisible })),
  showSpeechBubble: false, // npc 초기 가시성 상태
  setShowSpeechBubble: (showSpeechBubble) => set(() => ({ showSpeechBubble })),
  isIntroductionEnd: false, // npc 설명 끝남 여부
  // isIntroductionEnd: true, // 캐릭터 이동 확인용
  setIsIntroductionEnd: (isIntroductionEnd) => set(() => ({ isIntroductionEnd })),
  hasDisappeared: false, //문 안으로 들어가면 안 나오게
  setHasDisappeared: (value) => set({ hasDisappeared: value })
}))
export default useNPCStore;