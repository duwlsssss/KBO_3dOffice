import {create} from 'zustand';

const useNpcInsideStore = create(set => ({
  npcPosition: { x: 0, y: 0, z: 0 },
  setNpcPositionIn: (x, y, z) => set(() => ({ npcPosition: { x, y, z } })),
  forOriginRot: false,
  setForOriginRot: (forOriginRot) => set(() => ({ forOriginRot })),
}))
export default useNpcInsideStore;