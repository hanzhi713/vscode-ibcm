// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { opcodes, opcodesWithAddr, opcodeNames } from "./opcodes";

function getAllLabels(document: vscode.TextDocument) {
    const labels: Map<string, number> = new Map();
    const { locn, label, op } = colIndices(document);
    const lines = document.getText().split("\n");
    for (
        let i = +document.lineAt(0).text.startsWith("mem");
        i < lines.length;
        i++
    ) {
        const line = lines[i];
        const labelTx = line.substring(label, op).trim();
        if (labelTx.length !== 0) {
            labels.set(labelTx, i);
        }
    }
    return labels;
}

// function findLabel(document: vscode.TextDocument, addr: string): string {
//     const lines = document.getText().split("\n");
//     const { locn, label, op } = colIndices(document);
//     for (const line of lines) {
//         if (line.indexOf(addr) === locn) {
//             return line.substring(label, op).trim();
//         }
//     }
//     console.log("No match of label is found");
//     return "";
// }

/**
 * get the indices of each column
 * @todo cache the indices for performance
 * @param document
 */
function colIndices(document: vscode.TextDocument) {
    const line = document.lineAt(0).text;
    if (line.startsWith("mem")) {
        return {
            mem: line.indexOf("mem"),
            locn: line.indexOf("locn"),
            label: line.indexOf("label"),
            op: line.indexOf("op"),
            addr: line.indexOf("addr"),
            comments: line.indexOf("comments")
        };
    } else {
        return {
            mem: 0,
            locn: 5,
            label: 11,
            op: 19,
            addr: 27,
            comments: 34
        };
    }
}

/**
 * Convert zero-based line number to a IBCM memory address
 * @param lineNum
 */
function getLocn(lineNum: number) {
    return (
        "0".repeat(+(lineNum < 16) + +(lineNum < 256)) +
        lineNum.toString(16).toUpperCase()
    );
}

interface IBCMLine {
    opcode: string;
    locn: string;
    label?: string;
    op: string;
    addr?: string;
    comments?: string;
}

/**
 * Generate a line of IBCM code with label and comments
 * @param document
 * @param line
 * @param offset
 */
