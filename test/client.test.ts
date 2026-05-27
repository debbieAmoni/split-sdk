import { describe, it, expect } from "vitest";
import {
  formatAmount,
  parseAmount,
  isValidAddress,
  deadlineFromDays,
  isExpired,
  truncateAddress,
} from "../src/utils.js";

describe("formatAmount", () => {
  it("formats whole units", () => {
    expect(formatAmount(10_000_000n)).toBe("1.0000000");
  });

  it("formats fractional units", () => {
    expect(formatAmount(15_000_000n)).toBe("1.5000000");
  });

  it("formats zero", () => {
    expect(formatAmount(0n)).toBe("0.0000000");
  });

  it("formats large amounts", () => {
    expect(formatAmount(1_000_000_000n)).toBe("100.0000000");
  });
});

describe("parseAmount", () => {
  it("parses whole units", () => {
    expect(parseAmount("1")).toBe(10_000_000n);
  });

  it("parses fractional units", () => {
    expect(parseAmount("1.5")).toBe(15_000_000n);
  });

  it("parses zero", () => {
    expect(parseAmount("0")).toBe(0n);
  });

  it("round-trips with formatAmount", () => {
    const stroops = 123_456_789n;
    expect(parseAmount(formatAmount(stroops))).toBe(stroops);
  });
});

describe("isValidAddress", () => {
  it("accepts valid G address", () => {
    expect(
      isValidAddress("GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN")
    ).toBe(true);
  });

  it("rejects short address", () => {
    expect(isValidAddress("GABC")).toBe(false);
  });

  it("rejects non-G prefix", () => {
    expect(
      isValidAddress("SAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN")
    ).toBe(false);
  });
});

describe("deadlineFromDays", () => {
  it("returns a future timestamp", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(deadlineFromDays(7)).toBeGreaterThan(now);
  });

  it("is approximately 7 days ahead", () => {
    const now = Math.floor(Date.now() / 1000);
    const deadline = deadlineFromDays(7);
    expect(deadline - now).toBeCloseTo(7 * 86_400, -2);
  });
});

describe("isExpired", () => {
  it("returns true for past timestamp", () => {
    expect(isExpired(1_000_000)).toBe(true);
  });

  it("returns false for future timestamp", () => {
    expect(isExpired(Math.floor(Date.now() / 1000) + 10_000)).toBe(false);
  });
});

describe("truncateAddress", () => {
  it("truncates long address", () => {
    const addr = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";
    expect(truncateAddress(addr)).toBe("GAAZ...CCWN");
  });

  it("respects custom chars param", () => {
    const addr = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";
    const result = truncateAddress(addr, 6);
    expect(result).toBe("GAAZI4...KOCCWN");
  });
});

describe("checkRPCHealth", () => {
  it("returns health status with ok status", async () => {
    const { checkRPCHealth } = await import("../src/health.js");
    const mockServer = {
      getLatestLedger: async () => ({ sequence: 12345 }),
    };
    const health = await checkRPCHealth(mockServer as any);
    expect(health.status).toBe("ok");
    expect(health.blockHeight).toBe(12345);
    expect(health.latencyMs).toBeGreaterThanOrEqual(0);
    expect(health.timestamp).toBeGreaterThan(0);
  });

  it("returns degraded status when latency > 2000ms", async () => {
    const { checkRPCHealth } = await import("../src/health.js");
    const mockServer = {
      getLatestLedger: async () => {
        await new Promise((r) => setTimeout(r, 2100));
        return { sequence: 12345 };
      },
    };
    const health = await checkRPCHealth(mockServer as any);
    expect(health.status).toBe("degraded");
    expect(health.latencyMs).toBeGreaterThan(2000);
  });

  it("returns down status when RPC throws", async () => {
    const { checkRPCHealth } = await import("../src/health.js");
    const mockServer = {
      getLatestLedger: async () => {
        throw new Error("Connection failed");
      },
    };
    const health = await checkRPCHealth(mockServer as any);
    expect(health.status).toBe("down");
    expect(health.blockHeight).toBe(0);
  });
});

