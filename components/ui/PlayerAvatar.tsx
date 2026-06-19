interface PlayerAvatarProps {
  name: string;
  colorPrimary: string;
  colorSecondary: string;
  size?: number;
}

export function PlayerAvatar({ name, colorPrimary, colorSecondary, size = 32 }: PlayerAvatarProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="16" fill={colorPrimary} />
      <circle cx="16" cy="16" r="13" fill={colorPrimary} stroke={colorSecondary} strokeWidth="2" />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fill={colorSecondary}
        fontSize="11"
        fontWeight="bold"
        fontFamily="-apple-system, system-ui, sans-serif"
      >
        {initials}
      </text>
    </svg>
  );
}
