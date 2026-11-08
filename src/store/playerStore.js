import {create} from 'zustand';

const usePlayerStore = create(set => ({
  playerPosition: { x: 0, y: 0, z: 0 },
  setPlayerPosition: (x, y, z) => set(() => ({ playerPosition: { x, y, z } })),
  isCharacterVisible: true, // 캐릭터 이동 확인용
  setIsCharacterVisible: (isCharacterVisible) => set(() => ({ isCharacterVisible })),
}));

export default usePlayerStore;