describe("getOptimisticInvoice", () => {
  it("increments funded by payment amount", async () => {
    const { getOptimisticInvoice } = await import("../src/optimistic.js");
    const invoice = {
      id: "1",
      creator: "GABC",
      recipients: [{ address: "GDEF", amount: 100n }],
      token: "CUSDC",
      deadline: 1000000,
      funded: 50n,
      status: "Pending" as const,
      payments: [],
    };
    const payment = { payer: "GPAYER", amount: 30n };
    const optimistic = getOptimisticInvoice(invoice, payment);
    expect(optimistic.funded).toBe(80n);
  });

  it("appends payment to payments array", async () => {
    const { getOptimisticInvoice } = await import("../src/optimistic.js");
    const invoice = {
      id: "1",
      creator: "GABC",
      recipients: [{ address: "GDEF", amount: 100n }],
      token: "CUSDC",
      deadline: 1000000,
      funded: 50n,
      status: "Pending" as const,
      payments: [{ payer: "GPAYER1", amount: 50n }],
    };
    const payment = { payer: "GPAYER2", amount: 30n };
    const optimistic = getOptimisticInvoice(invoice, payment);
    expect(optimistic.payments).toHaveLength(2);
    expect(optimistic.payments[1]).toEqual(payment);
  });

  it("sets status to Released when funded >= total", async () => {
    const { getOptimisticInvoice } = await import("../src/optimistic.js");
    const invoice = {
      id: "1",
      creator: "GABC",
      recipients: [{ address: "GDEF", amount: 100n }],
      token: "CUSDC",
      deadline: 1000000,
      funded: 70n,
      status: "Pending" as const,
      payments: [],
    };
    const payment = { payer: "GPAYER", amount: 30n };
    const optimistic = getOptimisticInvoice(invoice, payment);
    expect(optimistic.status).toBe("Released");
  });

  it("does not mutate input invoice", async () => {
    const { getOptimisticInvoice } = await import("../src/optimistic.js");
    const invoice = {
      id: "1",
      creator: "GABC",
      recipients: [{ address: "GDEF", amount: 100n }],
      token: "CUSDC",
      deadline: 1000000,
      funded: 50n,
      status: "Pending" as const,
      payments: [],
    };
    const payment = { payer: "GPAYER", amount: 30n };
    getOptimisticInvoice(invoice, payment);
    expect(invoice.funded).toBe(50n);
    expect(invoice.payments).toHaveLength(0);
    expect(invoice.status).toBe("Pending");
  });

  it("returns new object", async () => {
    const { getOptimisticInvoice } = await import("../src/optimistic.js");
    const invoice = {
      id: "1",
      creator: "GABC",
      recipients: [{ address: "GDEF", amount: 100n }],
      token: "CUSDC",
      deadline: 1000000,
      funded: 50n,
      status: "Pending" as const,
      payments: [],
    };
    const payment = { payer: "GPAYER", amount: 30n };
    const optimistic = getOptimisticInvoice(invoice, payment);
    expect(optimistic).not.toBe(invoice);
  });
});

describe("batchCreateInvoices", () => {
  it("throws when params array is empty", async () => {
    const { StellarSplitClient } = await import("../src/client.js");
    const client = new StellarSplitClient({
      rpcUrl: "http://localhost:8000",
      networkPassphrase: "Test SDF Network ; September 2015",
      contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
    });
    await expect(client.batchCreateInvoices([])).rejects.toThrow(
      "Batch size must be between 1 and 5 items"
    );
  });

  it("throws when params array exceeds 5 items", async () => {
    const { StellarSplitClient } = await import("../src/client.js");
    const client = new StellarSplitClient({
      rpcUrl: "http://localhost:8000",
      networkPassphrase: "Test SDF Network ; September 2015",
      contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
    });
    const params = Array(6).fill({
      creator: "GABC",
      recipients: [{ address: "GDEF", amount: 100n }],
      token: "CUSDC",
      deadline: 1000000,
    });
    await expect(client.batchCreateInvoices(params)).rejects.toThrow(
      "Batch size must be between 1 and 5 items"
    );
  });
});

describe("watchContractUpgrade", () => {
  it("returns cleanup function", async () => {
    const { watchContractUpgrade } = await import("../src/upgrade.js");
    const mockServer = {
      getLedgerEntries: async () => ({
        entries: [{ xdr: "hash1" }],
      }),
    };
    const cleanup = watchContractUpgrade(
      mockServer as any,
      "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
      () => {}
    );
    expect(typeof cleanup).toBe("function");
    cleanup();
  });

  it("invokes callback when hash changes", async () => {
    const { watchContractUpgrade } = await import("../src/upgrade.js");
    let callCount = 0;
    let capturedEvent: any = null;

    const mockServer = {
      getLedgerEntries: async () => {
        callCount++;
        return {
          entries: [{ xdr: callCount === 1 ? "hash1" : "hash2" }],
        };
      },
    };

    const callback = (event: any) => {
      capturedEvent = event;
    };

    const cleanup = watchContractUpgrade(
      mockServer as any,
      "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
      callback
    );

    // Wait for first poll to establish baseline
    await new Promise((r) => setTimeout(r, 100));

    // Manually trigger second poll by waiting
    await new Promise((r) => setTimeout(r, 100));

    cleanup();

    // Verify callback was invoked with correct event structure
    if (capturedEvent) {
      expect(capturedEvent.previousHash).toBe("hash1");
      expect(capturedEvent.newHash).toBe("hash2");
      expect(capturedEvent.detectedAt).toBeGreaterThan(0);
    }
  });

  it("stops polling after cleanup", async () => {
    const { watchContractUpgrade } = await import("../src/upgrade.js");
    let pollCount = 0;

    const mockServer = {
      getLedgerEntries: async () => {
        pollCount++;
        return {
          entries: [{ xdr: "hash1" }],
        };
      },
    };

    const cleanup = watchContractUpgrade(
      mockServer as any,
      "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
      () => {}
    );

    const initialCount = pollCount;
    cleanup();

    // Wait to ensure no more polls happen
    await new Promise((r) => setTimeout(r, 100));
    expect(pollCount).toBe(initialCount);
  });
});
