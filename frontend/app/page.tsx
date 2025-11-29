"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const EVENTS = [
	{
		id: 1,
		title: "2025 General Elections",
		date: "Active Now",
		description: "Digital voting channels are open for all eligible citizens. Cast your vote securely via blockchain.",
		status: "Active"
	},
	{
		id: 2,
		title: "Municipal Feedback Survey",
		date: "Upcoming",
		description: "Share your thoughts on local infrastructure improvements.",
		status: "Pending"
	}
];

export default function Home() {
	const router = useRouter();
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	// Kullanıcı Bilgileri State'leri
	const [fullName, setFullName] = useState('');
	const [walletAddress, setWalletAddress] = useState('');

	useEffect(() => {
		// Çerezleri oku ve parse et
		const cookies = document.cookie.split('; ').reduce((acc, current) => {
			const [name, value] = current.split('=');
			acc[name] = value ? decodeURIComponent(value) : '';
			return acc;
		}, {} as Record<string, string>);

		// Auth kontrolü
		if (cookies.auth_token) {
			setIsLoggedIn(true);
			setFullName(cookies.user_fullname || 'Citizen');
			setWalletAddress(cookies.wallet_address || '');
		} else {
			setIsLoggedIn(false);
		}
	}, []);

	const handleLoginRedirect = () => {
		router.push('/login');
	};

	const handleLogout = () => {
		// Tüm çerezleri temizle
		document.cookie = "auth_token=; path=/; max-age=0";
		document.cookie = "wallet_address=; path=/; max-age=0";
		document.cookie = "has_ticket=; path=/; max-age=0";
		document.cookie = "user_fullname=; path=/; max-age=0";
		window.location.reload();
	};

	const handleAction = (eventId: number) => {
		if (!isLoggedIn) {
			router.push('/login');
		} else {
			// Şimdilik sadece alert, ileride oylama modalı açılacak
			alert(`User: ${fullName}\nWallet: ${walletAddress}\nProceeding to event...`);
		}
	};

	return (
		<div className="min-h-screen bg-white font-sans text-gray-800">

			{/* --- HEADER --- */}
			<header className="bg-[#1C4574] h-16 flex items-center justify-between px-4 md:px-12 shadow-md fixed w-full top-0 z-50">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
						<span className="text-white font-bold text-sm">TR</span>
					</div>
					<div className="leading-tight text-white hidden sm:block">
						<h1 className="font-bold text-lg tracking-wide">e-Government</h1>
						<p className="text-[10px] text-blue-200 uppercase tracking-wider">Gateway</p>
					</div>
				</div>

				{/* Sağ Taraf: Kullanıcı Bilgisi ve Çıkış */}
				<div>
					{isLoggedIn ? (
						<div className="flex items-center gap-4">

							{/* Kullanıcı Bilgileri (Desktop) */}
							<div className="text-right hidden md:block">
								<div className="text-white text-sm font-semibold">{fullName}</div>
								<div className="text-blue-300 text-[10px] font-mono tracking-wide">
									{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
								</div>
							</div>

							<div className="h-8 w-[1px] bg-blue-800 mx-2 hidden md:block"></div>

							{/* LOGOUT BUTTON */}
							<button
								onClick={handleLogout}
								className="bg-transparent border border-white text-white px-5 py-1.5 rounded text-sm hover:bg-white hover:text-[#1C4574] transition-colors"
							>
								Log Out
							</button>
						</div>
					) : (
						<button
							onClick={handleLoginRedirect}
							className="bg-white text-[#1C4574] px-6 py-2 rounded font-semibold text-sm shadow hover:bg-gray-100 transition-colors"
						>
							Log In
						</button>
					)}
				</div>
			</header>

			{/* --- MAIN CONTENT --- */}
			<main className="pt-24 pb-12 px-4 md:px-8 max-w-6xl mx-auto">

				{/* Karşılama Alanı (Mobil için de görünür) */}
				{isLoggedIn && (
					<div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
						<div>
							<h2 className="text-2xl font-bold text-[#1C4574]">Welcome, {fullName}</h2>
							<p className="text-gray-600 mt-1">Your digital identity is verified. You can now participate in listed events.</p>
						</div>
						<div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
							<div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your Blockchain Wallet</div>
							<div className="font-mono text-xs text-[#1C4574] break-all select-all">
								{walletAddress}
							</div>
						</div>
					</div>
				)}

				<div className="mb-6 border-b border-gray-100 pb-2">
					<h3 className="text-xl font-bold text-gray-700">Public Announcements</h3>
				</div>

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{EVENTS.map((event) => (
						<div
							key={event.id}
							className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between h-full"
						>
							<div>
								<div className="flex justify-between items-start mb-4">
									<span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                    ${event.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
										{event.status}
									</span>
									<span className="text-gray-400 text-xs">{event.date}</span>
								</div>

								<h3 className="text-xl font-bold text-[#1C4574] mb-3">{event.title}</h3>
								<p className="text-gray-600 text-sm leading-relaxed mb-6">
									{event.description}
								</p>
							</div>

							<button
								onClick={() => handleAction(event.id)}
								className={`w-full py-3 rounded-lg font-semibold text-sm transition-colors border
                  ${event.status === 'Active'
										? 'bg-[#1C4574] text-white border-[#1C4574] hover:bg-[#153456]'
										: 'bg-white text-gray-400 border-gray-200 cursor-not-allowed'
									}`}
								disabled={event.status !== 'Active'}
							>
								{event.status === 'Active' ? 'Participate / Vote' : 'Not Available'}
							</button>
						</div>
					))}
				</div>
			</main>
		</div>
	);
}