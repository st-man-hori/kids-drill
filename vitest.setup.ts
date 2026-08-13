import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// vitestはRTLのグローバルafterEach自動登録に依存しないため、明示的にクリーンアップする
afterEach(() => {
  cleanup();
});
