// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { opcodesWithAddr } from "./opcodes";
import { getPart, getLocn, getPartIndex, lineRegex } from "./utils";
import { IBCMCompletionItemProvider } from "./completion";
import { IBCMHoverProvider } from "./hover";
import { IBCMDocumentFormatter } from "./formatter";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "ibcm" is now active!');

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

    const ibcmDiag = vscode.languages.createDiagnosticCollection("ibcm");
    context.subscriptions.push(ibcmDiag);

    const listener = vscode.workspace.onDidChangeTextDocument(editor => {
        ibcmDiag.clear();
        const document = editor.document;
        const diags: vscode.Diagnostic[] = [];
        const hasHeading = +document.lineAt(0).text.startsWith("mem");
        for (let i = hasHeading; i < document.lineCount; i++) {
            const vscodeLine = document.lineAt(i);
            if (vscodeLine.isEmptyOrWhitespace) {
                continue;
            }
            const line = vscodeLine.text;

            const match = line.match(lineRegex);
            if (!match || match.length < 7) {
                diags.push(
                    new vscode.Diagnostic(
                        vscodeLine.range,
                        `Bad line of code. A line must have all the six columns present. If one column is empty, you must use "-" as the place holder`,
                        vscode.DiagnosticSeverity.Error
                    )
                );
            }

            const opcode = line.substr(0, 4);
            const op = parseInt(opcode.charAt(0), 16);
            // don't bother with instructions without a memory address
            if (!opcodesWithAddr.has(op)) {
                continue;
            }
            if (opcode.length) {
                // the label of which this line of code refers to
                const referredLabel = getPart(line, "addr");
                // note: referred label may be empty.
                // note: do not check for label of dw
                if (referredLabel && getPart(line, "op") !== "dw") {
                    const refereeLine =
                        parseInt(opcode.substr(1), 16) + hasHeading;
                    const refereeRange = new vscode.Range(
                        refereeLine,
                        getPartIndex(
                            document.lineAt(refereeLine).text,
                            "label"
                        ),
                        refereeLine,
                        getPartIndex(document.lineAt(refereeLine).text, "op") -
                            1
                    );
                    const opcodeRange = new vscode.Range(i, 0, i, 3);
                    // range invalid: the destination label probably does not exist
                    if (
                        !document
                            .validateRange(refereeRange)
                            .isEqual(refereeRange)
                    ) {
                        diags.push(
                            new vscode.Diagnostic(
                                new vscode.Range(
                                    i,
                                    getPartIndex(
                                        document.lineAt(i).text,
                                        "addr"
                                    ),
                                    i,
                                    getPartIndex(
                                        document.lineAt(i).text,
                                        "comments"
                                    ) - 1
                                ),
                                `Label ${referredLabel} does not exist`,
                                vscode.DiagnosticSeverity.Warning
                            )
                        );
                        continue;
                    }
                    const actualLabel = getPart(
                        document.lineAt(refereeLine).text,
                        "label"
                    );

                    // empty target label
                    if (!actualLabel) {
                        const diag = new vscode.Diagnostic(
                            refereeRange,
                            `Warning: Label referred as ${referredLabel}, but is missing a label`,
                            vscode.DiagnosticSeverity.Warning
                        );
                        diag.relatedInformation = [
                            new vscode.DiagnosticRelatedInformation(
                                new vscode.Location(document.uri, opcodeRange),
                                `Referred by instruction ${opcode} at line ${opcodeRange
                                    .start.line + 1}`
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
                                `Referred by instruction ${opcode} at line ${opcodeRange
                                    .start.line + 1}`
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
