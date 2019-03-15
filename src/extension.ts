// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { opcodes, opcodesWithAddr } from "./opcodes";

function findLabel(document: vscode.TextDocument, addr: string): string {
    const lines = document.getText().split("\n");
    const { locn, label, op } = colIndices(document);
    for (const line of lines) {
        if (line.indexOf(addr) === locn) {
            return line.substring(label, op).split(" ")[0];
        }
    }
    console.log("No match of label is found");
    return "";
}

function colIndices(document: vscode.TextDocument) {
    const line = document.lineAt(0).text;
    return {
        mem: line.indexOf("mem"),
        locn: line.indexOf("locn"),
        label: line.indexOf("label"),
        op: line.indexOf("op"),
        addr: line.indexOf("addr"),
        comments: line.indexOf("comments")
    };
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "ibcm" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand(
        "extension.helloWorld",
        () => {
            // The code you place here will be executed every time your command is executed

            // Display a message box to the user
            vscode.window.showInformationMessage("Hello World!");
        }
    );

    context.subscriptions.push(disposable);

    context.subscriptions.push(
        vscode.languages.registerHoverProvider("ibcm", {
            provideHover(document, position, token) {
                if (position.character <= 3) {
                    // const char = document.getText(
                    //     new vscode.Range(
                    //         position.with(position.line, 0),
                    //         position.with(position.line, 4)
                    //     )
                    // );
                    const line = document.lineAt(position.line);
                    const temp = line.text.split(" ");
                    const code = temp[0];
                    if (code.length !== 4) {
                        return;
                    }

                    const oprand = code.substr(1);
                    const opcode = opcodes[Number.parseInt(code.charAt(0), 16)];
                    let desc: string;
                    if (opcodesWithAddr.has(opcode.op)) {
                        const label = findLabel(document, oprand);
                        if (label.length !== 0) {
                            desc = opcode.desc(`${label}: ${oprand}`);
                        } else {
                            desc = opcode.desc(oprand);
                        }
                    } else {
                        desc = opcode.desc(oprand);
                    }
                    return {
                        contents: [
                            `**${opcode.name}**`,
                            desc
                            // `[${position.line + 1}](#${position.line + 1})`
                        ]
                    };
                }
            }
        })
    );

    // context.subscriptions.push(
    //     vscode.languages.registerCompletionItemProvider("*", {
    //         provideCompletionItems(document, position, token) {
    //             return [new vscode.CompletionItem("Hello")];
    //         }
    //     })
    // );
}

// this method is called when your extension is deactivated
export function deactivate() {}
