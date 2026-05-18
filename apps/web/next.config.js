/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        const nestUrl = process.env.NEXT_PUBLIC_NESTJS_API_URL ?? 'http://localhost:3001';
        return [
            {
                source: '/api/:path*',
                destination: `${nestUrl}/api/:path*`,
            },
        ];
    },
    images:{
        remotePatterns:[
            {
                protocol:'https',
                hostname:'images.unsplash.com',
                pathname:"/**"

            },
            {
                protocol:"https",
                hostname:"res.cloudinary.com",
                pathname:'/**'
            },
            {
                protocol:"https",
                hostname:"i.pravatar.cc",
                pathname:"/**"
            }
        ]
    }
};

export default nextConfig;
