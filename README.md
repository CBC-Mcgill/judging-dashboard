# CBC McGill's Judging Dashboard

Simple, customizable, collaborative hackathon dashboards.

## Getting Started

Head to the link below to access the application

```
judging.claudebuildersmcgill.ca
```

1. **Sign in** or **Create Account** using your full name, email, and password.
2. Create your first dashboard with the **New Dashboard** button.
    - Configure the dashboard to your hackathon specifications.
    - Hackathon structure: Scoring criteria, Tracks, Subchallenges (Sponsor Tracks)
3. Add staff in the **Collaborators** tab, they have admin access to everything except the hackathon structure.
    - Add via account whitelist by email.
4. Invite judges in the **Judges** tab to score teams.
    - Invite via link or whitelist by email.
5. Scores are aggregated and can be viewed in the **Rankings** tab or by team in the **Team Detail** tab.


## Judging

As a judge you will see the dashboard differently from staff and admins.

1. Judges have their own onboarding page with details on how to score each team.
2. Judges can only enter scores according to the dashboard's specifications.

## Running Locally and Development

First, create an `.env.local` file and fill out the values with your db credentials:

```bash
cp .env.local.example .env.local
```

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.
