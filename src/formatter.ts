import * as vscode from "vscode";
import { lineRegex, colIndices, cols } from "./utils";

export class IBCMDocumentFormatter
    implements vscode.DocumentFormattingEditProvider {
    public provideDocumentFormattingEdits(
        document: vscode.TextDocument
    ): vscode.TextEdit[] {
        const edits: vscode.TextEdit[] = [];
        const _temp = colIndices(document);
        const indices = cols.map(col => _temp[col]);
        const hasHeading = +document.lineAt(0).text.startsWith("mem");
        for (let i = hasHeading; i < document.lineCount; i++) {
            const vscodeLine = document.lineAt(i);
            if (vscodeLine.isEmptyOrWhitespace) {
                continue;
            }
            const line = vscodeLine.text;
            const match = line.match(lineRegex);
            if (!match || match.length < 7) {
                continue;
            }
            let newLine = "";
            for (let i = 0; i < indices.length - 1; i++) {
                const colLen = indices[i + 1] - indices[i];
                const part = match[i + 1];
                const sp = colLen - part.length;
                newLine += part + " ".repeat(sp >= 0 ? sp : 0);
            }
            newLine += match[6];
            if (line !== newLine) {
                edits.push(new vscode.TextEdit(vscodeLine.range, newLine));
            }
        }

        return edits;
    }
}
