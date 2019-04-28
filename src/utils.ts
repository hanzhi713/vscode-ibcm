import * as vscode from "vscode";

export function getAllLabels(document: vscode.TextDocument) {
    const labels: Map<string, number> = new Map();
    const lines = document.getText().split("\n");
    for (
        let i = +document.lineAt(0).text.startsWith("mem");
        i < lines.length;
        i++
    ) {
        const line = lines[i];
        const labelTx = getPart(line, "label");
        if (labelTx) {
            labels.set(labelTx, i);
        }
    }
    return labels;
}

export function getPart(
    line: string,
    type: "mem" | "locn" | "label" | "op" | "addr" | "comments"
) {
    const temp = line.split(/[ ]+/);
    if (temp.length < 6) {
        return null;
    }
    const targets = {
        mem: temp[0],
        locn: temp[1],
        label: temp[2],
        op: temp[3],
        addr: temp[4],
        comments: temp.slice(5).join(" ")
    };
    const target = targets[type];
    return target ? (target === "-" ? "" : target) : null;
}

export function getPartIndex(
    line: string,
    type: "mem" | "locn" | "label" | "op" | "addr" | "comments"
) {
    const indices = {
        mem: 0,
        locn: 1,
        label: 2,
        op: 3,
        addr: 4,
        comments: 5
    };
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
    return (
        "0".repeat(+(lineNum < 16) + +(lineNum < 256)) +
        lineNum.toString(16).toUpperCase()
    );
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

export interface IBCMLine {
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
export function addLine(document: vscode.TextDocument, line: IBCMLine) {
    const indices = colIndices(document);
    const chunk = (str: string | undefined, len: number) => {
        if (str === undefined) {
            str = " - ";
        }
        return str + " ";
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
