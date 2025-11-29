"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';

export default function SettingsPage() {
	const router = useRouter();
	const account = useCurrentAccount();

	// Mock User Data
	const [identityNo, setIdentityNo] = useState('');
	const [fullName, setFullName] = useState('John Doe'); // Mock name for now
	const [email, setEmail] = useState('citizen@turkiye.gov.tr');

	// Check auth on load
	useEffect(() => {
		// Parse cookies manually for client-side access
		const cookies = document.cookie.split('; ').reduce((acc, current) => {
			const [name, value] = current.split('=');
			acc[name] = value;
			return acc;
		}, {} as Record<string, string>);

		if (!cookies.auth_token) {
			router.push('/login');
		}

		if (cookies.user_identity) {
			setIdentityNo(cookies.user_identity);
		}
	}, [router]);

	const handleLogout = () => {
		document.cookie = "auth_token=; path=/; max-age=0";
		document.cookie = "user_identity=; path=/; max-age=0";
		router.push('/login');
		router.refresh();
	};

	const handleHome = () => {
		router.push('/');
	};

	return (
		<div className="min-h-screen bg-white font-sans text-gray-800">

			{/* --- HEADER --- */}
			<header className="bg-[#1C4574] h-16 flex items-center justify-between px-4 md:px-12 shadow-md fixed w-full top-0 z-50">
				<div className="flex items-center gap-3 cursor-pointer" onClick={handleHome}>
					<div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
						<span className="text-white font-bold text-sm">TR</span>
					</div>
					<div className="leading-tight text-white hidden sm:block">
						<h1 className="font-bold text-lg tracking-wide">e-Government</h1>
						<p className="text-[10px] text-blue-200 uppercase tracking-wider">Gateway</p>
					</div>
				</div>

				<div>
					<div className="flex items-center gap-3">
						{/* DASHBOARD BUTTON (Replaces Settings button in this view) */}
						<button
							onClick={handleHome}
							className="bg-[#153456] border border-transparent text-white px-4 py-1.5 rounded text-sm hover:bg-white hover:text-[#1C4574] transition-colors flex items-center gap-2"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
							Dashboard
						</button>

						<button
							onClick={handleLogout}
							className="bg-transparent border border-white text-white px-5 py-1.5 rounded text-sm hover:bg-white hover:text-[#1C4574] transition-colors"
						>
							Log Out
						</button>
					</div>
				</div>
			</header>

			{/* --- MAIN CONTENT --- */}
			<main className="pt-24 pb-12 px-4 md:px-8 max-w-4xl mx-auto">

				{/* Page Title & Back Link */}
				<div className="mb-8 border-b border-gray-100 pb-4 flex justify-between items-end">
					<div>
						<h2 className="text-2xl font-bold text-[#1C4574]">Account Settings</h2>
						<p className="text-gray-500 mt-1">Manage your profile and digital assets.</p>
					</div>
					{/* Also keeping this link as secondary navigation */}
					<button onClick={handleHome} className="text-[#1C4574] text-sm hover:underline font-medium">
						&larr; Back to Dashboard
					</button>
				</div>

				<div className="grid gap-8 md:grid-cols-2">

					{/* Left Column: Personal Information */}
					<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
						<h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
							<svg className="w-5 h-5 text-[#1C4574]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
							Personal Information
						</h3>

						<div className="space-y-4">
							<div>
								<label className="block text-xs font-semibold text-gray-500 uppercase mb-1">TR Identity Number</label>
								<input
									type="text"
									value={identityNo}
									disabled
									className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded text-gray-500 cursor-not-allowed font-mono"
								/>
							</div>
							<div>
								<label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Full Name</label>
								<input
									type="text"
									value={fullName}
									onChange={(e) => setFullName(e.target.value)}
									className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#1C4574] focus:ring-1 focus:ring-[#1C4574] outline-none transition-all"
								/>
							</div>
							<div>
								<label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email Address</label>
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#1C4574] focus:ring-1 focus:ring-[#1C4574] outline-none transition-all"
								/>
							</div>
							<button className="px-4 py-2 bg-[#1C4574] text-white rounded text-sm hover:bg-[#153456] transition-colors font-medium">
								Update Profile
							</button>
						</div>
					</div>

					{/* Right Column: Digital Wallet */}
					<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
						<h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
							<svg className="w-5 h-5 text-[#1C4574]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
							Digital Wallet
						</h3>

						<div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
							<p className="text-sm text-blue-800 mb-3 leading-relaxed">
								Connect your Sui Wallet to participate in blockchain-based voting events securely.
							</p>
							<div className="flex justify-center">
								{/* SUI CONNECT BUTTON */}
								<ConnectButton />
							</div>
						</div>

						{account && (
							<div className="space-y-3 pt-2 border-t border-gray-100">
								<div className="flex justify-between items-center text-sm">
									<span className="text-gray-500">Status:</span>
									<span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-xs border border-green-100">Connected</span>
								</div>
								<div className="flex justify-between items-center text-sm">
									<span className="text-gray-500">Network:</span>
									<span className="text-gray-800 font-medium">Sui Testnet</span>
								</div>
								<div className="mt-2">
									<span className="text-gray-500 text-xs block mb-1 uppercase tracking-wide">Wallet Address</span>
									<div className="bg-gray-50 p-3 rounded text-xs font-mono break-all text-gray-600 border border-gray-200 select-all">
										{account.address}
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

			</main>
		</div>
	);
}