function addLine(
    document: vscode.TextDocument,
    line: IBCMLine,
    offset: number = 0
) {
    const indices = colIndices(document);
    const chunk = (str: string | undefined, len: number) => {
        if (str === undefined) {
            str = "";
        }
        return str + " ".repeat(Math.max(len - str.length, 0));
    };
    const opcode = chunk(line.opcode, indices.locn);
    const locn = chunk(line.locn, indices.label - indices.locn);
    const label = chunk(line.label, indices.op - indices.label);
    const op = chunk(line.op, indices.addr - indices.op);
    const addr = chunk(line.addr, indices.comments - indices.addr);
    return `${opcode}${locn}${label}${op}${addr}${
        line.comments === undefined ? "" : line.comments
    }`;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "ibcm" is now active!');

    let fixCommand = vscode.commands.registerTextEditorCommand(
        "ibcm.fixLocn",
        (editor, edit, c) => {
            const hasHeading = +editor.document
                .lineAt(0)
                .text.startsWith("mem");
            const lines = editor.document.getText().split("\n");
            const { locn } = colIndices(editor.document);
            for (let lineNum = hasHeading; lineNum < lines.length; lineNum++) {
                const line = lines[lineNum];
                const originalLocn = line.substr(locn, 3);
                const actualLocn = getLocn(lineNum - hasHeading);
                if (line.length !== 0 && originalLocn !== actualLocn) {
                    edit.replace(
                        new vscode.Range(
                            new vscode.Position(lineNum, locn),
                            new vscode.Position(lineNum, locn + 3)
                        ),
                        actualLocn
                    );
                }
            }
        }
    );

    context.subscriptions.push(fixCommand);

    context.subscriptions.push(
        vscode.languages.registerHoverProvider("ibcm", {
            provideHover(document, position, token) {
                if (position.character <= 3) {
                    const line = document.lineAt(position.line).text;
                    const temp = line.split(" ");
                    const code = temp[0];
                    if (code.length !== 4) {
                        return;
                    }

                    const oprand = code.substr(1);
                    const opcode = opcodes[parseInt(code.charAt(0), 16)];
                    const indices = colIndices(document);
                    const hasHeading = +document
                        .lineAt(0)
                        .text.startsWith("mem");

                    const desc = new vscode.MarkdownString();
                    if (opcodesWithAddr.has(opcode.op)) {
                        const targetLine = document.lineAt(
                            parseInt(oprand, 16) + hasHeading
                        ).text;
                        const label = targetLine
                            .substring(indices.label, indices.op)
                            .trim();
                        if (label.length !== 0) {
                            desc.appendMarkdown(
                                opcode.desc(`**${label}**: ${oprand}`)
                            );
                        } else {
                            desc.appendMarkdown(opcode.desc(oprand));
                        }
                        desc.appendCodeblock(targetLine, "ibcm");
                    } else {
                        if (
                            opcode.op === 0 &&
                            line.substring(indices.op, indices.addr).trim() ===
                                "dw"
                        ) {
                            desc.appendMarkdown("define variable");
                        } else {
                            desc.appendMarkdown(opcode.desc(oprand));
                        }
                    }
                    return {
                        contents: [`**${opcode.name}**`, desc]
                    };
                }
            }
        })
    );

    const opcodeMap: Map<
        string,
        {
            op: number;
            name: string;
            desc: (oprand: string) => string;
        }
    > = new Map();
    for (const opcode of opcodes) {
        opcodeMap.set(opcode.name, opcode);
    }

    const completionProvider = vscode.languages.registerCompletionItemProvider(
        "ibcm",
        {
            provideCompletionItems(document, position, token) {
                const hasHeading = +document.lineAt(0).text.startsWith("mem");
                const indices = colIndices(document);
                const { comments, addr } = indices;
                const parts = document
                    .lineAt(position.line)
                    .text.substring(0, position.character + 1)
                    .split(".");
                const locnStr = getLocn(position.line - hasHeading);
                if (parts.length === 1) {
                    const completionItems: vscode.CompletionItem[] = [];
                    for (const opcode of opcodes) {
                        const item = new vscode.CompletionItem(
                            opcode.name,
                            vscode.CompletionItemKind.Function
                        );
                        // halt or no operation
                        if (opcode.op === 11 || opcode.op === 0) {
                            item.insertText = addLine(document, {
                                opcode:
                                    opcode.op.toString(16).toUpperCase() +
                                    "000",
                                locn: locnStr,
                                op: opcode.name
                            });
                            item.range = new vscode.Range(
                                new vscode.Position(position.line, 0),
                                new vscode.Position(position.line, comments)
                            );
                        }
                        item.detail = `${opcode.name}: ${opcode.op
                            .toString(16)
                            .toUpperCase()}`;
                        item.documentation = opcode.desc("[mem]");
                        completionItems.push(item);
                    }
                    // code snippet for `dw` -- variable definition
                    const item = new vscode.CompletionItem(
                        "dw",
                        vscode.CompletionItemKind.Method
                    );
                    item.insertText = new vscode.SnippetString(
                        "0000" +
                            " ".repeat(indices.locn - 4) +
                            locnStr +
                            " ".repeat(indices.label - indices.locn - 3) +
                            "${1:label}" +
                            " ".repeat(indices.op - indices.label - 5) +
                            "dw" +
                            " ".repeat(indices.addr - indices.op - 2) +
                            " ".repeat(indices.comments - indices.addr) +
                            "${2:comments}"
                    );
                    item.range = new vscode.Range(
                        new vscode.Position(position.line, 0),
                        new vscode.Position(position.line, comments)
                    );
                    item.detail = "define a variable";
                    completionItems.push(item);
                    return completionItems;
                } else if (parts.length === 2) {
                    // inst.label completion, e.g. store.a
                    const opcodeName = parts[0];
                    const opcode = opcodeMap.get(opcodeName);
                    if (opcode === undefined) {
                        return;
                    }
                    // completion for io.*, e.g. io.readH
                    if (opcode.op === 1) {
                        const completionItems: vscode.CompletionItem[] = [];
                        const options = [
                            ["1000", "readH", "read hex from keyboard"],
                            ["1400", "readA", "read ASCII from keyboard"],
                            ["1800", "writeH", "print hex to screen"],
                            ["1C00", "writeA", "print ASCII to screen"]
                        ];

                        for (const [inst, itemLabel, comment] of options) {
                            const item = new vscode.CompletionItem(
                                itemLabel,
                                vscode.CompletionItemKind.Function
                            );
                            item.detail = comment;
                            item.filterText = opcodeName + "." + itemLabel;
                            const line = addLine(document, {
                                opcode: inst,
                                locn: locnStr,
                                op: itemLabel,
                                comments: comment
                            });
                            item.range = new vscode.Range(
                                new vscode.Position(position.line, 0),
                                new vscode.Position(position.line, line.length)
                            );
                            item.insertText = line;
                            completionItems.push(item);
                        }
                        return completionItems;
                    } else if (opcode.op === 2) {
                        // completion for shift.*, e.g. shift.rotL
                        const completionItems: vscode.CompletionItem[] = [];
                        const options = [
                            ["200${1}", "shiftL", "shift left by ${1} bits"],
                            ["240${1}", "shiftR", "shift right by ${1} bits"],
                            ["280${1}", "rotL", "rotate left by ${1} bits"],
                            ["2C0${1}", "rotR", "rotate right by ${1} bits"]
                        ];

                        for (const [inst, itemLabel, comment] of options) {
                            const item = new vscode.CompletionItem(
                                itemLabel,
                                vscode.CompletionItemKind.Function
                            );
                            item.detail = comment;
                            item.filterText = opcodeName + "." + itemLabel;
                            item.range = new vscode.Range(
                                new vscode.Position(position.line, 0),
                                new vscode.Position(position.line, comments)
                            );
                            item.insertText = new vscode.SnippetString(
                                inst +
                                    " ".repeat(indices.locn - 4) +
                                    locnStr +
                                    " ".repeat(
                                        indices.comments - indices.locn - 3
                                    ) +
                                    comment
                            );
                            completionItems.push(item);
                        }
                        return completionItems;
                    } else if (opcodesWithAddr.has(opcode.op)) {
                        // completion for opcode with an address, e.g. store.a
                        const completionItems: vscode.CompletionItem[] = [];
                        for (const temp of getAllLabels(document)) {
                            const [label, lineNum] = temp;
                            const item = new vscode.CompletionItem(
                                label,
                                vscode.CompletionItemKind.Variable
                            );
                            const locn = document
                                .lineAt(lineNum)
                                .text.substr(indices.locn, 3);
                            item.detail = opcode.desc(`${label}: ${locn}`);
                            item.filterText = opcodeName + "." + label;

                            item.documentation = new vscode.MarkdownString(
                                `line at **${label}: ${locn}**`
                            );

                            item.documentation.appendCodeblock(
                                document
                                    .lineAt(lineNum)
                                    .text.substring(0, addr),
                                "ibcm"
                            );

                            const line = addLine(document, {
                                opcode:
                                    opcode.op.toString(16).toUpperCase() + locn,
                                locn: locnStr,
                                op: opcode.name,
                                addr: label,
                                comments: opcode.desc(`\`${label}\``)
                            });

                            item.insertText = line;
                            item.range = new vscode.Range(
                                new vscode.Position(position.line, 0),
                                new vscode.Position(position.line, line.length)
                            );
                            completionItems.push(item);
                        }
                        return completionItems;
                    }
                }
            }
        },
        "."
    );

    context.subscriptions.push(completionProvider);

    const ibcmDiag = vscode.languages.createDiagnosticCollection("ibcm");
    context.subscriptions.push(ibcmDiag);

    const listener = vscode.workspace.onDidChangeTextDocument(editor => {
        console.log("Editor changed");
        ibcmDiag.clear();
        const document = editor.document;
        const indices = colIndices(document);
        const lines = document.getText().split("\n");
        const labels = getAllLabels(document);
        const diags: vscode.Diagnostic[] = [];
        const hasHeading = +document.lineAt(0).text.startsWith("mem");
        for (let i = hasHeading; i < lines.length; i++) {
            const line = lines[i];
            const opcode = line.substr(0, 4);
            const op = parseInt(opcode.charAt(0), 16);
            // don't bother with instructions without a memory address
            if (!opcodesWithAddr.has(op)) continue;
            if (opcode.length !== 0) {
                // the label of which this line of code refers as
                const referredLabel = line
                    .substring(indices.addr, indices.comments)
                    .trim();

                // const refereeLocn = labels.get(referee);
                if (referredLabel.length !== 0) {
                    const refereeLine =
                        parseInt(opcode.substr(1), 16) + hasHeading;
                    const refereeRange = new vscode.Range(
                        new vscode.Position(refereeLine, indices.label),
                        new vscode.Position(refereeLine, indices.op - 1)
                    );
                    const opcodeRange = new vscode.Range(
                        new vscode.Position(i, 0),
                        new vscode.Position(i, 3)
                    );
                    if (
                        !document
                            .validateRange(refereeRange)
                            .isEqual(refereeRange)
                    ) {
                        diags.push(
                            new vscode.Diagnostic(
                                new vscode.Range(
                                    new vscode.Position(i, indices.addr),
                                    new vscode.Position(i, indices.comments - 1)
                                ),
                                `Label ${referredLabel} does not exist`,
                                vscode.DiagnosticSeverity.Warning
                            )
                        );
                        continue;
                    }
                    const actualLabel = document
                        .lineAt(refereeLine)
                        .text.substring(indices.label, indices.op)
                        .trim();
                    // empty target label
                    if (actualLabel.length === 0) {
                        const diag = new vscode.Diagnostic(
                            refereeRange,
                            `Warning: Label referred as ${referredLabel}, but is missing a label`,
                            vscode.DiagnosticSeverity.Warning
                        );
                        diag.relatedInformation = [
                            new vscode.DiagnosticRelatedInformation(
                                new vscode.Location(document.uri, opcodeRange),
                                `Referred by instruction ${opcode}`
                            )
                        ];
                        diags.push(diag);
                        // label mismatch
                    } else if (actualLabel !== referredLabel) {
                        const diag = new vscode.Diagnostic(
                            refereeRange,
                            `Warning: Label referred as ${referredLabel}, but is actually ${actualLabel}`,
                            vscode.DiagnosticSeverity.Warning
                        );
                        diag.relatedInformation = [
                            new vscode.DiagnosticRelatedInformation(
                                new vscode.Location(document.uri, opcodeRange),
                                `Referred by instruction ${opcode}`
                            )
                        ];
                        diags.push(diag);
                    }
                }
            }
        }
        ibcmDiag.set(document.uri, diags);
    });
    context.subscriptions.push(listener);
}

// this method is called when your extension is deactivated
export function deactivate() {}
