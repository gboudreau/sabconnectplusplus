/// Gets the first item in the object. This is
/// particularly useful for associative arrays.
/// @return Return value will be 'undefined' if
///		the object is empty.
function first( object )
{
	for( var obj in object ) {
		return obj;
	}
	
	return undefined;
}