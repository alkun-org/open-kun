# Welcome to Open-Kun!
This repo contains Al-Bayan (Instant answer) that we use to serve the APIs on [alkun.org](https://alkun.org/).

All scripts in this repo are standalone and not tied to our engine (Kun Alpha). Feel free to use it on your projects and also don't forget to contribute to this repo.

## Custom API Format Rationale (Al-Bayan)
There are many API formats available on the internet (REST, SOAP, GraphQL, etc). They each have their own advantages over the other, so why don't we just pick one?.
There are 2 reasons here:
1. The utmost important is eternal stability (no evolving standards). Bayan format should be frozen once agreed upon.
2. Easy to implement, simple to understand and straightforward, no additional libraries needed.

REST looks easy but tricky to implement correctly while we found GraphQL not suitable for our cause, since it's against our intention of not being a single source of truth. We provide API to make developers life easier but at the same time encourage them to provide alternatives (endpoints) should they require better performance etc. [Interesting read on this topic](https://fwouts.com/articles/json-over-post)


## The Stack
Our technology stack is simple. We believe in KISS and boring techs.
1. Javascript (ES6): We use javascript for most of the Bayan Answers.
2. WebAssembly: To speed up some answers.
3. Rust: if the answers are very complex and need further optimization.


## Setting up
You can set up the environment using the following steps:

```
$ git clone https://github.com/alkun-org/open-kun
$ cd open-kun
```


## Resources
- Join the [Al-Kun Reddit Sub](https://www.reddit.com/r/AlKun/) for disccusions and ideas.
