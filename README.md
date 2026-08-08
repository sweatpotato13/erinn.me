<div id="top"></div>


<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/sweatpotato13/erinn.me"></a>

<h3 align="center">Erinn.me</h3>

  <p align="center">
    A project utilizing Mabinogi's OpenAPI to proview market, horn and more
    <br />
    <a href="https://erinn.me">View Demo</a>
    ·
    <a href="https://github.com/sweatpotato13/erinn.me/issues">Report Bug</a>
    ·
    <a href="https://github.com/sweatpotato13/erinn.me/issues">Request Feature</a>
  </p>
</div>


### Screenshots

<br>
<img src="images/erinn-me.png">
<br>

### Built With

* [pnpm](https://pnpm.io)
* [Next.js](https://nextjs.org/)

<p align="right">(<a href="#top">back to top</a>)</p>


<!-- GETTING STARTED -->
## Getting Started

This is an example of how you may give instructions on setting up your project locally.
To get a local copy up and running follow these simple example steps.

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/sweatpotato13/erinn.me.git
   ```

2. Install dependencies
   ```sh
   pnpm install
   ```

3. write .env file
   ```sh
   cp .env.example .env
   nano .env
   ```

4. Start the development server
    ```sh
    pnpm dev
    ```

5. or build and start the production server
    ```sh
    pnpm build
    pnpm start
    ```

### Rate-limit deployment

The API proxy trusts only Vercel's `x-vercel-forwarded-for` header for client
identity and ignores `x-forwarded-for`. Any reverse proxy placed in front of
Vercel must strip client-supplied `x-vercel-forwarded-for` values before
forwarding requests.

Configure a single programmatic rate-limit rule in the Vercel Firewall dashboard:

| ID | Path | Limit | Window |
| --- | --- | ---: | ---: |
| `erinn-api` | `/api/*` | 120 | 60 seconds |

The rule uses `@vercel/firewall` with the ID `erinn-api`. If the rule is
missing or the WAF check fails, requests pass through (fail-open). Local
development and Vercel Preview deployments bypass WAF checks entirely.

To verify the Production WAF path before merging to `main`:

1. Add `ENABLE_PREVIEW_RATE_LIMIT=true` to the Preview environment, scoped to
   the `develop` branch, and redeploy it.
2. Request a protected API route and confirm it returns HTTP 200 with an
   `X-RateLimit-Limit: 120` header.
3. Remove `ENABLE_PREVIEW_RATE_LIMIT` after verification and redeploy
   `develop` to restore the default Preview bypass.

Never add `ENABLE_PREVIEW_RATE_LIMIT` to Production: Production always applies
the WAF regardless of this variable.

<p align="right">(<a href="#top">back to top</a>)</p>
