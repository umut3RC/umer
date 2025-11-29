import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Import dApp Kit CSS
import "@mysten/dapp-kit/dist/index.css";
// Import our new Providers component
import { Providers } from "@/components/Providers";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "e-Government Gateway",
	description: "Secure Identity and Voting System",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				{/* Wrap the application with Sui Providers */}
				<Providers>
					{children}
				</Providers>
			</body>
		</html>
	);
}