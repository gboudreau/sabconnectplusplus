function ProfileManager()
{
}

/// Creates a new profile initialized to the current values specified
/// in the URL, API Key, Username, and Password fields in the options
/// page.
/// Note that the profile will not be added if another profile with the
/// same name already exists. If add is called and the profile already
/// exists with that name, an exception is thrown that is a string named
/// 'already_exists'.
/// @param profileName The name of the new profile.
ProfileManager.prototype.add = function( profileName, values )
{
	var profiles = store.get( 'profiles' );
	if( profiles.hasOwnProperty( profileName ) ) {
		throw 'already_exists';
	}
	
	profiles[profileName] = values;
	store.set( 'profiles', profiles );
	return true;
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
	
	delete profiles[selectedProfile];
	store.set( 'profiles', profiles );
}

ProfileManager.prototype.getActiveProfile = function()
{
	var activeProfile = store.get( 'active_profile' );
	var profiles = store.get( 'profiles' );
	return profiles[activeProfile];
}

ProfileManager.prototype.setActiveProfile = function( profileName )
{
	store.set( 'active_profile', profileName );
}