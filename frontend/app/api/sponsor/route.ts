import { NextResponse } from 'next/server';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';

const SPONSOR_PRIVATE_KEY = process.env.SPONSOR_PRIVATE_KEY;

export async function POST(req: Request) {
	try {
		if (!SPONSOR_PRIVATE_KEY) {
			return NextResponse.json(
				{ error: 'Server configuration error: SPONSOR_PRIVATE_KEY missing' },
				{ status: 500 }
			);
		}

		const body = await req.json();
		const { transactionBytes, sender } = body;

		if (!transactionBytes || !sender) {
			return NextResponse.json({ error: 'Missing transaction data' }, { status: 400 });
		}

		const client = new SuiClient({ url: getFullnodeUrl('testnet') });
		const keypair = Ed25519Keypair.fromSecretKey(SPONSOR_PRIVATE_KEY);
		const sponsorAddress = keypair.toSuiAddress();

		const tx = Transaction.from(Buffer.from(transactionBytes, 'base64'));

		tx.setSender(sender);
		tx.setGasOwner(sponsorAddress);

		const sponsoredTxBytes = await tx.build({ client, onlyTransactionKind: false });
		const sponsorSignature = await keypair.signTransaction(sponsoredTxBytes);

		return NextResponse.json({
			sponsoredBytes: Buffer.from(sponsoredTxBytes).toString('base64'),
			sponsorSignature: sponsorSignature.signature
		});

	} catch (error: any) {
		console.error('Sponsor error:', error);
		return NextResponse.json({ error: 'Failed to sponsor transaction: ' + error.message }, { status: 500 });
	}
}