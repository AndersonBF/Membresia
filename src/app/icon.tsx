import { ImageResponse } from 'next/og'
 
export const size = {
  width: 512,
  height: 512,
}
 
export const contentType = 'image/png'
 
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#059669',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '64px',
        }}
      >
        <svg
          width="350"
          height="350"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Cabeça */}
          <circle cx="12" cy="7" r="4" />
          {/* Corpo */}
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}