#[test_only]
module app::voting_tests {
    use sui::test_scenario::{Self as ts};
    use std::string;
    
    // Ana modülü import ediyoruz
    use app::voting_system::{Self, AdminCap, Party, CitizenVote};

    #[test]
    fun test_voting_lifecycle() {
        let admin = @0xA;
        let voter = @0xB;

        // 1. BAŞLANGIÇ
        let mut scenario = ts::begin(admin);
        {
            let ctx = ts::ctx(&mut scenario);
            // Ana dosyadaki test yardımcısını kullanarak init'i çağırıyoruz
            voting_system::init_for_testing(ctx);
        };

        // 2. PARTİ OLUŞTURMA (Admin)
        ts::next_tx(&mut scenario, admin);
        {
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            
            voting_system::create_party(&admin_cap, string::utf8(b"Gelecek Partisi"), ctx);

            ts::return_to_sender(&scenario, admin_cap);
        };

        // 3. SEÇMEN KAYDI (Admin)
        ts::next_tx(&mut scenario, admin);
        {
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
            let ctx = ts::ctx(&mut scenario);

            voting_system::register_voter(&admin_cap, voter, b"TC99999", ctx);

            ts::return_to_sender(&scenario, admin_cap);
        };

        // 4. OY KULLANMA (Vatandaş)
        ts::next_tx(&mut scenario, voter);
        {
            let mut vote_ticket = ts::take_from_address<CitizenVote>(&scenario, voter);
            let mut party = ts::take_shared<Party>(&scenario);
            let ctx = ts::ctx(&mut scenario);

            // Başlangıç kontrolü
            assert!(voting_system::get_party_votes(&party) == 0, 0);

            // Oy ver
            voting_system::cast_vote(&mut vote_ticket, &mut party, ctx);

            // Sonuç kontrolü
            assert!(voting_system::has_voted(&vote_ticket), 1);
            assert!(voting_system::get_party_votes(&party) == 1, 2);

            ts::return_to_address(voter, vote_ticket);
            ts::return_shared(party);
        };

        // 5. MÜKERRER OY DENEMESİ (Vatandaş - Hata Beklenir mi?)
        // Bu adımda sadece durum kontrolü yapıyoruz, assert ile sistemin voted olduğunu doğruluyoruz.
        ts::next_tx(&mut scenario, voter);
        {
            let vote_ticket = ts::take_from_address<CitizenVote>(&scenario, voter);
            assert!(voting_system::has_voted(&vote_ticket), 3);
            ts::return_to_address(voter, vote_ticket);
        };

        ts::end(scenario);
    }
}