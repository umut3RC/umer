#[test_only]
module app::app_tests {
    use sui::test_scenario;
    use std::string;
    use app::voting_system::{Self, AdminCap, Region, Candidate, CitizenVote};

    // -----------------------------------------------------------------------
    // TEST 1: Sadece Bölge (Region) Oluşturma Testi
    // Amacı: Adminin başarıyla bir bölge oluşturup oluşturamadığını kontrol etmek.
    // -----------------------------------------------------------------------
    #[test]
    fun test_create_region() {
        let admin = @0xAD;
        let mut scenario = test_scenario::begin(admin);

        // 1. Başlangıç (AdminCap oluşturulur)
        {
            voting_system::test_init(test_scenario::ctx(&mut scenario));
        };

        // 2. Admin bölgeyi oluşturur
        test_scenario::next_tx(&mut scenario, admin);
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            voting_system::create_region(
                &admin_cap, 
                string::utf8(b"Istanbul"), 
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_to_sender(&scenario, admin_cap);
        };

        // 3. KONTROL: Bölge gerçekten oluştu mu?
        test_scenario::next_tx(&mut scenario, admin);
        {
            // take_shared, eğer obje herkese açıksa (shared) çalışır.
            // Eğer bölge oluşmadıysa bu satır hata verir.
            let region = test_scenario::take_shared<Region>(&scenario);
            
            // Bölge isminin doğru olup olmadığını kontrol et (Opsiyonel ama iyi bir pratik)
            // Not: Bunun için Region struct'ına getter yazmak gerekir, şimdilik sadece varlığını test ediyoruz.
            
            test_scenario::return_shared(region);
        };

        test_scenario::end(scenario);
    }

    // -----------------------------------------------------------------------
    // TEST 2: Aday (Candidate) Oluşturma Testi
    // Amacı: Bir bölgeye aday eklenebiliyor mu kontrol etmek.
    // Not: Aday eklemek için önce Bölge olması gerektiğinden, bu testte de bölge oluşturuyoruz.
    // -----------------------------------------------------------------------
    #[test]
    fun test_create_candidate() {
        let admin = @0xAD;
        let mut scenario = test_scenario::begin(admin);

        // 1. Kurulum (Init + Bölge Oluşturma)
        {
            voting_system::test_init(test_scenario::ctx(&mut scenario));
        };
        test_scenario::next_tx(&mut scenario, admin);
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            voting_system::create_region(&admin_cap, string::utf8(b"Ankara"), test_scenario::ctx(&mut scenario));
            test_scenario::return_to_sender(&scenario, admin_cap);
        };

        // 2. Aday Oluşturma İşlemi
        test_scenario::next_tx(&mut scenario, admin);
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let region = test_scenario::take_shared<Region>(&scenario); // Bölgeyi al

            voting_system::create_candidate(
                &admin_cap,
                string::utf8(b"Mansur"),
                &region,
                test_scenario::ctx(&mut scenario)
            );

            test_scenario::return_to_sender(&scenario, admin_cap);
            test_scenario::return_shared(region);
        };

        // 3. KONTROL: Aday oluştu mu?
        test_scenario::next_tx(&mut scenario, admin);
        {
            // Aday shared object olduğu için buradan çekip kontrol ediyoruz
            let candidate = test_scenario::take_shared<Candidate>(&scenario);
            
            // Henüz oy almadığını teyit edelim
            assert!(voting_system::get_candidate_votes(&candidate) == 0, 0);

            test_scenario::return_shared(candidate);
        };

        test_scenario::end(scenario);
    }

    // -----------------------------------------------------------------------
    // TEST 3: Seçmen Kaydı ve Oy Verme Testi (Tam Akış)
    // Amacı: Bir seçmenin kaydedilip oy kullanabildiğini ve oyların arttığını doğrulamak.
    // -----------------------------------------------------------------------
    #[test]
    fun test_cast_vote() {
        let admin = @0xAD;
        let voter1 = @0xB0B; // Seçmen adresi
        let mut scenario = test_scenario::begin(admin);

        // --- HAZIRLIK AŞAMASI (Init + Bölge + Aday) ---
        {
            voting_system::test_init(test_scenario::ctx(&mut scenario));
        };
        // Bölge Ekle
        test_scenario::next_tx(&mut scenario, admin);
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            voting_system::create_region(&admin_cap, string::utf8(b"Izmir"), test_scenario::ctx(&mut scenario));
            test_scenario::return_to_sender(&scenario, admin_cap);
        };
        // Aday Ekle
        test_scenario::next_tx(&mut scenario, admin);
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let region = test_scenario::take_shared<Region>(&scenario);
            voting_system::create_candidate(&admin_cap, string::utf8(b"Efe"), &region, test_scenario::ctx(&mut scenario));
            test_scenario::return_to_sender(&scenario, admin_cap);
            test_scenario::return_shared(region);
        };

        // --- SEÇMEN KAYDI AŞAMASI ---
        test_scenario::next_tx(&mut scenario, admin);
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            // Voter1 adresine oy pusulası gönderiyoruz
            voting_system::register_voter(
                &admin_cap,
                voter1, 
                b"TC12345", 
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_to_sender(&scenario, admin_cap);
        };

        // --- OY KULLANMA AŞAMASI ---
        // Burada senaryoyu "voter1" adına çeviriyoruz
        test_scenario::next_tx(&mut scenario, voter1);
        {
            // Seçmen kendi pusulasını (Owned Object) alır
            let mut vote_ticket = test_scenario::take_from_sender<CitizenVote>(&scenario);
            // Ortadaki bölge ve adayı (Shared Objects) alır
            let mut region = test_scenario::take_shared<Region>(&scenario);
            let mut candidate = test_scenario::take_shared<Candidate>(&scenario);

            // Oy kullanır
            voting_system::cast_vote(
                &mut vote_ticket,
                &mut candidate,
                &mut region,
                test_scenario::ctx(&mut scenario)
            );

            // --- SONUÇ KONTROLLERİ ---
            // 1. Pusula "kullanıldı" olarak işaretlendi mi?
            assert!(voting_system::has_voted(&vote_ticket), 1);
            
            // 2. Adayın oyu 1 arttı mı?
            assert!(voting_system::get_candidate_votes(&candidate) == 1, 2);
            
            // 3. Bölgenin toplam oyu 1 arttı mı?
            assert!(voting_system::get_region_votes(&region) == 1, 3);

            // Aldığımız her şeyi geri bırakmalıyız
            test_scenario::return_to_sender(&scenario, vote_ticket);
            test_scenario::return_shared(region);
            test_scenario::return_shared(candidate);
        };

        test_scenario::end(scenario);
    }
}
