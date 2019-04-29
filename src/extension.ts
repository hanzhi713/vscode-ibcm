// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { getPart, getLocn } from "./utils";
import { IBCMCompletionItemProvider } from "./completion";
import { IBCMHoverProvider } from "./hover";
import { IBCMDocumentFormatter } from "./formatter";
import { ibcmDiag, listener } from "./diagnostic";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated

    let fixCommand = vscode.commands.registerTextEditorCommand(
        "ibcm.fixLocn",
        (editor, edit) => {
            const hasHeading = +editor.document
                .lineAt(0)
                .text.startsWith("mem");
            const lines = editor.document.getText().split("\n");
            for (let lineNum = hasHeading; lineNum < lines.length; lineNum++) {
                const line = lines[lineNum];
                const originalLocn = getPart(line, "locn");
                const actualLocn = getLocn(lineNum - hasHeading);
                if (!originalLocn) {
                    continue;
                }
                if (line.length !== 0 && originalLocn !== actualLocn) {
                    const locn = line.indexOf(originalLocn);
                    edit.replace(
                        new vscode.Range(lineNum, locn, lineNum, locn + 3),
                        actualLocn
                    );
                }
            }
        }
    );

    context.subscriptions.push(fixCommand);

    context.subscriptions.push(
        vscode.languages.registerHoverProvider("ibcm", new IBCMHoverProvider())
    );

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            "ibcm",
            new IBCMCompletionItemProvider(),
            "."
        )
    );

    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider(
            "*",
            new IBCMDocumentFormatter()
        )
    );

    context.subscriptions.push(ibcmDiag);
    context.subscriptions.push(listener);
}

// this method is called when your extension is deactivated
export function deactivate() {}
