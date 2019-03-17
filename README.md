# VS Code - IBCM

This extension provides basic syntax highlight and snippet for the [Itty-Bitty Computing Machine (IBCM)](https://aaronbloomfield.github.io/pdr/book/ibcm-chapter.pdf)

## How to use

Type `ibcm` to generate a heading for your ibcm file

Type `dw` to define variables. Your labels can be used to generate future instructions.

> Note: This extension requires your file to adhere to a strict format. To have the best experience, you should format your code in accordance to the generated heading.

## Features

-   Syntax highlight

-   Generate code and comments based on ibcm-flavored assembly

-   Code snippets (working in progress)

-   Label mismatch checking

![feature-basic](https://raw.githubusercontent.com/hanzhi713/vscode-ibcm/master/doc/feature-basic.png)

## Requirements

None

## Extension Settings

Working in progress

## Known Issues

None

## Release Notes

## 0.0.5

-   Add label mismatch report
-   Add label highlight in comments
-   Can now deal with ibcm file without heading
-   Fix io and shift opcode

### 0.0.4

-   Append target line of code to hover

### 0.0.3

-   Added unconditional keyword (first 4 chars) matching

### 0.0.2

-   Lessened formatting restrictions

### 0.0.1

-   Initial release
