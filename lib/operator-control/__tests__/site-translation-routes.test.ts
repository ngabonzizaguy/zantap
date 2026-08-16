import { beforeEach, describe, expect, it } from "vitest";
import {
  DELETE,
  GET,
  PATCH,
} from "@/app/api/operator/v1/site-translations/route";
import { createInMemoryStore } from "@/lib/store/in-memory";

const globalForStore = globalThis as unknown as {
  __zantapStore?: ReturnType<typeof createInMemoryStore>;
};

function operatorRequest(url: string, init?: RequestInit): Request {
  return new Request(url, {
    ...init,
    headers: {
      Authorization: "Bearer operator-test-key",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

describe("operator site translation routes", () => {
  beforeEach(() => {
    process.env.OPERATOR_API_KEY = "operator-test-key";
    globalForStore.__zantapStore = createInMemoryStore();
  });

  it("guards and completes translation CRUD", async () => {
    const unauthorized = await GET(
      new Request("http://localhost/api/operator/v1/site-translations")
    );
    expect(unauthorized.status).toBe(401);

    const patch = await PATCH(
      operatorRequest("http://localhost/api/operator/v1/site-translations", {
        method: "PATCH",
        body: JSON.stringify({
          locale: "fr",
          key: "leadForm.submit",
          value: "Envoyer",
        }),
      })
    );
    expect(patch.status).toBe(200);

    const list = await GET(
      operatorRequest(
        "http://localhost/api/operator/v1/site-translations?locale=fr"
      )
    );
    expect(await list.json()).toEqual({
      translations: [
        expect.objectContaining({
          locale: "fr",
          key: "leadForm.submit",
          value: "Envoyer",
        }),
      ],
    });

    const remove = await DELETE(
      operatorRequest("http://localhost/api/operator/v1/site-translations", {
        method: "DELETE",
        body: JSON.stringify({ locale: "fr", key: "leadForm.submit" }),
      })
    );
    expect(remove.status).toBe(200);
    expect(await remove.json()).toEqual({ deleted: true });
  });
});
