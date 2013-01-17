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
	if(typeof profiles == "object" && profiles.hasOwnProperty( profileName ) ) {
		throw 'already_exists';
	}
	
	profiles[profileName] = values;
	this.saveProfiles(profiles);
}

ProfileManager.prototype.edit = function( profileName, values, newProfileName )
{
	var profiles = store.get( 'profiles' );
	
	if( !profiles[profileName] ) {
		throw 'profile_missing';
	}
	
	if( profileName != newProfileName ) {
		if( profiles.hasOwnProperty( newProfileName ) ) {
			throw 'renamed_exists';
		}
		
		delete profiles[profileName];
		profileName = newProfileName;
	}
	
	profiles[profileName] = values;
	this.saveProfiles(profiles);
}

ProfileManager.prototype.remove = function( profileName )
{
	var profiles = store.get( 'profiles' );
	if( !profiles.hasOwnProperty( profileName ) ) {
		throw 'profile_missing';
	}
	
	delete profiles[profileName];
	this.saveProfiles(profiles);
	
	var newActive = first( profiles );
	this.setActiveProfile( newActive );
	return newActive;
}

ProfileManager.prototype.setProfile = function( profileData )
{
	var profiles = store.get( 'profiles' );
	profiles[profileData.name] = profileData.values;
	this.saveProfiles(profiles);
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
	
	var password = getPref("profile_pass" + profileName);
	if(password === null || password === "null" || typeof password == "undefined") {
		password = "";
	}
	profiles[profileName]["password"] = password;
	
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

ProfileManager.prototype.contains = function( profileName )
{
	var profiles = store.get( 'profiles' );
	return profiles.hasOwnProperty( profileName );
}

ProfileManager.prototype.saveProfiles = function(profiles) {
	//discard passwords
	for(var profileName in profiles) {
		var profile = profiles[profileName];
		if(profile.hasOwnProperty("password")) {
			setPref("profile_pass" + profileName, profile.password);
			delete profile.password;
		}
	}
	store.set( 'profiles', profiles );
}