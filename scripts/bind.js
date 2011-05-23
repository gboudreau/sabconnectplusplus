function bind(f)
{
    if (f == null) {
        return function() {};
	}

    var args = Array.prototype.slice.call(arguments);
    args.shift(); // Drop parameter 'f'

    return function () {
        var start = expandArgs(args, arguments);
        return f.apply(null, args.concat(Array.prototype.slice.call(arguments, start)));
    };
};

function BindArg(i)
{
    this.index = i;
}

for (var i=1; i < 10; ++i)
{
    var arg = new BindArg(i);
    this['_' + i] = arg;
}

function expandArgs(args, arguments, start)
{
    if (start == null) {
        start = 0;
	}

    for (var i=0; i < args.length; ++i) {
        if( args[i] && args[i].constructor == BindArg) {
            var arg = args[i].index;
			
            if (arg > 0 && arg <= arguments.length) {
                args[i] = arguments[arg - 1];
                if (arg > start) {
                    start = arg;
				}
            }
            else {
                args[i] = null;
			}
        }
    }

    return start;
}