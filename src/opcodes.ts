const opcodes = [
    {
        op: 0,
        name: "halt",
        desc: () => "halt the machine"
    },
    {
        op: 1,
        name: "io",
        desc: (oprand: string) => {
            const type = oprand.charAt(0);
            switch (type) {
                case "0":
                    return "read hex word from keyboard";
                case "4":
                    return "read ascii character";
                case "8":
                    return "print hex to screen";
                case "C":
                    return "print ascii to screen";
            }
            return "Unknown IO operation";
        }
    },
    {
        op: 2,
        name: "shift",
        desc: (oprand: string) => {
            const type = oprand.charAt(0);
            const numBits = parseInt(oprand.substr(1), 16);
            switch (type) {
                case "0":
                    return `shift left by ${numBits} bits`;
                case "4":
                    return `shift right by ${numBits} bits`;
                case "8":
                    return `rotate left by ${numBits} bits`;
                case "C":
                    return `rotate right by ${numBits} bits`;
            }
            return "Unknown IO operation";
        }
    },
    {
        op: 3,
        name: "load",
        desc: (oprand: string) => `load ${oprand} into accumulator`
    },
    {
        op: 4,
        name: "store",
        desc: (oprand: string) => `store accumulator to ${oprand}`
    },
    {
        op: 5,
        name: "add",
        desc: (oprand: string) => `add ${oprand} to accumulator`
    },
    {
        op: 6,
        name: "sub",
        desc: (oprand: string) => `subtract ${oprand} from accumulator`
    },
    {
        op: 7,
        name: "and",
        desc: (oprand: string) => `logical and with ${oprand}`
    },
    {
        op: 8,
        name: "or",
        desc: (oprand: string) => `logical or with ${oprand}`
    },
    {
        op: 9,
        name: "xor",
        desc: (oprand: string) => `logical xor with ${oprand}`
    },
    {
        op: 10,
        name: "not",
        desc: (oprand: string) => `logical complement of ${oprand}`
    },
    {
        op: 11,
        name: "nop",
        desc: () => "no operation"
    },
    {
        op: 12,
        name: "jmp",
        desc: (oprand: string) => `jump to ${oprand}`
    },
    {
        op: 13,
        name: "jmpe",
        desc: (oprand: string) => `jump to ${oprand} if accumulator equals 0`
    },
    {
        op: 14,
        name: "jmpl",
        desc: (oprand: string) => `jump to ${oprand} if accumulator < 0`
    },
    {
        op: 15,
        name: "brl",
        desc: (oprand: string) => `${oprand}`
    }
];

const opcodesWithAddr = new Set([3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14]);
const opcodeNames = opcodes.map(op => op.name);

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

export { opcodes, opcodesWithAddr, opcodeNames, opcodeMap };
