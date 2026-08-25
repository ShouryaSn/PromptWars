export default function BackgroundGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      <div className="absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
      <div className="absolute bottom-[-10rem] right-[-10rem] h-[28rem] w-[28rem] rounded-full bg-accent/[0.06] blur-[120px]" />
      <div className="absolute inset-0 bg-grid-fade" />
    </div>
  );
}
