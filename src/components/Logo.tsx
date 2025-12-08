export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <img
      src="/icon-transparent.png"
      alt="Logo"
      width={40}
      height={40}
      onClick={onClick}
      className="cursor-pointer"
    />
  );
}
