function ProfileManager()
{
}

ProfileManager.prototype.count = function()
{
	return store.get( 'profiles' ).length;
}

ProfileManager.prototype.add = function( profileName, values )
{
	var profiles = store.get( 'profiles' );
	if( profiles.hasOwnProperty( profileName ) ) {
		throw 'already_exists';
	}
	
	profiles[profileName] = values;
	store.set( 'profiles', profiles );
}

ProfileManager.prototype.edit = function( profileName, values )
{
	var profiles = store.get( 'profiles' );
	
	if( !profiles[profileName] ) {
		throw 'profile_missing';
	}
	
	var newProfileName = store.get( 'profile_name' );
	if( profileName != newProfileName ) {
		if( profiles.hasOwnProperty( newProfileName ) ) {
			throw 'renamed_exists';
		}
		
		delete profiles[profileName];
		profileName = newProfileName;
	}
	
	profiles[profileName] = values;
	store.set( 'profiles', profiles );
}

ProfileManager.prototype.remove = function( profileName )
{
	var profiles = store.get( 'profiles' );
	if( !profiles.hasOwnProperty( profileName ) ) {
		throw 'profile_missing';
	}
	
	delete profiles[profileName];
	store.set( 'profiles', profiles );
	
	var newActive = first( profiles );
	this.setActiveProfile( newActive );
	return newActive;
}

ProfileManager.prototype.getProfile = function( profileName )
{
	if( !profileName ) {
		return null;
	}
	
	var profiles = store.get( 'profiles' );
	var profile = profiles[profileName];
	
	if( !profile ) {
		return null;
	}
	
	return {
		'name': profileName,
		'values': profiles[profileName]
	};
}

ProfileManager.prototype.getActiveProfile = function()
{
	var profileName = store.get( 'active_profile' );
	return this.getProfile( profileName );
}

ProfileManager.prototype.getFirstProfile = function()
{
	var profileName = first( store.get( 'profiles' ) );
	return this.getProfile( profileName );
}

ProfileManager.prototype.setActiveProfile = function( profileName )
{
	store.set( 'active_profile', profileName );
}