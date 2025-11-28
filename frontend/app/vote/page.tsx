// src/app/vote/page.tsx
"use client";

import React, { useState } from 'react';

export default function VotePage() {
  // Seçilen adayı tutan state (Henüz Sui'ye bağlı değil)
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Örnek Oylama Verileri
  const candidates = [
    { id: 1, name: "Kütüphane 24 Saat Açık Olsun", description: "Vize ve final haftalarında kesintisiz hizmet." },
    { id: 2, name: "Yemekhane Menüsü İyileştirilsin", description: "Daha fazla vegan ve vejetaryen seçenek." },
    { id: 3, name: "Kampüs İçi Ring Seferleri Artsın", description: "Her 15 dakikada bir ring servisi." },
  ];

  const handleVote = () => {
    if (selectedOption) {
      alert(`Seçim ID: ${selectedOption} için oy verme işlemi başlatılıyor... (Sui Cüzdanı Açılacak)`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans">
      
      {/* --- E-DEVLET BENZERİ HEADER --- */}
      {/* Gerçek e-devlet mavisine yakın renk: #163a69 veya #1C4574 */}
      <header className="bg-[#1C4574] h-16 flex items-center justify-between px-4 md:px-12 shadow-md fixed w-full top-0 z-50">
        <div className="flex items-center gap-2 text-white">
          {/* Basit Logo Temsili */}
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center border-2 border-white">
            <span className="text-white text-xs">TEST</span>
          </div>
          <h1 className="font-bold text-lg tracking-wide hidden sm:block">Dijital Oylama Kapısı</h1>
        </div>

        {/* Sağ Üst Giriş Alanı */}
        <div className="flex items-center gap-4">
            <div className="text-white text-sm hidden md:block">
                Hoşgeldiniz, <span className="font-bold">Öğrenci</span>
            </div>
            <button className="bg-transparent border border-white text-white px-4 py-1 rounded text-sm hover:bg-white hover:text-[#1C4574] transition">
                Çıkış Yap
            </button>
        </div>
      </header>

      {/* --- ANA İÇERİK --- */}
      <main className="pt-24 pb-12 px-4 md:px-12 max-w-5xl mx-auto">
        
        {/* Başlık ve Açıklama Kartı */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h2 className="text-2xl font-semibold text-[#1C4574] mb-2">Aktif Oylamalar</h2>
          <p className="text-gray-600">
            Aşağıdaki listeden desteklemek istediğiniz öneriyi seçerek blokzincir üzerinde şeffaf bir şekilde oyunuzu kullanabilirsiniz.
          </p>
        </div>

        {/* Oylama Listesi */}
        <div className="space-y-4">
          {candidates.map((candidate) => (
            <div 
              key={candidate.id}
              onClick={() => setSelectedOption(candidate.id)}
              className={`p-6 rounded-lg border cursor-pointer transition-all flex items-center justify-between bg-white
                ${selectedOption === candidate.id 
                  ? 'border-[#1C4574] ring-2 ring-[#1C4574] ring-opacity-20 shadow-md' 
                  : 'border-gray-200 hover:border-gray-400'
                }`}
            >
              <div>
                <h3 className="text-lg font-bold text-gray-800">{candidate.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{candidate.description}</p>
              </div>

              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                ${selectedOption === candidate.id ? 'border-[#1C4574]' : 'border-gray-300'}`}>
                {selectedOption === candidate.id && (
                  <div className="w-3 h-3 bg-[#1C4574] rounded-full"></div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Oy Ver Butonu */}
        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleVote}
            disabled={!selectedOption}
            className={`px-8 py-3 rounded-md text-white font-semibold shadow-lg transition-all
              ${selectedOption 
                ? 'bg-[#1C4574] hover:bg-[#153456] cursor-pointer' 
                : 'bg-gray-400 cursor-not-allowed'}`}
          >
            OYU GÖNDER
          </button>
        </div>

      </main>

      {/* --- FOOTER --- */}
      <footer className="text-center text-gray-400 text-sm py-8">
        &copy; 2025 Sui Blockchain Tabanlı Öğrenci Oylama Sistemi
      </footer>
    </div>
  );
}