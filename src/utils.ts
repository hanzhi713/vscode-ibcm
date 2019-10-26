import * as vscode from "vscode";

export interface ColData<T> {
    [x: string]: T;
    mem: T;
    locn: T;
    label: T;
    op: T;
    addr: T;
    comments: T;
}

/**
 * regex for a valid ibcm line
 */
export const lineRegex = /^([0-9a-fA-F]{4})[ ]+([0-9a-fA-F]{1,3})[ ]+(-|[a-zA-Z0-9_]+)[ ]+(-|[a-zA-Z]{1,7})[ ]+(-|[a-zA-Z0-9_]+)[ ]+(.*)$/;

/**
 * get all labels as (labelName, lineNumber) pairs
 */
export function getAllLabels(document: vscode.TextDocument) {
    const labels: Map<string, number> = new Map();
    for (
        let i = +document.lineAt(0).text.startsWith("mem");
        i < document.lineCount;
        i++
    ) {
        const line = document.lineAt(i).text;
        const labelTx = getPart(line, "label");
        if (labelTx) {
            labels.set(labelTx, i);
        }
    }
    return labels;
}

type Col = "mem" | "locn" | "label" | "op" | "addr" | "comments";

export const cols: Col[] = ["mem", "locn", "label", "op", "addr", "comments"];

const indices = {
    mem: 0,
    locn: 1,
    label: 2,
    op: 3,
    addr: 4,
    comments: 5
};

export function getPart(line: string, type: Col): string | null {
    const temp = line.match(lineRegex);
    if (!temp || temp.length < 7) {
        return null;
    }
    const targets = {
        mem: temp[1],
        locn: temp[2],
        label: temp[3],
        op: temp[4],
        addr: temp[5],
        comments: temp[6]
    };
    const target = targets[type];
    return target ? (target === "-" ? "" : target) : null;
}

/**
 * get the index of the start of a column `type`
 * @param line 
 * @param type 
 */
export function getPartIndex(line: string, type: Col) {
    const index = indices[type];
    let curIdx = 0;
    let i = 0;
    while (i < line.length) {
        if (line.charAt(i) !== " ") {
            if (curIdx === index) {
                return i;
            }
            // skip any remaining non-empty characters
            while (line.charAt(i) !== " " && i < line.length) {
                i++;
            }
            curIdx++;
        } else {
            i++;
        }
    }
    return -1;
}

/**
 * Convert zero-based line number to a IBCM memory address
 * @param lineNum
 */
export function getLocn(lineNum: number) {
    return lineNum.toString(16).toUpperCase().padStart(3, "0");
}

export function colIndices(document: vscode.TextDocument) {
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
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i).text;
            if (lineRegex.test(line)) {
                const obj: { [x: string]: number } = {};
                for (const col of cols) {
                    obj[col] = getPartIndex(line, col);
                }
                return obj;
            }
        }
        return {
            mem: 0,
            locn: 5,
            label: 10,
            op: 20,
            addr: 28,
            comments: 38
        };
    }
}

export interface IBCMLine {
    opcode: string;
    locn: string;
    label?: string;
    op: string;
    addr?: string;
    comments?: string;
}

/**
 * regex for a snippet string with a default value
 */
const snippetDefault = /^\$\{[0-9]+\:[A-Za-z0-9]+\}$/;
const snippet = /^\$\{[0-9]+\}$/;

/**
 * Generate a line of IBCM code with label and comments
 * @param document
 * @param line
 */
export function addLine(document: vscode.TextDocument, line: IBCMLine) {
    const indices = colIndices(document);
    const chunk = (str: string | undefined, len: number) => {
        if (!str) {
            str = "-";
            // snippet string with default value
        } else if (snippetDefault.test(str)) {
            return str.padEnd(len + 5) ;
        } else if (snippet.test(str)) {
            return str.padEnd(len + 4);
        }
        return str.padEnd(len);
    };
    const opcode = chunk(line.opcode, indices.locn);
    const locn = chunk(line.locn, indices.label - indices.locn);
    const label = chunk(line.label, indices.op - indices.label);
    const op = chunk(line.op, indices.addr - indices.op);
    const addr = chunk(line.addr, indices.comments - indices.addr);
    const comments = chunk(line.comments, 0);
    return `${opcode}${locn}${label}${op}${addr}${comments}`;
}
