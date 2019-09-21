export interface ICompleteCallback
{
    (stdOut: string): void;
}

export class BFInterpreterOptions
{
    /**
     * The size of the memory space available to the script
     */
    public MemoryWords: number = 30000;

    /**
     * Standard input passed to the script
     */
    public StdIn: string = "";

    /**
     * HTML element under which output will be appended. If null,
     * output will be written to the console
     */
    public OutputElement: HTMLElement | null = null;

    /**
     * True to suppress all output, both to the HTML element, and to
     * the console. Output will only be provided to CompleteCallback.
     */
    public Quiet: boolean = false;

    /**
     * Callback function called when evaluation completes. The
     * output is given to this function as its only parameter.
     */
    public CompleteCallback: ICompleteCallback | null = null;
}

export class BFInterpreter
{
    private code: string;
    private options: BFInterpreterOptions;

    /**
     * Constructor. With no options object specified, use the default
     * configuration.
     * @param code The script to interpret
     */
    public constructor(code: string);

    /**
     * Constructor
     * @param code The script to interpret
     * @param options The options used to configure the interpreter
     */
    public constructor(code: string, options?: BFInterpreterOptions)
    {
        this.code = code;
        this.options = options || new BFInterpreterOptions();
    }

    /**
     * Interpret the script and return its output
     */
    public Interpret(): string
    {
        let state: BFInterpreterState = new BFInterpreterState(this.options);
        let stdOut: string = this.InterpretInternal(this.code, state);

        this.WriteOutput(stdOut);
        this.OnComplete(stdOut);
        return stdOut;
    }

    /**
     * Interpret the script and return its output
     * @param code The script code to execute
     * @param state The interpreter state
     */
    private InterpretInternal(code: string, state: BFInterpreterState): string
    {
        let stdOut: string = "";

        for (let i: number = 0; i < code.length; i ++)
        {
            let token: string = code[i];

            switch (token)
            {
                case ">": 
                    state.MoveMemoryPointer(1); 
                    break;
                case "<":
                    state.MoveMemoryPointer(-1);
                    break;
                case "+":
                    state.IncrementMemoryLocation(1);
                    break;
                case "-":
                        state.IncrementMemoryLocation(-1);
                    break;
                case ".":
                    stdOut += state.GetCharForStdOut();
                    break;
                case ",":
                        state.ReadCharFromStdIn(this.options.StdIn);
                    break;
                case "[":
                    state.BeginNewLoop(i);
                    break;
                case "]":
                    if (state.IsMemoryLocationZero())
                    {
                        state.EndLoop();
                    }
                    else
                    {
                        i = state.PeekLoopStartIndices();
                    }
                    break;
                default:
                    throw new Error(
                        `Invalid character '${code[i]}' at location ${i}`
                    );
            }
        }

        return stdOut;
    }

    /**
     * Write the script output to the appropriate location based on
     * configured options.
     * @param stdOut The script output to write
     */
    private WriteOutput(stdOut: string): void
    {
        if (!this.options.Quiet)
        {
            if (this.options.OutputElement === null)
            {
                console.log(stdOut);
            }
            else
            {
                let div: HTMLDivElement = document.createElement("div") as HTMLDivElement;
                div.classList.add("bfjs");
                div.appendChild(document.createTextNode(stdOut));
                this.options.OutputElement.appendChild(div);
            }
        }
    }

    /**
     * Execute a callback function when script evaluation completes
     * @param stdOut The script output
     */
    private OnComplete(stdOut: string): void
    {
        if (this.options.CompleteCallback !== null)
        {
            this.options.CompleteCallback(stdOut);
        }
    }
}

class BFInterpreterState
{
    public memoryPointer: number = 0;
    public memory: Array<number>;

    public stdInPointer: number = 0;

    public loopStartIndices: Array<number> = new Array<number>();

    public constructor(options: BFInterpreterOptions)
    {
        this.InitializeMemory(options.MemoryWords);
    }

    /**
     * Initialize the memory space to all zeros
     * @param memoryWords The size of the memory to initialize
     */
    private InitializeMemory(memoryWords: number): void
    {
        this.memory = new Array<number>(memoryWords);
        this.memory.fill(0);
    }

    /**
     * Move the memory pointer to a new location
     * @param forward The number of words to move the memory pointer forward
     */
    public MoveMemoryPointer(forward: number)
    {
        this.memoryPointer += forward;

        if (this.memoryPointer < 0)
        {
            throw new Error(
                "Memory pointer cannot be less than 0.\n" +
                `memoryPointer: ${this.memoryPointer}\n` +
                `stdInPointer: ${this.stdInPointer}\n` +
                `Memory Words: ${this.memory.length}`
            );
        }
        else if (this.memoryPointer > this.memory.length)
        {
            throw new Error(
                `Memory pointer cannot be greater than ${this.memory.length - 1}.\n` +
                `memoryPointer: ${this.memoryPointer}\n` +
                `stdInPointer: ${this.stdInPointer}\n` +
                `Memory Words: ${this.memory.length}`
            );
        }
    }

    /**
     * Increment (or decrement) the current memory location
     * @param amount The amount (positive or negative) to increment
     * the current memory location by.
     */
    public IncrementMemoryLocation(amount: number)
    {
        this.memory[this.memoryPointer] += amount;
    }

    /**
     * Read the next character from the standard input and store it
     * to the current memory location
     * @param stdIn The standard input
     */
    public ReadCharFromStdIn(stdIn: string): void
    {
        let charCode: number = stdIn.charCodeAt(this.stdInPointer);
        this.stdInPointer ++;

        if (charCode === NaN)
        {
            charCode = 0;
        }

        this.memory[this.memoryPointer] = charCode;
    }

    /**
     * Read the value of the current memory location and covert it to
     * a character to be appended to the standard output.
     */
    public GetCharForStdOut(): string
    {
        return String.fromCharCode(this.memory[this.memoryPointer]);
    }

    /**
     * Check if the memory location currently being pointed at is
     * zero.
     */
    public IsMemoryLocationZero(): boolean
    {
        return this.memory[this.memoryPointer] === 0;
    }

    /**
     * Store the start index of a new loop
     * @param scriptIndex The loop's starting index in the script
     */
    public BeginNewLoop(scriptIndex: number): void
    {
        this.loopStartIndices.push(scriptIndex);
    }

    /**
     * Finish a loop
     */
    public EndLoop(): void
    {
        this.loopStartIndices.pop();
    }

    /**
     * Return the loop start index on the top of the stack
     */
    public PeekLoopStartIndices(): number
    {
        return this.loopStartIndices[this.loopStartIndices.length - 1];
    }
}