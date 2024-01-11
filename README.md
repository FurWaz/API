# FurWaz - API
This repository contains the source code for the FurWaz's Main API.

## Information
This API is used to handle:

- Users creation/edition/deletion
- Applications creation/edition/deletion
- Products creation/edition/deletion
- Orders creation/edition/deletion
- Payments requests
- Portal connections (login/logout)

For all FurWaz projects. (A non-exhaustive list of projects using this API is available [here](#sub-projects))

## Technologies
This API is written in [TypeScript](https://www.typescriptlang.org/), and is bundled into ECMScript using [tsup](https://github.com/egoist/tsup).

This project uses multiple frameworks:
- [Express](https://expressjs.com/) for server-side routing.
- [Prisma](https://www.prisma.io/) for database management.
- [Swagger](https://swagger.io/) for API documentation.
- [Joi](https://joi.dev/) for data validation.

For better development experience, this project also uses:
- [Nodemon](https://nodemon.io/) for automatic server restart.
- [ESLint](https://eslint.org/) for code linting.
- [TS-Node](https://www.npmjs.com/package/ts-node) for TypeScript support in NodeJS.

> [!NOTE]
> Because of NodeJS's base librabries written in CommonJS, like FS, this project uses a [custom loader](./loader.js) to emulate
> the `require` function and `__filename` variable.

## Installation
1. Clone this repository.
2. copy the `.env.example` file to `.env` and fill it with your own values.
3. copy the `config.json.example` file to `config.json` and complete it using the json schema file.

## Usage
### Development
1. Run `npm install` to install dependencies.
2. Run `npm run migrate-dev` to migrate the database.
3. Run `npm run docs` to generate the API documentation.
4. Run `npm run dev` to start the API.

### Production
#### Using Docker (recommended)
1. Run `docker-compose up -d` to start the API.

#### Using NPM scripts (not recommended)
1. Run `npm install` to install dependencies.
2. Run `npm run migrate-dev` to migrate the database.
3. Run `npm run docs` to generate the API documentation.
4. Run `npm run build` to build the API.
5. Copy the `src/openapi.json` file to the `dist` folder.
6. Copy the `src/langs` and `src/mails` folders to the `dist` folder.
7. Run `npm run start` to start the API.

## Sub-Projects
Here is a non-exhaustive list of projects using this API (for Users management or other features):

- ### [FullBowody](https://fullbowody.projects.furwaz.fr) : A desktop application to track your body in 3D.
    - [Source code](https://github.com/FullBowody) hosted on GitHub.
    - [Website](https://fullbowody.projects.furwaz.fr) hosted on FurWaz's server.
    - [API](https://fullbowody.apis.furwaz.fr) hosted on FurWaz's server.

- [VyBeen](https://vybeen.projects.furwaz.fr) : A web application to listen to music with your friends.
    - [Source code](https://github.com/VVyBeen) hosted on GitHub.
    - [Website](https://vybeen.projects.furwaz.fr) hosted on FurWaz's server.
    - [API](https://vybeen.apis.furwaz.fr) hosted on FurWaz's server.

- [FurWaz](https://furwaz.fr) : A portfolio and platform to host FurWaz's projects and FurWaz's login portals.
    - [Source code](https://github.com/FurWaz/Website) hosted on GitHub.
    - [Website](https://furwaz.fr) hosted on FurWaz's server.
    - [API](https://main.apis.furwaz.fr) hosted on FurWaz's server.
