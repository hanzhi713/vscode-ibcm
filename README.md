# VS Code - IBCM

This extension provides basic syntax highlight and snippet for the [Itty-Bitty Computing Machine (IBCM)](https://aaronbloomfield.github.io/pdr/book/ibcm-chapter.pdf)

<img src="https://raw.githubusercontent.com/hanzhi713/vscode-ibcm/master/doc/demo.gif" width="500px" />

## How to use

Type `ibcm` to generate a heading for your ibcm file

Type `dw` to define variables. Your labels can be used to generate future instructions.

You can use the menu to format your code. Your code will be aligned to the heading or the first line of non-empty code

If your line labels are incorrect, you can use `Ctrl + Shift + P` to open the command palette and type `fixLocn` to fix you line labels.

> Note: This extension requires your file to adhere to a strict format. To have the best experience, you should format your code in accordance to the generated heading.

## Features

-   Syntax highlight

-   Generate code and comments based on ibcm-flavored assembly

-   Code snippets (working in progress)

-   Label mismatch checking

-   Code formatting

<img src="https://raw.githubusercontent.com/hanzhi713/vscode-ibcm/master/doc/format-demo.gif" width="400px" />

## Requirements

None

## Extension Settings

Working in progress

## Known Issues

None

## Release Notes

### 0.1.0

-   Introduce a breaking change: use `-` as the placeholder
-   New formatter
-   Add variable definition by `dw.*`
-   Code style: Extract providers to separated files

### 0.0.7

-   Fix snippet spacing
-   Show `define variable` if `dw` is detected

### 0.0.6

-   Added diagnostic for non-existent labels
-   Adjusted column width
-   Added opcode for instruction autocompletion

### 0.0.5

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
