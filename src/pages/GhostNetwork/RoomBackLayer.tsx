import { ROOM_WIDTH, ROOM_HEIGHT } from './constants';

export function RoomBackLayer() {
  return (
    <g>
      {/* Fallback dark background behind image */}
      <rect x="0" y="0" width={ROOM_WIDTH} height={ROOM_HEIGHT} fill="#050505" />
      
      {/* 
        The pixel art background image provided by the user.
        Make sure the image is saved as 'ghost-network-bg.jpg' inside the public folder.
      */}
      <image 
        href="/ghost-network-bg.jpg" 
        x="0" 
        y="0" 
        width={ROOM_WIDTH} 
        height={ROOM_HEIGHT} 
        preserveAspectRatio="xMidYMid slice" 
      />
    </g>
  );
}

export default RoomBackLayer;
