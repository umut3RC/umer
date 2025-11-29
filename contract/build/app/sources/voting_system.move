module app::voting_system {
    use std::string::{Self, String}; // String modülünü ekledik
    use sui::event;
    use sui::transfer;
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};

    // --- HATA KODLARI ---
    const E_ALREADY_VOTED: u64 = 0;

    // --- YAPILAR (STRUCTS) ---
    public struct AdminCap has key {
        id: UID
    }

    public struct Region has key, store {
        id: UID,               
        name: String,          
        total_votes: u64,      
    }

    public struct Candidate has key, store {
        id: UID,               
        name: String,          
        region_id: ID,         
        vote_count: u64,       
    }

    public struct CitizenVote has key, store {
        id: UID,               
        citizen_id: vector<u8>, 
        voted: bool,           
        voted_candidate_name: String, 
    }

    // --- OLAYLAR (EVENTS) ---
    public struct RegionCreated has copy, drop {
        region_id: ID,         
        name: String,          
    }

    public struct CandidateCreated has copy, drop {
        candidate_id: ID,      
        name: String,          
        region_id: ID,         
    }

    public struct VoteCasted has copy, drop {
        voter_ticket_id: ID,   
        candidate_name: String, 
        region_id: ID,          
    }

    // --- INIT ---
    fun init(ctx: &mut TxContext) {
        transfer::transfer(AdminCap {
            id: object::new(ctx)
        }, ctx.sender());
    }

    #[test_only]
    public fun test_init(ctx: &mut TxContext) {
        init(ctx);
    }

    // --- FONKSİYONLAR ---

    // 1. BÖLGE OLUŞTURMA (DÜZELTİLDİ)
    public entry fun create_region(
        _admin: &AdminCap,
        name: String,
        ctx: &mut TxContext
    ) {
        let uid = object::new(ctx);                  
        let region_id = object::uid_to_inner(&uid);  

        // KRİTİK DÜZELTME: İsmin kopyasını alıyoruz (Move Ownership kuralı)
        // Çünkü aşağıda 'name' değişkenini struct içine koyunca o değişken ölüyor.
        let name_bytes = *string::bytes(&name);

        let region = Region {
            id: uid,
            name: name, // Orijinal isim burada kullanıldı (Moved/Tüketildi)
            total_votes: 0,                         
        };

        event::emit(RegionCreated {
            region_id,
            name: string::utf8(name_bytes), // Kopya isim burada kullanıldı
        });

        transfer::public_share_object(region);
    }

    // 2. ADAY OLUŞTURMA (DÜZELTİLDİ)
    public entry fun create_candidate(
        _admin: &AdminCap, 
        name: String,
        region: &Region,      
        ctx: &mut TxContext
    ) {
        let uid = object::new(ctx);
        let candidate_id = object::uid_to_inner(&uid);

        // İsmin kopyasını al
        let name_bytes = *string::bytes(&name);

        let candidate = Candidate {
            id: uid,
            name, // 'name' tüketildi
            region_id: object::uid_to_inner(&region.id), 
            vote_count: 0,                                      
        };

        event::emit(CandidateCreated {
            candidate_id,
            name: string::utf8(name_bytes),
            region_id: candidate.region_id,
        });

        transfer::public_share_object(candidate);
    }

    // 3. SEÇMEN KAYDI
    public entry fun register_voter(
        _admin: &AdminCap,
        recipient: address,
        citizen_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        let vote_ticket = CitizenVote {
            id: object::new(ctx),
            citizen_id,
            voted: false,
            voted_candidate_name: std::string::utf8(b"") 
        };

        transfer::public_transfer(vote_ticket, recipient);
    }

    // 4. OY KULLANMA (DÜZELTİLDİ)
    public entry fun cast_vote(
        vote_ticket: &mut CitizenVote,
        candidate: &mut Candidate,
        region: &mut Region,
        _ctx: &mut TxContext
    ) {
        assert!(vote_ticket.voted == false, E_ALREADY_VOTED);

        candidate.vote_count = candidate.vote_count + 1;
        region.total_votes = region.total_votes + 1;

        vote_ticket.voted = true;
        
        // Aday isminin kopyasını alıp bilete yazıyoruz
        let candidate_name_bytes = *string::bytes(&candidate.name);
        vote_ticket.voted_candidate_name = string::utf8(candidate_name_bytes); 

        // Event için bir kopya daha oluşturup kullanıyoruz (veya aynısını kullanabiliriz)
        event::emit(VoteCasted {
            voter_ticket_id: object::uid_to_inner(&vote_ticket.id),
            candidate_name: string::utf8(candidate_name_bytes),
            region_id: object::uid_to_inner(&region.id),
        });
    }

    // --- OKUMA FONKSİYONLARI ---
    public fun get_candidate_votes(candidate: &Candidate): u64 {
        candidate.vote_count
    }

    public fun get_region_votes(region: &Region): u64 {
        region.total_votes
    }

    public fun has_voted(ticket: &CitizenVote): bool {
        ticket.voted
    }
}