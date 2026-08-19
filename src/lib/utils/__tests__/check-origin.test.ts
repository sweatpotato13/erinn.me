/** @jest-environment node */

const originalBaseUrl = process.env.BASE_URL;
process.env.BASE_URL = "http://localhost:3000";

const { checkOrigin } = jest.requireActual<
    typeof import("@/lib/utils/check-origin")
>("@/lib/utils/check-origin");

const originalVercelEnv = process.env.VERCEL_ENV;

function request(origin?: string) {
    return new Request("http://localhost:3000/api/test", {
        headers: origin ? { origin } : undefined,
    });
}

describe("origin validation", () => {
    afterAll(() => {
        if (originalBaseUrl === undefined) {
            delete process.env.BASE_URL;
        } else {
            process.env.BASE_URL = originalBaseUrl;
        }
    });

    afterEach(() => {
        if (originalVercelEnv === undefined) {
            delete process.env.VERCEL_ENV;
        } else {
            process.env.VERCEL_ENV = originalVercelEnv;
        }
    });

    it.each(["preview", "development", undefined])(
        "bypasses validation outside production: %s",
        environment => {
            if (environment === undefined) {
                delete process.env.VERCEL_ENV;
            } else {
                process.env.VERCEL_ENV = environment;
            }

            expect(checkOrigin(request())).toBeNull();
        }
    );

    it("retains origin validation in production", () => {
        process.env.VERCEL_ENV = "production";

        expect(checkOrigin(request("http://localhost:3000"))).toBeNull();
        expect(checkOrigin(request("https://example.com"))?.status).toBe(403);
    });
});
