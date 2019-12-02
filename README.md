Stack Runner
==

## About

[Stack Runner](https://github.com/khanal-abhi/stack-runner) is an extension for vs code that helps with stack builds for Haskell development. This extension requires [Stack Runner Server](https://github.com/khanal-abhi/stackrunner_server) as the backend for running the [Haskell Stack](https://docs.haskellstack.org/en/stable/README) builds. Please make sure that the binary for the server is visible in system path or configure the settings with the proper path.

<hr>

## Requirements
There are two main requirements for this extension:
- [Stack Runner Server](https://github.com/khanal-abhi/stackrunner_server)
- [Haskell Stack](https://docs.haskellstack.org/en/stable/README)

<hr>

## Installation
To install this extension manually, all you need to do is copy the repository to `~/.vscode/extensions/`.

<hr>

## Configurations

### Configuring the path to server binary
If the server binary is not available in system path, you can point to the binary by adding `"stackrunner.serverBinary"` key that points to the string form of absolute path of the binary. 

### Configuring the runner to run on save
If you would like the runner to run automatically on each save, you can adding the `"stackrunner.runonsave"` key with a value of `true`. This setting is configured as false by default.

**The default key binding for settings is `Ctrl + ,`.**


<hr>

## Issues
For any issues related to the extension, please report the bug [here](https://github.com/khanal-abhi/stack-runner/issues). For any issues related to the server binary or installation, please report the bug [here](https://github.com/khanal-abhi/stackrunner_server/issues).