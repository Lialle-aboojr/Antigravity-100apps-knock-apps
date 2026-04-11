import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RenderTexture, MeshDistortMaterial } from '@react-three/drei';

/**
 * ノイズや流体のように歪む3Dテキストコンポーネント
 * 
 * 仕組み: 
 * 1. 2Dの「テクスチャ」として "Chaos" という文字を描画する (RenderTexture)
 * 2. そのテクスチャを 3Dの平面(Plane) に貼り付ける
 * 3. Dreiの「MeshDistortMaterial (ノイズで頂点を歪める素材)」を使用して
 *    平面全体をウネウネと蠢かせる
 */
export default function GlitchText() {
  const meshRef = useRef();

  // 少しずつ平面自体も回転させて、カオス感を増幅
  useFrame((state) => {
    if (meshRef.current) {
      // 経過時間(state.clock.elapsedTime)を使って滑らかに揺らす
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      meshRef.current.rotation.y = Math.cos(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    // 3Dオブジェクトの実体(mesh)
    <mesh ref={meshRef}>
      {/* 
        平面ジオメトリ。
        第3,4引数の 128, 128 は「ポリゴンの分割数」。
        これを多くしないと、頂点が滑らかに歪んでくれません。
      */}
      <planeGeometry args={[14, 8, 128, 128]} />
      
      {/* 
        流体・ノイズのように蠢くマテリアル（素材）
        speed=うねる速度, distort=歪みの強さ
      */}
      <MeshDistortMaterial speed={4} distort={0.6} radius={1}>
        {/* テクスチャの内側にテキスト空間を作る */}
        <RenderTexture attach="map">
          {/* 黒背景 */}
          <color attach="background" args={['#000000']} />
          {/* @react-three/drei の Text コンポーネントを使用 */}
          <Text
            fontSize={3}
            color="#39FF14" // ネオングリーン
            // 外部のGoogle Fontsから太字のフォントデータを直接読み込む
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
            outlineWidth={0.1}
            outlineColor="#FF00FF" // マゼンタのアウトライン
          >
            Chaos
          </Text>
        </RenderTexture>
      </MeshDistortMaterial>
    </mesh>
  );
}
