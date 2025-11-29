"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	// Form State
	const [formData, setFormData] = useState({
		identityNumber: '',
		firstName: '',
		lastName: '',
		age: '',
		city: '',
		district: '',
		neighborhood: '',
		address: '',
		password: '',
		confirmPassword: ''
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setSuccess('');

		// Basic Validations
		if (formData.password !== formData.confirmPassword) {
			setError("Passwords do not match.");
			return;
		}
		if (formData.identityNumber.length !== 11) {
			setError("TR Identity Number must be 11 digits.");
			return;
		}
		if (parseInt(formData.age) < 18) {
			setError("You must be 18 or older to register.");
			return;
		}

		setIsLoading(true);

		try {
			// Send Request to Backend API
			const res = await fetch('http://localhost:3001/api/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					identityNumber: formData.identityNumber,
					firstName: formData.firstName,
					lastName: formData.lastName,
					age: parseInt(formData.age),
					city: formData.city,
					district: formData.district,
					neighborhood: formData.neighborhood,
					address: formData.address, // backend expects 'address' for full address
					password: formData.password
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || 'Registration failed');
			}

			setSuccess("Registration successful! Redirecting to login...");

			// Redirect to login after a short delay
			setTimeout(() => {
				router.push('/login');
			}, 2000);

		} catch (err: any) {
			console.error("Register Error:", err);
			setError(err.message || "An unexpected error occurred.");
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center font-sans text-gray-800 p-4 py-12">

			<div className="w-full max-w-[600px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">

				{/* Panel Header */}
				<div className="bg-white p-8 pb-4 text-center border-b border-gray-100">
					<div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm ring-4 ring-red-50">
						<span className="text-white font-bold text-xl tracking-wider">TR</span>
					</div>
					<h1 className="text-2xl font-bold text-[#1C4574]">e-Government Gateway</h1>
					<p className="text-gray-500 text-sm mt-1">Citizen Registration Form</p>
				</div>

				{/* Register Form */}
				<form onSubmit={handleRegister} className="p-8 pt-6 space-y-6">

					{/* Messages */}
					{error && (
						<div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
							{error}
						</div>
					)}
					{success && (
						<div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg border border-green-100">
							{success}
						</div>
					)}

					{/* Personal Information Section */}
					<div className="space-y-4">
						<h3 className="text-sm font-bold text-[#1C4574] uppercase tracking-wide border-b pb-2">Personal Information</h3>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1">
								<label className="text-xs font-semibold text-gray-600">First Name</label>
								<input name="firstName" required className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#1C4574] outline-none" onChange={handleChange} />
							</div>
							<div className="space-y-1">
								<label className="text-xs font-semibold text-gray-600">Last Name</label>
								<input name="lastName" required className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#1C4574] outline-none" onChange={handleChange} />
							</div>
						</div>

						<div className="grid grid-cols-3 gap-4">
							<div className="col-span-2 space-y-1">
								<label className="text-xs font-semibold text-gray-600">TR Identity Number</label>
								<input name="identityNumber" required maxLength={11} className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#1C4574] outline-none font-mono" onChange={handleChange} placeholder="11 digits" />
							</div>
							<div className="space-y-1">
								<label className="text-xs font-semibold text-gray-600">Age</label>
								<input name="age" type="number" required min="18" className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#1C4574] outline-none" onChange={handleChange} />
							</div>
						</div>
					</div>

					{/* Address Information Section */}
					<div className="space-y-4">
						<h3 className="text-sm font-bold text-[#1C4574] uppercase tracking-wide border-b pb-2 pt-2">Address Details</h3>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1">
								<label className="text-xs font-semibold text-gray-600">City</label>
								<input name="city" required className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#1C4574] outline-none" onChange={handleChange} />
							</div>
							<div className="space-y-1">
								<label className="text-xs font-semibold text-gray-600">District</label>
								<input name="district" required className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#1C4574] outline-none" onChange={handleChange} />
							</div>
						</div>

						<div className="space-y-1">
							<label className="text-xs font-semibold text-gray-600">Neighborhood</label>
							<input name="neighborhood" required className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#1C4574] outline-none" onChange={handleChange} />
						</div>

						<div className="space-y-1">
							<label className="text-xs font-semibold text-gray-600">Full Address</label>
							<textarea name="address" required rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#1C4574] outline-none resize-none" onChange={handleChange} />
						</div>
					</div>

					{/* Security Section */}
					<div className="space-y-4">
						<h3 className="text-sm font-bold text-[#1C4574] uppercase tracking-wide border-b pb-2 pt-2">Security</h3>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1">
								<label className="text-xs font-semibold text-gray-600">Password</label>
								<input name="password" type="password" required className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#1C4574] outline-none" onChange={handleChange} />
							</div>
							<div className="space-y-1">
								<label className="text-xs font-semibold text-gray-600">Confirm Password</label>
								<input name="confirmPassword" type="password" required className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#1C4574] outline-none" onChange={handleChange} />
							</div>
						</div>
					</div>

					{/* Actions */}
					<div className="pt-4 space-y-3">
						<button
							type="submit"
							disabled={isLoading}
							className={`w-full py-3.5 px-6 rounded-lg text-white font-bold shadow-md transition-all duration-200 
                ${isLoading
									? 'bg-gray-400 cursor-not-allowed'
									: 'bg-[#1C4574] hover:bg-[#153456] hover:shadow-lg active:scale-[0.98]'
								}`}
						>
							{isLoading ? 'Creating Account...' : 'Complete Registration'}
						</button>

						<div className="text-center pt-2">
							<span className="text-sm text-gray-500">Already have an account? </span>
							<button
								type="button"
								onClick={() => router.push('/login')}
								className="text-sm font-bold text-[#1C4574] hover:underline"
							>
								Log In
							</button>
						</div>
					</div>

				</form>
			</div>

			<p className="mt-8 text-center text-xs text-gray-400">
				© 2025 Digital Transformation Office. All rights reserved.
			</p>

		</div>
	);
}