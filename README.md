# VS Code - IBCM

This extension provides basic syntax highlight and snippet for the [Itty-Bitty Computing Machine (IBCM)](https://aaronbloomfield.github.io/pdr/book/ibcm-chapter.pdf)

<img src="https://raw.githubusercontent.com/hanzhi713/vscode-ibcm/master/doc/demo.gif" width="500px" />

## How to use

Type `ibcm` to generate a heading for your ibcm file

Type `dw` to define variables. Your labels can be used to generate future instructions.

You can use the menu to format your code. Your code will be aligned to the heading or the first line of non-empty code

If your line labels are incorrect, you can use `Ctrl + Shift + P` to open the command palette and type `fixLocn` to fix you line labels.

### Code Format Requirements

For the extension to work properly, each line of your IBCM code must have 6 columns, corresponding to IBCM opcode, 3-digit hex line number, label, opcode, address label, and comments. If one column is empty, please use `-` as the placeholder. Note that the first two columns must be present! The following regex is used to match each IBCM line.

```regex
^([0-9a-fA-F]{4})[ ]+([0-9a-fA-F]{1,3})[ ]+(-|[a-zA-Z0-9_]+)[ ]+(-|[a-zA-Z]{1,7})[ ]+(-|[a-zA-Z0-9_]+)[ ]+(.*)$
```

The label and address are essential for autocompletion and diagnostics. When you type `load.a`, the extension will find a label called a, if it exists, and get its line number to fill in the address for you. The linter checks whether the line number of the label referred by your address column match the address specified by your opcode.

For example, in the following code snippet, the first jump command is `C005`, which refers to memory location `005`. However, the line at `005` does not have a label. The linter will detect this kind of mistake ahd throw a warning.

<img src="https://raw.githubusercontent.com/hanzhi713/vscode-ibcm/master/doc/diagnostics.png" width="500px" />

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
