"use client";

import React, { useState } from 'react';
// SuiNS (İsim Servisi) kancasını ekledik: useResolveSuiNSName
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useResolveSuiNSName } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

// İLERİDE BURAYA GERÇEK KONTRAT ID'Sİ GELECEK
const PACKAGE_ID = "0x...SİZİN_KONTRAT_IDNİZ...";
const MODULE_NAME = "voting";
const FUNCTION_NAME = "cast_vote";

export default function VotePage() {
	// 1. Cüzdan Bağlantı Durumu
	const account = useCurrentAccount();

	// 2. SuiNS İsim Çözümleme (Adres -> İsim)
	// DÜZELTME: Adresi nesne içinde değil, doğrudan parametre olarak veriyoruz.
	const { data: suiName } = useResolveSuiNSName(account?.address);

	// 3. İşlem Yürütme Fonksiyonu
	const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

	const [selectedOption, setSelectedOption] = useState<number | null>(null);
	const [isVoting, setIsVoting] = useState(false);

	const parties = [
		{ id: 1, name: "Party A", description: "For a brighter future, together." },
		{ id: 2, name: "Party B", description: "Economic freedom and stability." },
		{ id: 3, name: "Party C", description: "Justice and equality for everyone." },
	];

	const handleVote = () => {
		if (!account) return;
		if (!selectedOption) return;

		setIsVoting(true);

		try {
			const tx = new Transaction();

			tx.moveCall({
				target: `${PACKAGE_ID}::${MODULE_NAME}::${FUNCTION_NAME}`,
				arguments: [
					tx.pure.u64(selectedOption)
				],
			});

			signAndExecuteTransaction(
				{
					transaction: tx as any
				},
				{
					onSuccess: (result) => {
						console.log('Vote cast successfully:', result);
						alert(`Vote successful! Digest: ${result.digest}`);
						setIsVoting(false);
					},
					onError: (error) => {
						console.error('Voting failed:', error);
						alert("Transaction failed (Expected, contract not deployed yet). Check console for details.");
						setIsVoting(false);
					},
				},
			);
		} catch (e) {
			console.error(e);
			setIsVoting(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#F5F5F5] font-sans">

			{/* --- HEADER --- */}
			<header className="bg-[#1C4574] h-16 flex items-center justify-between px-4 md:px-12 shadow-md fixed w-full top-0 z-50">
				<div className="flex items-center gap-2 text-white">
					<div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center border-2 border-white">
						<span className="text-white text-xs font-bold">TR</span>
					</div>
					<h1 className="font-bold text-lg tracking-wide hidden sm:block">Digital Voting Gateway</h1>
				</div>

				<div className="flex items-center gap-4">
					<div className="text-white text-sm hidden md:block opacity-90">
						{account ? (
							<span>Welcome, <span className="font-bold font-mono">
								{suiName ? suiName : `${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
							</span></span>
						) : (
							<span>Welcome, <span className="font-bold">Guest</span></span>
						)}
					</div>
					{/* Header'daki buton her zaman görünür kalsın ki kullanıcı buradan da bağlanabilsin */}
					<ConnectButton />
				</div>
			</header>

			{/* --- MAIN CONTENT --- */}
			<main className="pt-24 pb-12 px-4 md:px-12 max-w-5xl mx-auto">

				{/* --- CÜZDAN KONTROLÜ --- */}
				{!account ? (
					// CÜZDAN BAĞLI DEĞİLSE GÖSTERİLECEK EKRAN
					<div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 bg-white p-12 rounded-xl shadow-md border border-gray-200 mt-8">
						<div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400">
								<path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
							</svg>
						</div>

						<div className="max-w-lg space-y-3">
							<h2 className="text-3xl font-bold text-[#1C4574]">Authentication Required</h2>
							<p className="text-gray-500 text-lg leading-relaxed">
								To access the secure ballot paper and participate in the General Elections 2025, you must verify your identity by connecting your digital wallet.
							</p>
						</div>

						<div className="p-1 rounded-lg border-2 border-dashed border-[#1C4574]/20 hover:border-[#1C4574]/50 transition-colors">
							<div className="scale-110">
								<ConnectButton />
							</div>
						</div>

						<p className="text-xs text-gray-400 max-w-sm">
							Access is restricted to authorized wallet holders on the Sui Network.
						</p>
					</div>
				) : (
					// CÜZDAN BAĞLIYSA İÇERİĞİ GÖSTER
					<>
						<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
							<h2 className="text-2xl font-semibold text-[#1C4574] mb-2">General Elections 2025</h2>
							<p className="text-gray-600">
								Select the political party you wish to support.
								<span className="text-green-600 font-bold ml-2">Wallet Connected via Sui.</span>
							</p>
						</div>

						<div className="space-y-4">
							{parties.map((party) => (
								<div
									key={party.id}
									onClick={() => !isVoting && setSelectedOption(party.id)}
									className={`p-6 rounded-lg border cursor-pointer transition-all flex items-center justify-between bg-white group animate-in fade-in slide-in-from-bottom-8 duration-700
                                        ${selectedOption === party.id
											? 'border-[#1C4574] ring-2 ring-[#1C4574] ring-opacity-20 shadow-md'
											: 'border-gray-200 hover:border-gray-400 hover:shadow-sm'
										}
                                        ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
								>
									<div className="flex flex-col">
										<span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
											Option {party.id}
										</span>
										<h3 className="text-xl font-bold text-gray-800 group-hover:text-[#1C4574] transition-colors">
											{party.name}
										</h3>
										<p className="text-gray-500 text-sm mt-1 italic">
											"{party.description}"
										</p>
									</div>

									<div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                        ${selectedOption === party.id ? 'border-[#1C4574]' : 'border-gray-300'}`}>
										{selectedOption === party.id && (
											<div className="w-3 h-3 bg-[#1C4574] rounded-full animate-pulse"></div>
										)}
									</div>
								</div>
							))}
						</div>

						<div className="mt-8 flex items-center justify-between border-t pt-6 border-gray-200 animate-in fade-in slide-in-from-bottom-10 duration-1000">
							<p className="text-xs text-gray-400 max-w-md">
								* Clicking confirm will prompt a blockchain transaction.
							</p>
							<button
								onClick={handleVote}
								disabled={!selectedOption || isVoting}
								className={`px-8 py-3 rounded-md text-white font-bold shadow-lg transition-all transform
                                    ${(selectedOption && !isVoting)
										? 'bg-[#1C4574] hover:bg-[#153456] cursor-pointer active:scale-95'
										: 'bg-gray-300 cursor-not-allowed text-gray-500'}`}
							>
								{isVoting ? 'PROCESSING...' : 'CAST VOTE'}
							</button>
						</div>
					</>
				)}

			</main>

			<footer className="text-center text-gray-400 text-xs py-8 border-t border-gray-200 mt-12">
				<p>&copy; 2025 Republic of Turkiye - Digital Voting Gateway</p>
				<p className="mt-1">Secured by Sui Blockchain Technology</p>
			</footer>
		</div>
	);
}