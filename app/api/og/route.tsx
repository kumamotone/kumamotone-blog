import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = searchParams.get('title') ?? '熊小屋'

  return new ImageResponse(
    (
      <div className="flex h-full w-full flex-col items-center justify-center bg-white text-4xl font-semibold">
        <div className="mt-10">熊小屋</div>
        <div className="mt-10">{title}</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  ) as unknown as Response
}
