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

    private memoryPointer: number = 0;
    private memory: Array<number>;

    private stdInPointer: number = 0;

    private loopStartIndices: Array<number> = new Array<number>();

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

        this.InitializeMemory();
    }

    /**
     * Interpret the script and return its output
     */
    public Interpret(): string
    {
        let stdOut: string = this.InterpretInternal(this.code);

        this.WriteOutput(stdOut);
        this.OnComplete(stdOut);
        return stdOut;
    }

    /**
     * Interpret the script and return its output
     * @param code The script code to execute
     */
    private InterpretInternal(code: string): string
    {
        let stdOut: string = "";

        for (let i: number = 0; i < code.length; i ++)
        {
            let token: string = code[i];

            switch (token)
            {
                case ">": 
                    this.MoveMemoryPointer(1); 
                    break;
                case "<":
                    this.MoveMemoryPointer(-1);
                    break;
                case "+":
                    this.IncrementMemoryLocation(1);
                    break;
                case "-":
                    this.IncrementMemoryLocation(-1);
                    break;
                case ".":
                    stdOut += this.GetCharForStdOut();
                    break;
                case ",":
                    this.ReadCharFromStdIn();
                    break;
                case "[":
                    this.loopStartIndices.push(i);
                    break;
                case "]":
                    if (this.IsMemoryLocationZero())
                    {
                        this.loopStartIndices.pop();
                    }
                    else
                    {
                        i = this.PeekLoopStartIndices();
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
     * Move the memory pointer to a new location
     * @param forward The number of words to move the memory pointer forward
     */
    private MoveMemoryPointer(forward: number)
    {
        this.memoryPointer += forward;

        if (this.memoryPointer < 0)
        {
            throw new Error(
                "Memory pointer cannot be less than 0.\n" +
                `memoryPointer: ${this.memoryPointer}\n` +
                `stdInPointer: ${this.stdInPointer}\n` +
                `Memory Words: ${this.options.MemoryWords}`
            );
        }
        else if (this.memoryPointer > this.options.MemoryWords)
        {
            throw new Error(
                `Memory pointer cannot be greater than ${this.options.MemoryWords - 1}.\n` +
                `memoryPointer: ${this.memoryPointer}\n` +
                `stdInPointer: ${this.stdInPointer}\n` +
                `Memory Words: ${this.options.MemoryWords}`
            );
        }
    }

    /**
     * Increment (or decrement) the current memory location
     * @param amount The amount (positive or negative) to increment
     * the current memory location by.
     */
    private IncrementMemoryLocation(amount: number)
    {
        this.memory[this.memoryPointer] += amount;
    }

    /**
     * Initialize the memory space to all zeros
     */
    private InitializeMemory(): void
    {
        this.memory = new Array<number>(this.options.MemoryWords);
        this.memory.fill(0);
    }

    /**
     * Read the next character from the standard input and store it
     * to the current memory location
     */
    private ReadCharFromStdIn(): void
    {
        let charCode: number = this.options.StdIn.charCodeAt(this.stdInPointer);
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
    private GetCharForStdOut(): string
    {
        return String.fromCharCode(this.memory[this.memoryPointer]);
    }

    /**
     * Check if the memory location currently being pointed at is
     * zero.
     */
    private IsMemoryLocationZero(): boolean
    {
        return this.memory[this.memoryPointer] === 0;
    }

    /**
     * Return the loop start index on the top of the stack
     */
    private PeekLoopStartIndices(): number
    {
        return this.loopStartIndices[this.loopStartIndices.length - 1];
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