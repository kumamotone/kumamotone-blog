import type { NextAuthOptions } from "next-auth"
import NextAuth from "next-auth"

// 認証プロバイダーの設定
const authOptions: NextAuthOptions = {
  providers: [
    // 使用する認証プロバイダーをここに追加
    // 例: GitHubProvider({
    //   clientId: process.env.GITHUB_ID,
    //   clientSecret: process.env.GITHUB_SECRET,
    // }),
  ],
  // その他の設定...
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
