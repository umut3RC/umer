"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	// State for form inputs
	const [identityNumber, setIdentityNumber] = useState('');
	const [password, setPassword] = useState('');

	const handleLogin = (e: React.FormEvent) => {
		e.preventDefault(); // Prevent form submission refresh

		if (!identityNumber || !password) {
			alert("Please fill in all fields.");
			return;
		}

		setIsLoading(true);

		// --- AUTHENTICATION LOGIC ---
		// 1. Set Auth Token for Middleware access
		document.cookie = "auth_token=mock_secure_token; path=/; max-age=3600";

		// 2. Save Identity Number to display on Home Page (User Session Data)
		document.cookie = `user_identity=${identityNumber}; path=/; max-age=3600`;

		// Simulate network delay
		setTimeout(() => {
			router.push('/');
			router.refresh();
		}, 1000);
	};

	const handleBackToHome = () => {
		router.push('/');
	};

	return (
		<div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center font-sans text-gray-800 p-4">

			{/* Central Login Panel */}
			<div className="w-full max-w-[480px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">

				{/* Panel Header */}
				<div className="bg-white p-8 pb-4 text-center border-b border-gray-100">
					<div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm ring-4 ring-red-50">
						<span className="text-white font-bold text-xl tracking-wider">TR</span>
					</div>
					<h1 className="text-2xl font-bold text-[#1C4574]">e-Government Gateway</h1>
					<p className="text-gray-500 text-sm mt-1">Secure Identity Verification</p>
				</div>

				{/* Login Form */}
				<form onSubmit={handleLogin} className="p-8 pt-6 space-y-6">

					{/* Identity Number Input */}
					<div className="space-y-2">
						<label htmlFor="tckn" className="block text-sm font-semibold text-gray-700">
							TR Identity Number / Blue Card No
						</label>
						<div className="relative">
							<input
								id="tckn"
								type="text"
								maxLength={11}
								value={identityNumber}
								onChange={(e) => setIdentityNumber(e.target.value.replace(/[^0-9]/g, ''))}
								placeholder="12345678901"
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1C4574] focus:border-[#1C4574] outline-none transition-all placeholder-gray-300 text-gray-900 font-mono tracking-wide"
							/>
							<span className="absolute right-4 top-3.5 text-gray-400">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
									<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
								</svg>
							</span>
						</div>
					</div>

					{/* Password Input */}
					<div className="space-y-2">
						<label htmlFor="password" className="block text-sm font-semibold text-gray-700">
							e-Government Password
						</label>
						<div className="relative">
							<input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1C4574] focus:border-[#1C4574] outline-none transition-all placeholder-gray-300 text-gray-900"
							/>
							<span className="absolute right-4 top-3.5 text-gray-400">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
									<path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
								</svg>
							</span>
						</div>
						<div className="flex justify-end">
							<a href="#" className="text-xs text-[#1C4574] hover:underline">Forgot password?</a>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="pt-2 space-y-3">
						<button
							type="submit"
							disabled={isLoading}
							className={`w-full py-3.5 px-6 rounded-lg text-white font-bold shadow-md transition-all duration-200 flex justify-center items-center gap-2
                ${isLoading
									? 'bg-gray-400 cursor-not-allowed'
									: 'bg-[#1C4574] hover:bg-[#153456] hover:shadow-lg active:scale-[0.98]'
								}`}
						>
							{isLoading ? (
								<>
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									Verifying...
								</>
							) : 'Log In'}
						</button>

						<button
							type="button"
							onClick={handleBackToHome}
							className="w-full py-3.5 px-6 rounded-lg text-gray-600 font-semibold border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors"
						>
							Cancel / Back to Home
						</button>
					</div>

				</form>

				{/* Footer Info */}
				<div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
					<p className="text-[10px] text-gray-400 uppercase tracking-wide">
						SECURED BY 256-BIT SSL ENCRYPTION
					</p>
				</div>
			</div>

			<p className="mt-8 text-center text-xs text-gray-400">
				© 2025 Digital Transformation Office. All rights reserved.
			</p>

		</div>
	);
}