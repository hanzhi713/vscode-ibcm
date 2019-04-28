import * as vscode from "vscode";
import { getLocn, colIndices, addLine, getAllLabels } from "./utils";
import { opcodes, opcodesWithAddr, opcodeMap } from "./opcodes";

export class IBCMCompletionItemProvider
    implements vscode.CompletionItemProvider {
    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.CompletionItem[] | undefined {
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
                        opcode: opcode.op.toString(16).toUpperCase() + "000",
                        locn: locnStr,
                        op: opcode.name
                    });
                    item.range = new vscode.Range(
                        position.line,
                        0,
                        position.line,
                        comments
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
                `0000 ${locnStr}` + " ${1:label} dw - ${2:comments}"
            );
            item.range = new vscode.Range(
                position.line,
                0,
                position.line,
                comments
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
                    item.range = document.lineAt(position.line).range;
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
                        `${inst} ${locnStr} ${itemLabel} - ${comment}`
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
                        document.lineAt(lineNum).text.substring(0, addr),
                        "ibcm"
                    );

                    const line = addLine(document, {
                        opcode: opcode.op.toString(16).toUpperCase() + locn,
                        locn: locnStr,
                        op: opcode.name,
                        addr: label,
                        comments: opcode.desc(`\`${label}\``)
                    });

                    item.insertText = line;
                    item.range = document.lineAt(position.line).range;
                    completionItems.push(item);
                }
                return completionItems;
            }
        }
    }
}
