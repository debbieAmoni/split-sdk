import { describe, it, expect } from "vitest";
import { getProofModule, getExportModule } from "../src/index.js";

describe("lazy loading", () => {
  it("resolves proof module and exposes generatePaymentProof", async () => {
    const mod = await getProofModule();
    expect(typeof mod.generatePaymentProof).toBe("function");
  });

  it("resolves export module and exposes exportInvoice", async () => {
    const mod = await getExportModule();
    expect(typeof mod.exportInvoice).toBe("function");
  });
});
