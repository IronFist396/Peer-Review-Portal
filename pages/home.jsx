// pages/home.jsx
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
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
    <>
      <Head>
        <title>Login - Peer Review Portal</title>
        <link rel="icon" href="/logo_dark.svg" />
      </Head>
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#142749] px-4 py-8">

      {/* Logo instead of h1 */}
      <div className="mb-6 sm:mb-8">
        <Image
          src={logo}
          alt="SMP IIT Bombay"
          width={100}
          height={100}
          className="sm:w-[120px] sm:h-[120px]"
          priority
        />
      </div>
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl sm:text-2xl font-bold text-center text-black">
          Peer Review Portal
        </h2>

        {error && <p className="text-red-500 text-center text-sm sm:text-base">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              LDAP Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm text-black border border-[#c2c9cf] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="roll.no@iitb.ac.in"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-[#c2c9cf] rounded-md focus:outline-none text-black focus:ring-2 focus:ring-blue-400"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="group relative w-full overflow-hidden rounded-lg bg-[#ffc50d] px-4 py-3 sm:py-2.5 text-base sm:text-sm font-semibold text-black mt-6"
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
    </>
  );
}
