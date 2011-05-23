// 'value' must be a string.
function toBoolean( value )
{
	if( typeof value != 'string' ) {
		throw 'Parameter "value" must be of type string';
	}
	
	value = value.toLowerCase();
	
	if( value == 'yes' || value == 'true' || value == '1' ) {
		return true;
	}
	else if( value == 'no' || value == 'false' || value == '0' ) {
		return false;
	}
	
	return null;
}