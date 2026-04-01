use anchor_lang::{ prelude::*, system_program::{ Transfer, transfer } };
use crate::errors::VaultError;
#[derive(Accounts)]
pub struct VaultAction<'info> {
    // mut because we will modify the lamports during the transfer
    #[account(mut)]
    pub signer: Signer<'info>,
    // must deposit to a PDA
    #[account(
        mut, // we will be modifying its lamports
        seeds = [b"vault", signer.key().as_ref()], // this and below line -> defines how to derive a PDA from seeds
        bump
    )]
    pub vault: SystemAccount<'info>,
    // checks if the account is set to executable and the address is the System Program one
    pub system_program: Program<'info, System>,
}

impl<'info> VaultAction<'info> {
    pub fn deposit(&mut self, amount: u64) -> Result<()> {
        require_gt!(amount, Rent::get()?.minimum_balance(0), VaultError::InvalidAmount);
        // transfer the amount
        transfer(
            CpiContext::new(self.system_program.to_account_info(), Transfer {
                from: self.signer.to_account_info(),
                to: self.vault.to_account_info(),
            }),
            amount
        )?;
        Ok(())
    }
    pub fn withdraw(&mut self, bump: u8) -> Result<()> {
        require_neq!(self.vault.lamports(), 0, VaultError::InsufficientBalance);
        // get the seeds
        let signer_key = self.signer.key();
        let signer_seeds = &[b"vault", signer_key.as_ref(), &[bump]];

        let amount = self.vault.to_account_info().lamports();
        // send all the vault money

        transfer(
            CpiContext::new_with_signer(
                self.system_program.to_account_info(),
                Transfer {
                    from: self.vault.to_account_info(),
                    to: self.signer.to_account_info(),
                },
                &[signer_seeds]
            ),
            amount
        )?;
        Ok(())
    }
}
