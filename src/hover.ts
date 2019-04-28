import * as vscode from "vscode";
import { getPart } from "./utils";
import { opcodes, opcodesWithAddr } from "./opcodes";

export class IBCMHoverProvider implements vscode.HoverProvider {
    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> | undefined {
        if (position.character <= 3) {
            const line = document.lineAt(position.line).text;
            const temp = line.split(" ");
            const code = temp[0];
            if (code.length !== 4) {
                return;
            }

            const oprand = code.substr(1);
            const opcode = opcodes[parseInt(code.charAt(0), 16)];
            const hasHeading = +document.lineAt(0).text.startsWith("mem");

            const desc = new vscode.MarkdownString();
            if (opcodesWithAddr.has(opcode.op)) {
                const targetLine = document.lineAt(
                    parseInt(oprand, 16) + hasHeading
                ).text;
                const label = getPart(targetLine, "label");
                if (label) {
                    desc.appendMarkdown(opcode.desc(`**${label}**: ${oprand}`));
                } else {
                    desc.appendMarkdown(opcode.desc(oprand));
                }
                desc.appendCodeblock(targetLine, "ibcm");
            } else {
                if (opcode.op === 0 && getPart(line, "op") === "dw") {
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
}
