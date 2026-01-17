// pages/home.jsx
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import logo from "../public/logo.svg";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid credentials");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#142749]">

      {/* Logo instead of h1 */}
      <div className="mb-8">
        <Image
          src={logo}
          alt="SMP IIT Bombay"
          width={120}
          priority
        />
      </div>
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center text-black">
          Peer Review Portal
        </h2>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black">
              LDAP Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-black border border-[#c2c9cf] rounded-md focus:outline-none focus:ring focus:ring-blue-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-[#c2c9cf] rounded-md focus:outline-none text-black focus:ring focus:ring-blue-300"
              required
            />
          </div>

          <button
            type="submit"
            className="group relative w-full overflow-hidden rounded bg-[#ffc50d] px-4 py-2 text-black"
          >
            <span
              className="absolute inset-0 -translate-x-full bg-black/10
                         transition-transform duration-200 ease-out
                         group-hover:translate-x-0"
            />
            <span className="relative z-10 font-medium">Sign In</span>
          </button>
        </form>
      </div>
    </div>
  );
}
