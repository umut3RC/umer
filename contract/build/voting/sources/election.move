module voting::election {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    // Hata Kodları
    const EInvalidOption: u64 = 0;

    // Oylama Sandığı (Shared Object - Herkes erişebilir)
    struct ElectionBox has key, store {
        id: UID,
        votes_a: u64, // Parti A Oyları
        votes_b: u64, // Parti B Oyları
        votes_c: u64, // Parti C Oyları
    }

    // Modül yayınlandığında otomatik çalışan başlangıç fonksiyonu
    fun init(ctx: &mut TxContext) {
        // Sandığı oluştur
        let election = ElectionBox {
            id: object::new(ctx),
            votes_a: 0,
            votes_b: 0,
            votes_c: 0,
        };

        // Nesneyi paylaşıma aç (Böylece herkes 'cast_vote' yapabilir)
        transfer::share_object(election);
    }

    // Oy Kullanma Fonksiyonu
    public entry fun cast_vote(election: &mut ElectionBox, option: u64, _ctx: &mut TxContext) {
        // Seçeneğe göre sayacı artır
        if (option == 1) {
            election.votes_a = election.votes_a + 1;
        } else if (option == 2) {
            election.votes_b = election.votes_b + 1;
        } else if (option == 3) {
            election.votes_c = election.votes_c + 1;
        } else {
            // Geçersiz bir sayı gelirse işlem başarısız olsun (Revert)
            abort EInvalidOption
        };
    }
}