import {create} from 'zustand';

const useOverlayStore = create((set) => ({
  start: false,
  isInside: false,  
  setIsInside: () => {
    set(() => ({ isInside:true }))
  },
  setIsOutside: () => {
    set(() => ({ isInside:false }))
  },
  setStart: ()=>{
    const audio = new Audio('/sounds/startBtn.mp3');
    audio.play();
    set(()=>({start:true}))
  },
  setBeforeStart: ()=>{
    set(()=>({start:false}))
  },
}))

export default useOverlayStore;





