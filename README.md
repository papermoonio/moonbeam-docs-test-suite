# Moonbeam Docs Test Suite

This repository contains tests for the tutorials found on the [Moonbeam docs](https://docs.moonbeam.network/) site (the [moonbeam-docs repository](https://github.com/purestake/moonbeam-docs)). The tests are written in JavaScript using [Mocha](https://mochajs.org/) and [Chai](https://www.chaijs.com/).

## How & When the Tests are Run

Before the tests are run, all of the dependencies listed in the `package.json` file of this repo will be upgraded and installed to the latest version available. Once complete, the tests will run. The tests are run against a [Moonbeam development node](https://docs.moonbeam.network/builders/get-started/networks/moonbeam-dev/). When the tests have completed, the development node is stopped. As a result, a fresh development node is used every time the tests are run.

Only the tests on the `main` branch will be checked.

The tests are run on a weekly basis, every Tuesday at 15:00 UTC. If a test fails, the Moonbeam Developer Relations team will be notified, fix the failing tests, and update the documentation related to the failing tests as needed.

## Creating New Test Directories

When creating new tests, the structure you can follow will mirror that of the structure on the [Moonbeam docs](https://docs.moonbeam.network/) site. For example, if you're adding a new [development environment](https://docs.moonbeam.network/builders/build/eth-api/dev-env/) test suite, you can add a directory for it under the `builders > build > eth-api > dev-env` directory if it doesn't already exist.

Each page on the docs site that contains code to be tested should correspond to a directory in this repo.

## Creating New Test Files

Each main section (so those that start with `##`, not subsections like `###`, `####`, etc.) of a given page on the docs site that contains code to be tested should correspond to a file in this repo. For example, if you take a look at the [Ethers.js](https://docs.moonbeam.network/builders/build/eth-api/libraries/ethersjs/) page, there are two main sections with code to be tested: **Send a Transaction** and **Deploy a Contract**. As a result, there should be two pages under the `ethers` directory: `send-transaction.js` and `deploy-contract.js`. Each page should contain the respective tests for each section.

### Organizing the Tests

A test file should be wrapped in a `describe` function, that is used to describe the test suite with the given `title` and callback `fn`. The `title` should be in the following format:

```
Name of Page - Name of Section
```

For example, the describe for the **Send a Transaction** section of the Ethers page looks like:

```
Ethers - Send a Transaction
```

Nested within the initial `describe` function, you can include additional `describe` functions to wrap each piece of functionality that you are testing. Not every section contains a consistent structure, so you will need to determine how to best organize the tests within the file.

Similarly to the main `describe` function, any nested `described` function should include a `title` that resembles the following format:

```
Name of Section - Name of What is Tested
```

As an example, for the Ethers tutorial, there are many files that are created with different responsibilites, i.e. the `balances.js` and `transaction.js` files. So if you look at the `ethers/send-transaction.js` file of this repo, you'll notice the tests are broken up by file and the `title` of one of the nested `describe` functions is:

```
Send a Transaction - transaction.js
```

### Additional Files for Contracts

If your test requires a contract to run, you can add the file to the `contracts` directory of this repo.

## Guidelines for Writing Tests

👉 Each test should only test one item. As a general rule of thumb, if you're writing the name of your test and you include the word "and" in it, you should break it out into two or more tests as needed.

👉 Your tests should not rely on or be impacted by any previous tests that have run.

👉 Use burner accounts so that you're testing against a blank account and not re-using the same account for all of the tests
