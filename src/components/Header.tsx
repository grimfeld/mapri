import UserProfile from "./UserProfile";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 h-14 md:h-16 flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-2">
          <img
            src="/icon-192.png"
            alt="MapRi"
            className="h-5 w-5 sm:h-6 sm:w-6"
          />
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">MapRi</h1>
        </div>
        <UserProfile />
      </div>
    </header>
  );
}
