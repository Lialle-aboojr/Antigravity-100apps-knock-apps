import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { useRef } from 'react';
import GlitchText from './GlitchText';

/**
 * カメラ制御用コンポーネント (内部用)
 * Appから受け取ったスクロール量をもとに、毎フレーム(useFrame)カメラの回転を更新します。
 */
function CameraController({ scrollAmount }) {
  // カメラ要素への参照（操作用のリモコンのようなもの）を作成
  const cameraRef = useRef();

  // 画面が再描画される（1秒間に約60回）たびに呼ばれる処理
  useFrame(() => {
    if (cameraRef.current) {
      // 目眩がするような演出：スクロール量に応じてZ軸（奥行き）方向に回転させる
      // スクロール量が大きいほど高速で激しく回る
      const targetZ = scrollAmount * 0.05; 
      cameraRef.current.rotation.z = targetZ;
      
      // おまけ：Z軸の前後の動きもサイン波(Math.sin)で追加して、さらに気持ち悪い動きにする
      cameraRef.current.position.z = 5 + Math.sin(scrollAmount * 0.01) * 2;
    }
  });

  return (
    // React Three Fiber の標準カメラ
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault // これをメインカメラとして使用する
      position={[0, 0, 5]} // 初期位置
      fov={75} // 視野角（少し広め）
    />
  );
}

/**
 * カオスな世界を構築する3Dキャンバスコンポーネント
 */
export default function ChaosCanvas({ scrollAmount }) {
  return (
    // Canvasタグの中に3D要素（メッシュやライト、カメラ）を配置します
    <Canvas
      style={{ background: '#000000' }} // 背景はサイバーパンクな暗闇
      gl={{ antialias: false }} // 【演出】あえてアンチエイリアス（滑らか化）を切り、少しギザギザ・グリッチ感を残す
    >
      {/* スクロール連動カメラ */}
      <CameraController scrollAmount={scrollAmount} />
      
      {/* 空間全体の弱い光 */}
      <ambientLight intensity={0.5} />
      
      {/* マゼンタの光（右斜め上から） */}
      <directionalLight position={[10, 10, 10]} intensity={2} color="#ff00ff" />
      {/* ネオングリーンの光（左斜め下から） */}
      <directionalLight position={[-10, -10, 10]} intensity={2} color="#39ff14" />
      
      {/* 歪むテキストコンポーネントの配置 */}
      <GlitchText />
    </Canvas>
  );
}
