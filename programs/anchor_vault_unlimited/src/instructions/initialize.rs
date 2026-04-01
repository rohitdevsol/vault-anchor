use anchor_lang::prelude::*;
#[derive(Accounts)]
pub struct Initialize {}

impl Initialize {
    pub fn initialize(&mut self, program_id: Pubkey) -> Result<()> {
        msg!("Greetings from: {:?}", program_id);
        Ok(())
    }
}
