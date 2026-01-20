// components/Navbar.jsx
import Link from "next/link";
import Image from "next/image";
import logo from "../public/logo.svg";
import { signOut } from "next-auth/react";

export default function Navbar() {
  return (
    <nav className="bg-[#142749] text-white px-4 sm:px-6 py-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center">
          <Image
            src={logo}
            alt="SMP IIT Bombay"
            width={60}
            height={60}
            className="sm:w-[70px] sm:h-[70px]"
            priority
          />
        </Link>

        {/* Logout Button */}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="bg-[#ffc10b] text-black px-4 sm:px-6 py-2 rounded-lg font-semibold hover:bg-[#e6ad09] transition-colors text-sm sm:text-base"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
