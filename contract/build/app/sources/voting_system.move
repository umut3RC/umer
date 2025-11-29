module app::voting_system {
    use std::string::String;
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

    // --- INIT (DÜZELTİLDİ: public entry kaldırıldı) ---
    fun init(ctx: &mut TxContext) {
        transfer::transfer(AdminCap {
            id: object::new(ctx)
        }, ctx.sender());
    }

    // --- TEST İÇİN YARDIMCI FONKSİYON (EKLEME) ---
    #[test_only]
    public fun test_init(ctx: &mut TxContext) {
        init(ctx);
    }

    // --- FONKSİYONLAR ---
    public entry fun create_region(
        _admin: &AdminCap, // _ ile kullanılmadığını belirttik
        name: String,
        ctx: &mut TxContext
    ) {
        let uid = object::new(ctx);                  
        let region_id = object::uid_to_inner(&uid);  

        let region = Region {
            id: uid,
            name: name,
            total_votes: 0,                         
        };

        event::emit(RegionCreated {
            region_id,
            name: region.name,
        });

        transfer::public_share_object(region);
    }

    public entry fun create_candidate(
        _admin: &AdminCap, 
        name: String,
        region: &Region,      
        ctx: &mut TxContext
    ) {
        let uid = object::new(ctx);
        let candidate_id = object::uid_to_inner(&uid);

        let candidate = Candidate {
            id: uid,
            name,
            region_id: object::uid_to_inner(&region.id), 
            vote_count: 0,                                      
        };

        event::emit(CandidateCreated {
            candidate_id,
            name: candidate.name,
            region_id: candidate.region_id,
        });

        transfer::public_share_object(candidate);
    }

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
        vote_ticket.voted_candidate_name = candidate.name; 

        event::emit(VoteCasted {
            voter_ticket_id: object::uid_to_inner(&vote_ticket.id),
            candidate_name: candidate.name,
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