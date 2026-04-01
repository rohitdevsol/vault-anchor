use anchor_lang::prelude::*;
#[error_code]
pub enum VaultError {
    #[msg("Zero balance")]
    ZeroBalance,

    #[msg("Invalid amount")]
    InvalidAmount,

    #[msg("Insufficient Balance")]
    InsufficientBalance,
}
