"use client"; // Bu satır çok önemli, tarayıcıda çalışacağını belirtir.

import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Ağ ayarları: Lokal, Test ve Ana ağ bağlantılarını tanımlıyoruz.
const { networkConfig } = createNetworkConfig({
	localnet: { url: getFullnodeUrl('localnet') },
	mainnet: { url: getFullnodeUrl('mainnet') },
    testnet: { url: getFullnodeUrl('testnet') },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
				<WalletProvider autoConnect>
					{children}
				</WalletProvider>
			</SuiClientProvider>
		</QueryClientProvider>
	);
}