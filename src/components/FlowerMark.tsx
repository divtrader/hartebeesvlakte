/** A simple five petal flower in the plant's flower colour. */
export function FlowerMark({ colour = '#CFC5B3', size = 42 }: { colour?: string; size?: number }) {
  const pale = colour.toUpperCase() === '#F2EEE3' || colour.toUpperCase() === '#F7F3EA';
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <g fill={colour} stroke={pale ? '#CFC5B3' : 'none'} strokeWidth="1">
        <circle cx="24" cy="14" r="7.5" />
        <circle cx="33.5" cy="21" r="7.5" />
        <circle cx="30" cy="32" r="7.5" />
        <circle cx="18" cy="32" r="7.5" />
        <circle cx="14.5" cy="21" r="7.5" />
      </g>
      <circle cx="24" cy="24" r="4.5" fill={pale ? '#E8C14A' : '#5B3A22'} opacity="0.85" />
    </svg>
  );
}
