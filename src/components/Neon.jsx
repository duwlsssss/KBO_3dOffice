import React, { useRef } from 'react'
import { useGLTF,Sparkles } from '@react-three/drei'

export default function Model({ ...props }) {
  const { nodes, materials } = useGLTF('/models/building_trading.glb')
  return (
      <mesh geometry={nodes.Text001.geometry}>
        <meshPhysicalMaterial color="cyan" emissive="cyan" emissiveIntensity={1000} roughness={0} metalness={0.5}/>
        {/* <Sparkles count={10} scale={10} size={6} speed={0.4} /> */}
        {/* <meshBasicMaterial color={'cyan'} toneMapped={false} amount={50} emissive="green" glow="lightgreen"/> */}
      </mesh>
  )
}

useGLTF.preload('/models/building_trading.glb')
