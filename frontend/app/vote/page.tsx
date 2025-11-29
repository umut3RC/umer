"use client";

import React, { useState } from 'react';
// useSuiClientQuery eklendi (Veri okumak için)
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useResolveSuiNSName, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

// ID'leriniz (Değiştirmeyin, son çalışan hali kalsın)
const PACKAGE_ID = "0xd9ccc138fe0cef281afa853b1bd4e0f2e7a372449920c51c0adc78483a2f6c4e";
const ELECTION_ID = "0x8aaaacf2a64142b402111f4406b01ccec8bd5f99939f9c65be7a639dbc441f3c";

const MODULE_NAME = "election";
const FUNCTION_NAME = "cast_vote";

export default function VotePage() {
	const account = useCurrentAccount();

	// --- 1. VERİ OKUMA (ELECTION DATA) ---
	// Sui ağından ElectionBox nesnesini sürekli takip ediyoruz.
	const { data: electionData, refetch, isPending, error } = useSuiClientQuery(
		'getObject',
		{
			id: ELECTION_ID,
			options: { showContent: true }, // İçeriğini (fields) görmek istiyoruz
		}
	);

	// Veriyi güvenli bir şekilde ayrıştıralım
	// Sui'den gelen veri 'fields' içinde durur: { votes_a: "5", ... }
	const votes = (electionData?.data?.content as any)?.fields || { votes_a: 0, votes_b: 0, votes_c: 0 };

	const { data: suiName } = useResolveSuiNSName(account?.address);
	const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

	const [selectedOption, setSelectedOption] = useState<number | null>(null);
	const [isVoting, setIsVoting] = useState(false);

	const parties = [
		// voteCount özelliğini dinamik olarak eşleştiriyoruz
		{ id: 1, key: 'votes_a', name: "Party A", description: "For a brighter future, together." },
		{ id: 2, key: 'votes_b', name: "Party B", description: "Economic freedom and stability." },
		{ id: 3, key: 'votes_c', name: "Party C", description: "Justice and equality for everyone." },
	];

	const handleVote = () => {
		if (!account || !selectedOption) return;

		setIsVoting(true);

		try {
			const tx = new Transaction();

			tx.moveCall({
				target: `${PACKAGE_ID}::${MODULE_NAME}::${FUNCTION_NAME}`,
				arguments: [
					tx.object(ELECTION_ID),
					tx.pure.u64(selectedOption)
				],
			});

			signAndExecuteTransaction(
				{ transaction: tx as any },
				{
					onSuccess: async (result) => {
						console.log('Vote cast successfully:', result);
						alert(`Vote successful!`);

						// --- 2. CANLI GÜNCELLEME ---
						// İşlem başarılı olunca veriyi tekrar çek
						await refetch();

						setIsVoting(false);
						setSelectedOption(null); // Seçimi sıfırla
					},
					onError: (error) => {
						console.error('Voting failed:', error);
						alert(`Error: ${error.message}`);
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
					<ConnectButton />
				</div>
			</header>

			<main className="pt-24 pb-12 px-4 md:px-12 max-w-5xl mx-auto">
				{!account ? (
					<div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 bg-white p-12 rounded-xl shadow-md border border-gray-200 mt-8">
						<h2 className="text-3xl font-bold text-[#1C4574]">Authentication Required</h2>
						<p className="text-gray-500 text-lg">Please connect your wallet to view election results and vote.</p>
						<ConnectButton />
					</div>
				) : (
					<>
						<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
							<div className="flex justify-between items-center">
								<div>
									<h2 className="text-2xl font-semibold text-[#1C4574] mb-2">General Elections 2025</h2>
									<p className="text-gray-600">Real-time election results on Sui Testnet.</p>
								</div>
								{isPending && <span className="text-sm text-gray-400">Loading data...</span>}
								{error && <span className="text-sm text-red-500">Error loading data</span>}
							</div>
						</div>

						<div className="space-y-4">
							{parties.map((party) => {
								// --- 3. OY SAYISINI HESAPLA ---
								// Move'dan gelen sayı string olabilir, Number'a çeviriyoruz
								const currentVotes = Number(votes[party.key] || 0);

								return (
									<div
										key={party.id}
										onClick={() => !isVoting && setSelectedOption(party.id)}
										className={`p-6 rounded-lg border cursor-pointer transition-all flex items-center justify-between bg-white group
                                            ${selectedOption === party.id
												? 'border-[#1C4574] ring-2 ring-[#1C4574] ring-opacity-20 shadow-md'
												: 'border-gray-200 hover:border-gray-400'
											}
                                            ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}
									>
										<div className="flex flex-col">
											<span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Option {party.id}</span>
											<h3 className="text-xl font-bold text-gray-800 group-hover:text-[#1C4574] transition-colors">{party.name}</h3>
											<p className="text-gray-500 text-sm mt-1 italic">"{party.description}"</p>
										</div>

										<div className="flex items-center gap-6">
											{/* OY SAYISI GÖSTERGESİ */}
											<div className="text-right">
												<div className="text-2xl font-bold text-[#1C4574]">{currentVotes}</div>
												<div className="text-xs text-gray-400 font-medium uppercase">Votes</div>
											</div>

											<div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedOption === party.id ? 'border-[#1C4574]' : 'border-gray-300'}`}>
												{selectedOption === party.id && <div className="w-3 h-3 bg-[#1C4574] rounded-full animate-pulse"></div>}
											</div>
										</div>
									</div>
								);
							})}
						</div>

						<div className="mt-8 flex items-center justify-between border-t pt-6 border-gray-200">
							<p className="text-xs text-gray-400 max-w-md">* This action is permanent and recorded on-chain.</p>
							<button
								onClick={handleVote}
								disabled={!selectedOption || isVoting}
								className={`px-8 py-3 rounded-md text-white font-bold shadow-lg transition-all transform
                                    ${(selectedOption && !isVoting) ? 'bg-[#1C4574] hover:bg-[#153456] cursor-pointer active:scale-95' : 'bg-gray-300 cursor-not-allowed text-gray-500'}`}
							>
								{isVoting ? 'PROCESSING...' : 'CAST VOTE'}
							</button>
						</div>
					</>
				)}
			</main>
			<footer className="text-center text-gray-400 text-xs py-8 border-t border-gray-200 mt-12">
				<p>&copy; 2025 Republic of Turkiye - Digital Voting Gateway</p>
			</footer>
		</div>
	);
}