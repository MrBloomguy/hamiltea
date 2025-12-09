export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <img
      src="/youbuidl.svg"
      alt="Logo"
      width={40}
      height={40}
      onClick={onClick}
      className="cursor-pointer"
    />
  );
}
