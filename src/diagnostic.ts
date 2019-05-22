import * as vscode from "vscode";
import { opcodesWithAddr } from "./opcodes";
import { getPart, getPartIndex, lineRegex } from "./utils";

export const ibcmDiag = vscode.languages.createDiagnosticCollection("ibcm");
export const listener = vscode.workspace.onDidChangeTextDocument(editor => {
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
            // the label this line of code refers to
            const referredLabel = getPart(line, "addr");
            // note: referred label may be empty.
            // note: do not check for label of dw
            if (referredLabel && getPart(line, "op") !== "dw") {
                const refereeLine = parseInt(opcode.substr(1), 16) + hasHeading;
                if (refereeLine >= document.lineCount) {
                    labelDNE(document, diags, i, referredLabel);
                    continue;
                }
                const refereeRange = new vscode.Range(
                    refereeLine,
                    getPartIndex(document.lineAt(refereeLine).text, "label"),
                    refereeLine,
                    getPartIndex(document.lineAt(refereeLine).text, "op") - 1
                );
                const opcodeRange = new vscode.Range(i, 0, i, 3);
                // range invalid: the destination label probably does not exist
                if (
                    !document.validateRange(refereeRange).isEqual(refereeRange)
                ) {
                    labelDNE(document, diags, i, referredLabel);
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

function labelDNE(
    document: vscode.TextDocument,
    diags: vscode.Diagnostic[],
    i: number,
    referredLabel: string
) {
    diags.push(
        new vscode.Diagnostic(
            new vscode.Range(
                i,
                getPartIndex(document.lineAt(i).text, "addr"),
                i,
                getPartIndex(document.lineAt(i).text, "comments") - 1
            ),
            `Label ${referredLabel} does not exist`,
            vscode.DiagnosticSeverity.Warning
        )
    );
}
