# SystemDesign Academy AI

An interview preparation workspace for learning system design, building architecture diagrams, practicing timed interviews, and revising a design after feedback.

## Run the application

### Browser workspace

Use Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). This mode includes four learning paths, ten lessons with quizzes, 104 Practice Hub problems with worked answers, three projects, a curriculum tutor, and browser-local progress and exports. Practice feedback highlights coverage of case-specific concepts and suggests a retry constraint.

`npm run build` writes a static deployment to `out/`. The hosted preview uses this mode.

### Account and subscription workspace

Use Docker Compose to run the Next.js frontend, Spring Boot API, and PostgreSQL together.

```sh
cp .env.example .env
docker compose up --build
```

Open [http://localhost:8080](http://localhost:8080). Create an account in **Workspace settings** and select **Sync workspace** to back up your progress. A second browser can sign in and load that copy. Changes are saved locally as you work. Syncing checks the cloud revision to protect against overwriting newer work.

- To enable the AI tutor, set `OPENAI_API_KEY` and optionally `OPENAI_MODEL`. The server sends the question and curriculum context to OpenAI. Free accounts get five requests per calendar month UTC and Pro accounts get 25.
- To enable checkout, set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET`. Start with a recurring Stripe test price, configure the customer portal, and direct the following events to `/api/billing/webhook`. `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`. Set `ACADEMY_ORIGIN` to the exact origin used for checkout return URLs.
- For an internet-facing installation, put the app behind HTTPS, set `ACADEMY_SECURE_COOKIE=true`, set a unique database password, and configure origin and request limits in the reverse proxy. Keep secrets in runtime configuration. Back up and restore-test PostgreSQL before taking paid subscriptions.

The self-hosted MVP uses email and password accounts, explicit cloud sync, and curriculum-based practice coverage feedback. The phased specification describes additional capabilities such as OAuth and calibrated automated scoring.

## Product and curriculum

| Document | What it covers |
| --- | --- |
| [Market research](docs/market-research.md) | Competitors, learner personas, positioning, and pilot experiments |
| [Curriculum](docs/curriculum.md) | Thirteen planned modules, four playlists, and progression from beginner to staff |
| [MVP specification](docs/mvp.md) | Acceptance criteria, production architecture, and delivery phases |
| [Research and Product Architect](agent/research-product-architect.md) | ChatGPT Business workspace agent instructions |
| [Sample lesson](content/lessons/idempotent-retries.md) and [sample project](content/projects/workshop-seat-reservations.md) | Original long-form content for technical review |
