# File Uploader Storage App

![Netlify](https://img.shields.io/netlify/26afc1e8-6e41-4249-b1b9-ff9ad2ea796c?style=flat-square)

## ** Currently needing to migrate from Cyclic.sh! **

## ** Will be up & running again soon!! **

Greetings Everyone,

Welcome to my new File Upload Storage App!

My predominant goals for building this "miniature" file storage project was not only for educational purposes; but also including:

- My ongoing pursuit to strengthen my knowledge of JS, JWTs, postgres, database management, OWASP concepts, project architecture, and Full Stack Development.

- To build an extensive API on my server.

- To learn about and configure JWTs along with security authentication.

- To test my OWASP knowledge I wanted to create my own secure routing logic.

- To build upon my abilities revolving around Postgres, and DB management (queries, logic, structure, and the like..)

- To learn how to build/integrate/manage a filesystem within my server's API

- To learn how to build cron job functionality along with an internal automated Node performance & error logging system.

Please feel free to give it a go!

I hope you enjoy and thanks for looking!

## Table of Contents

- [About](#about)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Support](#support)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## About

To all those interested; I must caution you though as this application isn't meant for real-life production grade purposes.

Everything works as intended, it's just not meant for long term storage.

You can create an account, login, upload & download files, etc., it's just that I have preconfigured some routine scheduled functions that clear the appropriate data (currently files & data once every day) for the sake of simplicity and security for all those involved.

## Features

On the client besides for React, I also used [Uppy](https://uppy.io/) to assist in handling file uploads to the server. On the backend, Node was used to create my api along with Multer to facillitate file managment through middleware.

On my Node server I also built middleware functions to handle JWTs for user authentication & an additional postgres database api to manage user data.

To handle & update current file storage for all users, I updated my exisiting api routes to make additional requests to my chosen cloud source.

When a user registers and logs into their account, their info is stored in a postgres database.

When a user uploads their files, the request is routed to the cloud file storage from the Node.js server, where an allocated folder will hold the user account files. Navigating to their profile page, the front end will retreive the user's files data using the current React Query implementation.

Similar logic is also applied to when the user decides to delete and download their files.

## Installation

Please feel free to clone the project yourself!

Keep in mind though, you'll have to choose your own file storage, postgres DB, logging solution, & email service (Nodemailer).

To install:

```
git clone https://github.com/jameszenartist/file-uploader-app.git
cd ./file-uploader-app/client && npm install;
cd ./file-uploader-app/server && npm install;

```

In Node & in your .env file to create the keys for the npm jwt pkg, you can use:

```
// just run in your terminal and copy the string:
require('crypto').randomBytes(64).toString('hex')
```

To run the server:

```
cd ./server

// using Nodemon:
npm run dev
```

For the client I'm using React with Vite so:

```
cd ./client

// using Vite:
npm run dev

// to build:
npm run build
```

Currently, I have chosen [Neon.tech](https://neon.tech/) for my postgres database, and [Cloudinary](https://cloudinary.com/) for my cloud file storage. Of course if you choose a different provider, you'll have to edit the api routes on the server.

Concerning the logging functionality, if you choose a service that doesn't allow you to write files to your Node server (particularly anything free-tier), most likely you'll have to re-route the output to another external service.

## Usage

The live link to the site can be found [HERE](https://fanciful-pothos-1e84ca.netlify.app/)

All you have to do is create an account, and you're ready to upload!

If you want to come back later to download your files (given the allotted time before the cronjobs kick in), then just re-login & you're set!

Please keep in mind that when creating your password, the regex requirements are:

- 1 lowercase character
- 1 uppercase character
- 1 number
- 1 special character
- And is @ least 8 characters long, less than 25

## Support

Please [open an issue](https://github.com/jameszenartist/file-uploader-app/issues/new) for support.

## Contributing

Create a branch, add commits, and [open a pull request](https://github.com/jameszenartist/file-uploader-app/pulls).

## License

Specify the license for your project. For example:

This project is licensed under the [MIT License](https://github.com/git/git-scm.com/blob/main/MIT-LICENSE.txt)

## Contact

Please feel free to contact me at
jameszenartist@gmail.com, <a href="https://syntaxsamurai.com/" target="blank"><img align="center" src="https://img.shields.io/badge/website-000000?style=for-the-badge&logo=About.me&logoColor=white" alt="syntaxsamurai" /></a> , or <a href="https://www.linkedin.com/in/jameshansen1981/" target="blank"><img align="center" src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="jameshansen1981" /></a>
