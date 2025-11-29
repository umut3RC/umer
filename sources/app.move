module app::voting_system {
    use std::string::String;
    use sui::event;
    
    // kod ve açıklama satırları ingilice olmalı 
    // sunumda ingilizce kullanılıyor olmalı
    // NOT: Move 2024'te 'object', 'transfer', 'tx_context' otomatik import edilir.

    // --- HATA KODLARI ---
    const E_ALREADY_VOTED: u64 = 0;

    // --- YAPILAR (STRUCTS) ---

    public struct AdminCap has key {
        id: UID
    }

    public struct Party has key, store {
        id: UID,
        name: String,
        vote_count: u64,
    }

    public struct CitizenVote has key, store {
        id: UID,
        citizen_id: vector<u8>, 
        voted: bool,            
        voted_party_name: String 
    }

    // --- OLAYLAR (EVENTS) ---
    
    public struct PartyCreated has copy, drop {
        party_id: ID,
        name: String,
    }

    public struct VoteCasted has copy, drop {
        voter_ticket_id: ID,
        party_name: String,
    }

    // --- FONKSİYONLAR ---

    // Modül yüklendiğinde çalışır (AdminCap oluşturur)
    fun init(ctx: &mut TxContext) {
        transfer::transfer(AdminCap {
            id: object::new(ctx)
        }, ctx.sender());
    }

    // [TEST İÇİN ÖZEL FONKSİYON]
    // Test dosyasının 'init' fonksiyonunu tetikleyebilmesi için gereklidir.
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }

    public fun create_party(
        _: &AdminCap, 
        name: String, 
        ctx: &mut TxContext
    ) {
        let uid = object::new(ctx);
        let party_id = object::uid_to_inner(&uid);

        let party = Party {
            id: uid,
            name: name,
            vote_count: 0,
        };

        event::emit(PartyCreated {
            party_id,
            name: party.name, 
        });

        transfer::share_object(party);
    }

    public fun register_voter(
        _: &AdminCap,
        recipient: address,
        citizen_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        let vote_ticket = CitizenVote {
            id: object::new(ctx),
            citizen_id,
            voted: false,
            voted_party_name: std::string::utf8(b"") 
        };

        transfer::transfer(vote_ticket, recipient);
    }

    public fun cast_vote(
        vote_ticket: &mut CitizenVote,
        party: &mut Party,
        _ctx: &mut TxContext
    ) {
        assert!(vote_ticket.voted == false, E_ALREADY_VOTED);

        party.vote_count = party.vote_count + 1;
        vote_ticket.voted = true;
        vote_ticket.voted_party_name = party.name; 

        event::emit(VoteCasted {
            voter_ticket_id: object::uid_to_inner(&vote_ticket.id),
            party_name: party.name,
        });
    }

    // --- OKUMA FONKSİYONLARI ---

    public fun get_party_votes(party: &Party): u64 {
        party.vote_count
    }

    public fun has_voted(ticket: &CitizenVote): bool {
        ticket.voted
    }
}