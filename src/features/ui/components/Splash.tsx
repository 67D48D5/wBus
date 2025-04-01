// src/features/ui/components/Splash.tsx

interface SplashProps {
  visible: boolean;
}

export default function Splash({ visible }: SplashProps) {
  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#003876] flex flex-col items-center justify-center
          transition-opacity duration-700 ease-in-out
          ${
            visible
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
    >
      <div className="text-white text-4xl font-extrabold tracking-wider animate-pulse">
        YMove
      </div>
      <div className="mt-2 text-gray-400 text-sm">
        실시간 버스 정보를 불러오는 중...
      </div>
    </div>
  );
}
