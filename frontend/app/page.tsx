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

	useEffect(() => {
		// Check auth cookie
		const hasAuth = document.cookie.split(';').some((item) => item.trim().startsWith('auth_token='));
		setIsLoggedIn(hasAuth);
	}, []);

	const handleLoginRedirect = () => {
		router.push('/login');
	};

	const handleSettingsRedirect = () => {
		router.push('/settings');
	};

	const handleAction = (eventId: number) => {
		if (!isLoggedIn) {
			router.push('/login');
		} else {
			// Mock action
			alert(`User is authenticated. Proceeding to event ${eventId}...`);
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

				{/* Right Side */}
				<div>
					{isLoggedIn ? (
						<div className="flex items-center gap-3">
							{/* SETTINGS BUTTON */}
							<button
								onClick={handleSettingsRedirect}
								className="bg-[#153456] border border-transparent text-white px-4 py-1.5 rounded text-sm hover:bg-white hover:text-[#1C4574] transition-colors flex items-center gap-2"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
								Settings
							</button>

							{/* LOGOUT BUTTON */}
							<button
								onClick={() => {
									document.cookie = "auth_token=; path=/; max-age=0";
									window.location.reload();
								}}
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
				<div className="mb-8 border-b border-gray-100 pb-4">
					<h2 className="text-2xl font-bold text-[#1C4574]">Public Announcements</h2>
					<p className="text-gray-500 mt-1">Access current public services and voting events.</p>
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