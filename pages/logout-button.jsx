// pages/logout-button.jsx
import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/home" })}
      className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
    >
      Sign Out
    </button>
  );
}