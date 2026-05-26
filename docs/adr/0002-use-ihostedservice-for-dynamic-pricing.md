# Use IHostedService for Dynamic Pricing Updates

We will use the built-in .NET `IHostedService` with `PeriodicTimer` for the background job that updates dynamic pricing, instead of adding an external library like Hangfire or Quartz.

The backend is currently a single monolith instance. Hangfire and Quartz add significant overhead in this context (requiring new database tables for state management and pulling in heavy dependencies) which is unnecessary for a simple periodic scan of the `ListingDiscountRule` table. Since we do not need distributed locking or a dashboard for this specific task, keeping the architecture simple with `IHostedService` avoids over-engineering during this early stage.
