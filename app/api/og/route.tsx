import { ImageResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title')

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
          fontSize: 32,
          fontWeight: 600,
        }}
      >
        <div style={{ marginTop: 40 }}>山蔭の熊小屋</div>
        <div style={{ marginTop: 40 }}>{title}</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
