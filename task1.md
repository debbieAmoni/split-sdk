#17 Add invoice receipt generator
Repo Avatar
Stellar-split/split-sdk
Label: complexity: high
Points: 200

Description
After an invoice is released, there is no structured way to get a payment receipt. This issue adds generateReceipt(invoiceId) that fetches the invoice and returns a typed InvoiceReceipt object with full payment breakdown, timestamps, and a unique receipt ID derived from the transaction hash.

Technical Context
Involves src/client.ts and src/types.ts. Define InvoiceReceipt = { receiptId: string; invoiceId: string; creator: string; recipients: Recipient[]; payments: Payment[]; totalAmount: bigint; releasedAt: number }. receiptId is a SHA-256 hash of invoiceId + funded + deadline.

Acceptance Criteria
 generateReceipt(invoiceId: string): Promise exported
 Throws if invoice is not Released
 receiptId is deterministic for the same invoice
 InvoiceReceipt type exported from src/index.ts
 Test generates receipt for a released invoice and verifies all fields
 All existing tests pass
 TypeScript strict mode — zero any types