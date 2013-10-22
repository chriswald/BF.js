// Interprets code written in BrainF***
// code is the BrainF*** to interpret.
// opts is an object containing function options.
// opts.memory is the size of the memory to make available. The
// default is 30000 units.
// opts.stdin is a string of program input. The default is "".
// opts.id is the HTML document element ID to append the program's
// output to. If non is provided ouput is sent to the terminal. 
// opts.quiet is used to silence console output. If it is true
// nothing will be written to the console even if opts is not
// specified.
function BF(code, opts) {
	opts = opts || {};
	var mem_size = opts.memory || 30000;
	var stdin = opts.stdin || "";

	var memory = [];
	for (var j = 0; j < mem_size; j ++) memory.push(0);
	var mem_index = 0;
	var loop_start_indices = [];
	var stdin_index = 0;
	var std_out = "";

	for (var i = 0; i < code.length; i ++) {
		var tok = code[i];
		if (tok === ">")
			mem_index ++;
		else if (tok === "<")
			mem_index --;
		else if (tok === "+")
			memory[mem_index]++;
		else if (tok === "-")
			memory[mem_index]--;
		else if (tok === ".")
			std_out += String.fromCharCode(memory[mem_index]);
		else if (tok === ",")
			memory[mem_index] = stdin.charCodeAt(stdin_index++) || 0;
		else if (tok === "[")
			loop_start_indices.push(i);
		else if (tok === "]")
			if (memory[mem_index] === 0)
				loop_start_indices.pop();
			else
				i = loop_start_indices[loop_start_indices.length-1];
	}

	if (typeof opts.id    === "undefined") {
		if (typeof opts.quiet === "undefined" || !opts.quiet)
			console.log(std_out);
	}
	else {
		var div = document.createElement("div");
		div.setAttribute("class", "bfjs");
		div.appendChild(document.createTextNode(std_out));
		var id = document.getElementById(opts.id).appendChild(div);
	}

	return std_out;
}