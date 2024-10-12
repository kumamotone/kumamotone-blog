'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentUser, signOut } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import "./globals.css";
import 'react-quill/dist/quill.snow.css';  // この行を追加

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <html lang="en">
      <body>
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-bold">My Blog</Link>
            {user && (
              <button onClick={handleLogout} className="text-white hover:underline">
                ログアウト
              </button>
            )}
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
