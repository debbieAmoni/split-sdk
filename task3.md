#11 Implement automatic transaction fee bumping
Repo Avatar
Stellar-split/split-sdk
Label: complexity: high
Points: 200

Description
Transactions with low fees can get stuck in the Stellar mempool during congestion. This issue adds automatic fee bumping — if a submitted transaction is not confirmed within a timeout, the SDK wraps it in a fee-bump transaction with a higher fee and resubmits automatically.

Technical Context
Involves src/client.ts _submitTx. After the polling loop times out, use TransactionBuilder.buildFeeBumpTransaction() from @stellar/stellar-sdk with a 2x fee multiplier and resubmit. Add feeBumpMultiplier?: number to StellarSplitClientConfig.

Acceptance Criteria
 Fee bump triggered when transaction not confirmed after 30 seconds
 Bumped fee is original * feeBumpMultiplier (default 2)
 feeBumpMultiplier configurable in StellarSplitClientConfig
 Returns txHash of the fee-bump transaction on success
 Test mocks a stuck transaction and verifies fee bump is submitted
 All existing tests pass
 TypeScript strict mode — zero any types