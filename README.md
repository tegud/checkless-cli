# Checkless CLI - Manage Checkless Deploys

## Introduction

Checkless is a low-cost site uptime checker built on Serverless (AWS Lambda currently). With the free tier you can have many multi-region checks running frequently and reporting to a varierty of notification endpoints your site's uptime. For more information see [these blog posts](https://www.tegud.net/tag/checkless/).

This Command Line Interface assists with generating serverless config for Checkless, deploying them to AWS Lambda and estimating their cost.

The tool is designed to be used both during local development, but also as part of a CI deployment pipeline for deploying your checkless configuration.

**NOTE:** *checkless and checkless-cli are under heavy development, certain functionality may have issues, please raise issues as you find them and include your checkless.yml, and as much environmental and additional information as possible.*

## Required

- Node 8.10 or above

### Deployment Only: 
- Linux or WLS (Windows Linux Subsystem) for deployment (generate and estimate work cross-platform) 
- AWS Account and service account with enough permissions to run Serverless (basically most of them)
- Serverless installed globally (`npm i -g serverless`)

Depending on notification configuration, other pre-requisites may be required.

## Installation

`npm i -g checkless-cli`

## Usage

### Configuration

checkless-cli reads configuration from a local checkless.yml file, for example:

```
region: eu-west-1
checks:
  example:
    url: https://www.example.com
    checkEvery: 1 minute
    regions:
      - eu-west-1
notifications:
  - slack:
      webhookUrl: "https://hooks.slack.com/services/<NOT REAL>"
```
This will create a serverless config for the AWS EU-West-1 region with the basic checkless infrastructure, as well as a cloudfront scheduled event that executes the single check every minute. The notification will send all results to the specified slack webhook, which needs to be setup in slack separately.

### Estimate costs *(BETA)*

Estimate the costs of the checkless.yml configuration in the directory, **does not** have to be executed after the config is generated, it will parse and expand the serverless config itself to calculate full costs, include base checkless functionality across multiple regions.

`checkless-cli estimate`

Will return the estimated cost, included the AWS Free Tier.  If you do not wish to include the free tier use:

`checkless-cli estimate --ignore-free-tier`

Function cost is split by type of function and region.

### Generate Configuration *(BETA)*

`checkless-cli generate`

This generates serverless configuration per region within the .checkless directory. 

### Deploy *(ALPHA)*

`checkless-cli deploy [region]`

**This does not generate your config, you *MUST* execute generate first (see above)**

To deploy into AWS Lambda, the serverless cli is executed per region, if any stage fails, the process will exit and not continue. For the deploy stage to correctly work, you must have valid AWS credentials in one of the standard locations (see AWS-CLI authentication assistence).
