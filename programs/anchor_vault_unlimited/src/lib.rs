use anchor_lang::prelude::*;
pub mod errors;
pub mod instructions;
pub use instructions::*;
declare_id!("22222222222222222222222222222222222222222222");

#[program]
pub mod anchor_vault_unlimited {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.initialize(*ctx.program_id)
    }
    pub fn deposit(ctx: Context<VaultAction>, amount: u64) -> Result<()> {
        ctx.accounts.deposit(amount)
    }
    pub fn withdraw(ctx: Context<VaultAction>) -> Result<()> {
        let bump = ctx.bumps.vault;
        ctx.accounts.withdraw(bump)
    }
}
