## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Club API

The club aggregate is available through the following REST endpoints:

| Method | Route | Success |
| --- | --- | --- |
| GET | `/clubs` | `200` with an array of clubs |
| GET | `/clubs/:id` | `200` with one club |
| POST | `/clubs` | `201` with the created club |
| PATCH | `/clubs/:id` | `200` with the updated club |
| DELETE | `/clubs/:id` | `204` with no body |

Create requests use a JSON body with `name`, a required unique `email`, and `courtCount`. Update requests can change `name`, `email`, and the optional `status` (`active` or `inactive`). Emails are normalized to lowercase. Invalid input returns `400`, an unknown identifier returns `404`, and duplicate names or emails return `409`.

The OpenAPI document is available at `/docs` when the backend is running.

Club creation requires a positive `courtCount`. The backend creates the requested courts atomically and names them `campo 1`, `campo 2`, and so on. If club or court creation fails, the transaction rolls back and no partial club remains.

Application use cases declare repository dependencies explicitly with `@Inject(TOKEN)` and are registered directly as Nest providers; repository contracts use the `I` prefix, such as `IClubRepository` and `IBookingRepository`.

## Availability and Bookings

Availability is a read model calculated for a fixed interval from operational courts and active bookings. It is not stored as a calendar slot.

| Method | Route | Success |
| --- | --- | --- |
| GET | `/clubs/:clubId/availability?startsAt=...&endsAt=...` | `200` with available court IDs |
| POST | `/clubs/:clubId/bookings` | `201` with a 60-minute booking |
| GET | `/clubs/:clubId/bookings/:id` | `200` with one booking |

Create a booking with `courtId`, `startsAt`, and an optional status: `free`, `reserved`, `searching`, or `blocked`. The duration is fixed at 60 minutes and no customer entity is required yet. Active bookings cannot overlap on the same court; overlap returns `409`.

The real database integration test is opt-in:

```bash
RUN_DB_INTEGRATION_TESTS=true npm run test -- --run src/clubs/infrastructure/prisma-club-repository.integration.spec.ts
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observer](https://observer.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
