# University Timetable Scheduler

A modern, interactive timetable scheduler built with Astro, React, and Tailwind CSS. Design your semester schedule with ease and sync it directly to Google Calendar.

## 🌟 Features

- **Interactive Grid**: Drag-and-drop interface to create and edit lessons intuitively.
- **Multi-University Support**: Pre-configured class periods for NCKU (National Cheng Kung University) and NYCU (National Yang Ming Chiao Tung University).
- **Google Calendar Sync**: One-click export to Google Calendar to keep your schedule organized.
- **ICS Export**: Download `.ics` files for compatibility with other calendar apps (Apple Calendar, Outlook).
- **Responsive Design**: Built with Tailwind CSS and DaisyUI for a clean, modern look on any device.
- **Dark/Light Mode**: (Coming soon/Supported by DaisyUI themes).

## 🚀 Getting Started

### Prerequisites

- Node.js v25+
- pnpm (preferred)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/timetable.git
    cd timetable
    ```
2.  Install dependencies:
    ```bash
    pnpm install
    ```

### Configuration

To enable Google Calendar integration locally, you need to set up OAuth credentials.

1.  Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
2.  Enable the **Google Calendar API**.
3.  Create OAuth 2.0 credentials (Client ID and Secret).
4.  Set the authorized redirect URI to `http://localhost:4321/api/auth/callback`.
5.  Create a `.dev.vars` file in the root directory:

    ```env
    GOOGLE_CLIENT_ID=your-client-id
    GOOGLE_CLIENT_SECRET=your-client-secret
    GOOGLE_REDIRECT_URI=http://localhost:4321/api/auth/callback
    ```

### Running Locally

Start the development server:

```bash
pnpm dev
```

Visit `http://localhost:4321` to see the app.

## 🛠 Tech Stack

- **Frontend**: [Astro](https://astro.build/) + [React](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/)
- **Deployment**: Cloudflare Workers (SSR)
- **Authentication**: Google OAuth 2.0

## 📦 Build & Deploy

To build for production (Cloudflare Workers):

```bash
pnpm build
```

To preview the production build locally:

```bash
pnpm preview
```

## 🤖 About

This project is a modern rewrite of my legacy Google Apps Script application. It was primarily architecturalized and implemented by **opencode**, an AI-powered coding agent, migrating the original logic to a robust Astro/React stack.

## 📝 License

MIT
